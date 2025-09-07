import { useState, useEffect } from 'preact/hooks'
import { PromptSetting, fetchPromptSettings, fetchPromptCategories, createPromptSetting, updatePromptSetting, deletePromptSetting, CreatePromptSettingDto, UpdatePromptSettingDto } from '../services/promptSettingsService'

interface PromptEditModalProps {
  prompt: PromptSetting | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreatePromptSettingDto | UpdatePromptSettingDto) => Promise<void>
  categories: string[]
}

function PromptEditModal({ prompt, isOpen, onClose, onSave, categories }: PromptEditModalProps) {
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
            {prompt ? 'Edit Prompt' : 'Create New Prompt'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Name *
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
                Category *
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
                  <option value="__new__">+ New Category</option>
                </select>
                
                {newCategory !== '' && (
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory((e.target as HTMLInputElement).value)}
                    placeholder="Enter new category name"
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={saving}
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description
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
              Prompt Template *
            </label>
            <div className="mb-2 text-sm text-secondary-600">
              Use placeholders like {`{{variable_name}}`} for dynamic content
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
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : (prompt ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Settings() {
  const [prompts, setPrompts] = useState<PromptSetting[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [editingPrompt, setEditingPrompt] = useState<PromptSetting | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

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
        setError(promptsResponse.error?.message || 'Failed to load prompts')
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

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
    if (!confirm('Are you sure you want to delete this prompt?')) {
      return
    }

    try {
      const response = await deletePromptSetting(id)
      if (response.success) {
        await loadData()
      } else {
        alert(response.error?.message || 'Failed to delete prompt')
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
      alert('Failed to delete prompt')
    }
  }

  const filteredPrompts = selectedCategory === 'all' 
    ? prompts 
    : prompts.filter(p => p.category === selectedCategory)

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">LLM Prompt Settings</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-secondary-600">Loading prompts...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">LLM Prompt Settings</h1>
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <h3 className="text-error-800 font-semibold mb-2">Error Loading Prompts</h3>
          <p className="text-error-600">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-4 py-2 bg-error-600 text-white rounded hover:bg-error-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">LLM Prompt Settings</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          + New Prompt
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Filter by Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory((e.target as HTMLSelectElement).value)}
          className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Categories</option>
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
            {selectedCategory === 'all' ? 'No prompts found' : `No prompts found in ${selectedCategory} category`}
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <div key={prompt.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-secondary-900">{prompt.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                      {prompt.category}
                    </span>
                    {!prompt.isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-error-100 text-error-800 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  {prompt.description && (
                    <p className="text-secondary-600 mb-3">{prompt.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingPrompt(prompt)}
                    className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(prompt.id)}
                    className="px-3 py-1 text-sm text-error-600 hover:text-error-800 hover:bg-error-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="bg-secondary-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-secondary-700 mb-2">Prompt Template:</h4>
                <pre className="text-sm text-secondary-900 whitespace-pre-wrap font-mono bg-white p-3 rounded border max-h-40 overflow-y-auto">
                  {prompt.promptTemplate}
                </pre>
              </div>
              
              <div className="mt-3 text-xs text-secondary-500">
                Created: {new Date(prompt.createdAt).toLocaleString()} | 
                Updated: {new Date(prompt.updatedAt).toLocaleString()}
              </div>
            </div>
          ))
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
    </div>
  )
}
