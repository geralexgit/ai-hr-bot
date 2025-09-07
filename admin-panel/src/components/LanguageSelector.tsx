import { useI18n } from '../hooks/useI18n'

export function LanguageSelector() {
  const { i18n, t } = useI18n()

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language)
  }

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-secondary-600">
        {t('language')}:
      </label>
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange((e.target as HTMLSelectElement).value)}
        className="px-2 py-1 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="ru">{t('russian')}</option>
        <option value="en">{t('english')}</option>
      </select>
    </div>
  )
}
