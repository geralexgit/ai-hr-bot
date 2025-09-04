import { h } from 'preact'
import { useState } from 'preact/hooks'

interface CreateVacancyDto {
  title: string
  description: string
  requirements: {
    technicalSkills: Array<{
      name: string
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
      mandatory: boolean
      weight: number
    }>
    experience: Array<{
      domain: string
      minimumYears: number
      preferred: boolean
    }>
    education?: Array<{
      degree: string
      field?: string
      mandatory: boolean
    }>
    languages?: Array<{
      language: string
      level: 'basic' | 'intermediate' | 'advanced' | 'native'
      mandatory: boolean
    }>
    softSkills: string[]
  }
  evaluationWeights: {
    technicalSkills: number
    communication: number
    problemSolving: number
  }
  status?: 'active' | 'inactive'
}

export function AddVacancy() {
  const [formData, setFormData] = useState<CreateVacancyDto>({
    title: '',
    description: '',
    requirements: {
      technicalSkills: [],
      experience: [],
      softSkills: []
    },
    evaluationWeights: {
      technicalSkills: 50,
      communication: 30,
      problemSolving: 20
    },
    status: 'active'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vacancies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        window.location.href = '/vacancies'
      } else {
        setError(result.error?.message || 'Failed to create vacancy')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateRequirements = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value
      }
    }))
  }

  const updateEvaluationWeights = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      evaluationWeights: {
        ...prev.evaluationWeights,
        [field]: value
      }
    }))
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">Add New Vacancy</h1>
        <p className="text-secondary-600 mt-2">Create a new job vacancy for the HR bot system.</p>
      </div>

      <div className="card max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onInput={(e) => updateFormData('title', (e.target as HTMLInputElement).value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData('status', (e.target as HTMLSelectElement).value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onInput={(e) => updateFormData('description', (e.target as HTMLTextAreaElement).value)}
                rows={4}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Evaluation Weights */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Evaluation Weights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Technical Skills ({formData.evaluationWeights.technicalSkills}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.evaluationWeights.technicalSkills}
                  onInput={(e) => updateEvaluationWeights('technicalSkills', parseInt((e.target as HTMLInputElement).value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Communication ({formData.evaluationWeights.communication}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.evaluationWeights.communication}
                  onInput={(e) => updateEvaluationWeights('communication', parseInt((e.target as HTMLInputElement).value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Problem Solving ({formData.evaluationWeights.problemSolving}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.evaluationWeights.problemSolving}
                  onInput={(e) => updateEvaluationWeights('problemSolving', parseInt((e.target as HTMLInputElement).value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Soft Skills */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Soft Skills</h2>
            <input
              type="text"
              placeholder="Enter soft skills separated by commas"
              value={formData.requirements.softSkills.join(', ')}
              onInput={(e) => updateRequirements('softSkills', (e.target as HTMLInputElement).value.split(',').map(s => s.trim()))}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.location.href = '/vacancies'}
              className="px-4 py-2 text-secondary-600 border border-secondary-300 rounded-md hover:bg-secondary-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Vacancy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
