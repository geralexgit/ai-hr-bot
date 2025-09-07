import { useState, useEffect } from 'preact/hooks'
import i18n from '../i18n'

export function useI18n() {
  const [isReady, setIsReady] = useState(i18n.isInitialized)
  const [language, setLanguage] = useState(i18n.language || 'ru')

  useEffect(() => {
    const checkReady = () => {
      if (i18n.isInitialized) {
        setIsReady(true)
        setLanguage(i18n.language)
      } else {
        // Wait a bit and check again
        setTimeout(checkReady, 10)
      }
    }

    if (!isReady) {
      checkReady()
    }

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng)
    }

    i18n.on('languageChanged', handleLanguageChange)

    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [isReady])

  const t = (key: string, options?: any): string => {
    if (!isReady) {
      return key // Return the key if not ready
    }
    const result = i18n.t(key, options)
    return typeof result === 'string' ? result : key
  }

  const changeLanguage = (lng: string) => {
    return i18n.changeLanguage(lng)
  }

  return {
    t,
    i18n: {
      language,
      changeLanguage
    },
    isReady
  }
}
