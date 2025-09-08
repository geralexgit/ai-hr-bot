/**
 * Get translated name for a prompt
 */
export function getTranslatedPromptName(promptName: string, t: any): string {
  const translationKey = `prompt_${promptName}_name`
  const translated = t(translationKey)
  
  // If translation key doesn't exist, return the original name with proper formatting
  if (translated === translationKey) {
    return promptName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  return translated
}

/**
 * Get translated description for a prompt
 */
export function getTranslatedPromptDescription(promptName: string, t: any): string {
  const translationKey = `prompt_${promptName}_description`
  const translated = t(translationKey)
  
  // If translation key doesn't exist, return empty string
  if (translated === translationKey) {
    return ''
  }
  
  return translated
}

/**
 * Get translated template content for a prompt
 */
export function getTranslatedPromptTemplate(promptName: string, t: any): string {
  const translationKey = `prompt_${promptName}_template`
  const translated = t(translationKey)
  
  // If translation key doesn't exist, return empty string
  if (translated === translationKey) {
    return ''
  }
  
  return translated
}

/**
 * Check if a prompt has translation support
 */
export function hasPromptTranslation(promptName: string, t: any): boolean {
  const nameKey = `prompt_${promptName}_name`
  return t(nameKey) !== nameKey
}

/**
 * Get all supported prompt names that have translations
 */
export function getSupportedPromptNames(): string[] {
  return ['cv_analysis', 'interview_chat', 'resume_analysis']
}
