import { useState, useEffect } from 'preact/hooks'
import { useI18n } from '../hooks/useI18n'
import { PromptSetting, fetchPromptSettings, fetchPromptCategories, createPromptSetting, updatePromptSetting, deletePromptSetting, CreatePromptSettingDto, UpdatePromptSettingDto } from '../services/promptSettingsService'
import { SystemSetting, fetchSettings, testLLMConnection, batchUpdateSettings } from '../services/settingsService'
import { getTranslatedPromptName, getTranslatedPromptDescription, hasPromptTranslation } from '../utils/promptTranslations'

interface PromptEditModalProps {
  prompt: PromptSetting | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreatePromptSettingDto | UpdatePromptSettingDto) => Promise<void>
  categories: string[]
}

function PromptEditModal({ prompt, isOpen, onClose, onSave, categories }: PromptEditModalProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    promptTemplate: '',
    category: '',
    isActive: true
  })
  const [saving, setSaving] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    if (prompt) {
      setFormData({
        name: prompt.name,
        description: prompt.description || '',
        promptTemplate: prompt.promptTemplate,
        category: prompt.category,
        isActive: prompt.isActive
      })
    } else {
      setFormData({
        name: '',
        description: '',
        promptTemplate: '',
        category: categories[0] || '',
        isActive: true
      })
    }
  }, [prompt, categories])

  if (!isOpen) return null

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        category: newCategory || formData.category
      }
      await onSave(dataToSave)
      onClose()
    } catch (error) {
      console.error('Error saving prompt:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryChange = (e: Event) => {
    const target = e.target as HTMLSelectElement
    const value = target.value
    if (value === '__new__') {
      setNewCategory('')
    } else {
      setFormData({ ...formData, category: value })
      setNewCategory('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-900">
            {prompt ? t('edit_prompt') : t('create_new_prompt')}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {t('name')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: (e.target as HTMLInputElement).value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {t('category')} *
              </label>
              <div className="space-y-2">
                <select
                  value={newCategory ? '__new__' : formData.category}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={saving}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__new__">{t('new_category')}</option>
                </select>
                
                {newCategory !== '' && (
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory((e.target as HTMLInputElement).value)}
                    placeholder={t('enter_new_category')}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={saving}
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {t('description')}
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: (e.target as HTMLInputElement).value })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {t('prompt_template')} *
            </label>
            <div className="mb-2 text-sm text-secondary-600">
              {t('prompt_template_hint')}
            </div>
            <textarea
              value={formData.promptTemplate}
              onChange={(e) => setFormData({ ...formData, promptTemplate: (e.target as HTMLTextAreaElement).value })}
              rows={15}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              required
              disabled={saving}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: (e.target as HTMLInputElement).checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              disabled={saving}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-secondary-900">
              {t('active')}
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
              disabled={saving}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? t('saving') : (prompt ? t('update') : t('create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Settings() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'prompts' | 'llm'>('prompts')
  const [prompts, setPrompts] = useState<PromptSetting[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [editingPrompt, setEditingPrompt] = useState<PromptSetting | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // LLM Settings state
  const [llmSettings, setLlmSettings] = useState<SystemSetting[]>([])
  const [llmLoading, setLlmLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [promptsResponse, categoriesResponse] = await Promise.all([
        fetchPromptSettings(),
        fetchPromptCategories()
      ])

      if (promptsResponse.success && promptsResponse.data) {
        setPrompts(promptsResponse.data)
      } else {
        setError(promptsResponse.error?.message || t('failed_to_load', { item: 'prompts' }))
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unexpected_error'))
    } finally {
      setLoading(false)
    }
  }

  const loadLlmSettings = async () => {
    try {
      setLlmLoading(true)
      const response = await fetchSettings('llm')
      
      if (response.success && response.data) {
        setLlmSettings(response.data)
      } else {
        console.error('Failed to load LLM settings:', response.error?.message)
      }
    } catch (err) {
      console.error('Error loading LLM settings:', err)
    } finally {
      setLlmLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'llm') {
      loadLlmSettings()
    }
  }, [activeTab])

  const handleSavePrompt = async (data: CreatePromptSettingDto | UpdatePromptSettingDto) => {
    try {
      let response
      if (editingPrompt) {
        response = await updatePromptSetting(editingPrompt.id, data as UpdatePromptSettingDto)
      } else {
        response = await createPromptSetting(data as CreatePromptSettingDto)
      }

      if (response.success) {
        await loadData() // Reload data
        setEditingPrompt(null)
        setShowCreateModal(false)
      } else {
        throw new Error(response.error?.message || 'Failed to save prompt')
      }
    } catch (error) {
      console.error('Error saving prompt:', error)
      throw error
    }
  }

  const handleDeletePrompt = async (id: number) => {
    if (!confirm(t('settings_confirm_delete_prompt'))) {
      return
    }

    try {
      const response = await deletePromptSetting(id)
      if (response.success) {
        await loadData()
      } else {
        alert(response.error?.message || t('settings_failed_to_delete_prompt'))
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
      alert(t('settings_failed_to_delete_prompt'))
    }
  }

  const handleLlmSettingChange = (key: string, value: string) => {
    setLlmSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ))
  }

  const handleSaveLlmSettings = async (): Promise<boolean> => {
    try {
      setLlmLoading(true)
      const updates = llmSettings.map(setting => ({
        key: setting.key,
        value: setting.value
      }))

      const response = await batchUpdateSettings(updates)
      if (response.success) {
        setConnectionStatus({ success: true, message: t('llm_settings_saved') })
        setTimeout(() => setConnectionStatus(null), 3000)
        return true
      } else {
        setConnectionStatus({ success: false, message: response.error?.message || t('failed_to_save_settings') })
        return false
      }
    } catch (error) {
      console.error('Error saving LLM settings:', error)
      setConnectionStatus({ success: false, message: t('failed_to_save_settings') })
      return false
    } finally {
      setLlmLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true)
      setConnectionStatus(null)
      
      // Save current settings first
      const saveResult = await handleSaveLlmSettings()
      if (!saveResult) {
        setConnectionStatus({ success: false, message: t('failed_to_save_settings_before_test') })
        return
      }
      
      // Test connection
      const response = await testLLMConnection()
      if (response.success && response.data) {
        setConnectionStatus({ 
          success: response.data.connected, 
          message: response.data.connected ? 
            t('successfully_connected', { provider: response.data.provider }) : 
            (response.error?.message || t('connection_failed'))
        })
      } else {
        // Handle different error types more gracefully
        let errorMessage = response.error?.message || t('connection_test_failed')
        
        // Check if it's a network error
        if (response.error?.code === 'NETWORK_ERROR') {
          errorMessage = t('backend_not_available')
        }
        
        setConnectionStatus({ 
          success: false, 
          message: errorMessage
        })
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      const errorMessage = error instanceof Error ? error.message : t('connection_test_failed')
      setConnectionStatus({ success: false, message: errorMessage })
    } finally {
      setTestingConnection(false)
    }
  }

  const filteredPrompts = selectedCategory === 'all' 
    ? prompts 
    : prompts.filter(p => p.category === selectedCategory)

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">{t('llm_prompt_settings')}</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-secondary-600">{t('settings_loading_prompts')}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">{t('llm_prompt_settings')}</h1>
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <h3 className="text-error-800 font-semibold mb-2">{t('settings_error_loading_prompts')}</h3>
          <p className="text-error-600">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-4 py-2 bg-error-600 text-white rounded hover:bg-error-700 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">{t('settings_title')}</h1>
        {activeTab === 'prompts' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {t('new_prompt')}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-secondary-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('prompts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prompts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              {t('llm_prompts')}
            </button>
            <button
              onClick={() => setActiveTab('llm')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'llm'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              {t('llm_configuration')}
            </button>
          </nav>
        </div>
      </div>

      {/* Prompts Tab Content */}
      {activeTab === 'prompts' && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {t('filter_by_category')}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory((e.target as HTMLSelectElement).value)}
              className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{t('all_categories')}</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

      <div className="space-y-4">
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-12 text-secondary-500">
            {selectedCategory === 'all' ? t('no_prompts_found') : t('no_prompts_in_category', { category: selectedCategory })}
          </div>
        ) : (
          filteredPrompts.map((prompt) => {
            const hasTranslation = hasPromptTranslation(prompt.name, t)
            const displayName = hasTranslation ? getTranslatedPromptName(prompt.name, t) : prompt.name
            const displayDescription = hasTranslation ? getTranslatedPromptDescription(prompt.name, t) : prompt.description
            
            return (
            <div key={prompt.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-secondary-900">{displayName}</h3>
                    {hasTranslation && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {t('translated')}
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                      {prompt.category}
                    </span>
                    {!prompt.isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-error-100 text-error-800 rounded-full">
                        {t('settings_inactive')}
                      </span>
                    )}
                  </div>
                  {displayDescription && (
                    <p className="text-secondary-600 mb-3">{displayDescription}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingPrompt(prompt)}
                    className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(prompt.id)}
                    className="px-3 py-1 text-sm text-error-600 hover:text-error-800 hover:bg-error-50 rounded"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
              
              <div className="bg-secondary-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-secondary-700 mb-2">{t('prompt_template_label')}</h4>
                <pre className="text-sm text-secondary-900 whitespace-pre-wrap font-mono bg-white p-3 rounded border max-h-40 overflow-y-auto">
                  {prompt.promptTemplate}
                </pre>
              </div>
              
              <div className="mt-3 text-xs text-secondary-500">
                {t('created_updated', { 
                  created: new Date(prompt.createdAt).toLocaleString(), 
                  updated: new Date(prompt.updatedAt).toLocaleString() 
                })}
              </div>
            </div>
            )
          })
        )}
      </div>

      <PromptEditModal
        prompt={editingPrompt}
        isOpen={!!editingPrompt}
        onClose={() => setEditingPrompt(null)}
        onSave={handleSavePrompt}
        categories={categories}
      />

      <PromptEditModal
        prompt={null}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSavePrompt}
        categories={categories}
      />
        </>
      )}

      {/* LLM Configuration Tab Content */}
      {activeTab === 'llm' && (
        <div className="space-y-6">
          {llmLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-secondary-600">{t('settings_loading_llm_settings')}</span>
            </div>
          ) : (
            <>
              {/* Status Message */}
              {connectionStatus && (
                <div className={`p-4 rounded-lg ${
                  connectionStatus.success 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {connectionStatus.message}
                </div>
              )}

              {/* LLM Provider Selection */}
              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">{t('llm_provider')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      {t('current_provider')}
                    </label>
                    <select
                      value={llmSettings.find(s => s.key === 'llm_provider')?.value || 'ollama'}
                      onChange={(e) => handleLlmSettingChange('llm_provider', (e.target as HTMLSelectElement).value)}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={llmLoading}
                    >
                      <option value="ollama">{t('ollama_local')}</option>
                      <option value="perplexity">{t('perplexity_api')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ollama Settings */}
              {llmSettings.find(s => s.key === 'llm_provider')?.value === 'ollama' && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">{t('ollama_configuration')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('base_url')}
                      </label>
                      <input
                        type="text"
                        value={llmSettings.find(s => s.key === 'ollama_base_url')?.value || ''}
                        onChange={(e) => handleLlmSettingChange('ollama_base_url', (e.target as HTMLInputElement).value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="http://localhost:11434"
                        disabled={llmLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('model')}
                      </label>
                      <input
                        type="text"
                        value={llmSettings.find(s => s.key === 'ollama_model')?.value || ''}
                        onChange={(e) => handleLlmSettingChange('ollama_model', (e.target as HTMLInputElement).value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="gemma3n:latest"
                        disabled={llmLoading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Perplexity Settings */}
              {llmSettings.find(s => s.key === 'llm_provider')?.value === 'perplexity' && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">{t('perplexity_configuration')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('api_key')}
                      </label>
                      <input
                        type="password"
                        value={llmSettings.find(s => s.key === 'perplexity_api_key')?.value || ''}
                        onChange={(e) => handleLlmSettingChange('perplexity_api_key', (e.target as HTMLInputElement).value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder={t('enter_perplexity_api_key')}
                        disabled={llmLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        {t('model')}
                      </label>
                      <select
                        value={llmSettings.find(s => s.key === 'perplexity_model')?.value || 'sonar-pro'}
                        onChange={(e) => handleLlmSettingChange('perplexity_model', (e.target as HTMLSelectElement).value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={llmLoading}
                      >
                        <option value="sonar-pro">Sonar Pro (Recommended)</option>
                        <option value="sonar">Sonar</option>
                        <option value="llama-3.1-sonar-small-128k-online">Llama 3.1 Sonar Small 128K Online</option>
                        <option value="llama-3.1-sonar-large-128k-online">Llama 3.1 Sonar Large 128K Online</option>
                        <option value="llama-3.1-sonar-huge-128k-online">Llama 3.1 Sonar Huge 128K Online</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection || llmLoading}
                  className="px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-300 rounded-md hover:bg-primary-50 disabled:opacity-50"
                >
                  {testingConnection ? t('testing') : t('test_connection')}
                </button>
                <button
                  onClick={handleSaveLlmSettings}
                  disabled={llmLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {llmLoading ? t('saving') : t('save_settings')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
