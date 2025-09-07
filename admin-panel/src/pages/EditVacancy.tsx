import { useState, useEffect } from 'preact/hooks'
import { fetchVacancyById, updateVacancy, UpdateVacancyDto } from '../services/vacanciesService'
import { useI18n } from '../hooks/useI18n'

export function EditVacancy() {
  const { t } = useI18n()
  const [formData, setFormData] = useState<UpdateVacancyDto>({
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
  const [loadingVacancy, setLoadingVacancy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vacancyId, setVacancyId] = useState<number | null>(null)

  useEffect(() => {
    // Get vacancy ID from URL (assuming format: /vacancies/edit/:id)
    const pathParts = window.location.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    if (id && !isNaN(Number(id))) {
      setVacancyId(Number(id))
      loadVacancy(Number(id))
    } else {
      setError(t('invalid_vacancy_id'))
      setLoadingVacancy(false)
    }
  }, [])

  const loadVacancy = async (id: number) => {
    try {
      const result = await fetchVacancyById(id)
      if (result.success && result.data) {
        const vacancy = result.data
        setFormData({
          title: vacancy.title,
          description: vacancy.description,
          requirements: vacancy.requirements,
          evaluationWeights: vacancy.evaluationWeights,
          status: vacancy.status
        })
      } else {
        setError(result.error?.message || t('failed_to_load_vacancy'))
      }
    } catch (err) {
      setError(t('network_error_loading_vacancy'))
    } finally {
      setLoadingVacancy(false)
    }
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!vacancyId) return

    setLoading(true)
    setError(null)

    try {
      const result = await updateVacancy(vacancyId, formData)

      if (result.success) {
        window.location.href = '/vacancies'
      } else {
        setError(result.error?.message || t('failed_to_update_vacancy'))
      }
    } catch (err) {
      setError(t('network_error_occurred'))
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
    // @ts-ignore - Temporary fix for type mismatch
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value
      }
    }))
  }

  const updateEvaluationWeights = (field: string, value: number) => {
    // @ts-ignore - Temporary fix for type mismatch
    setFormData(prev => ({
      ...prev,
      evaluationWeights: {
        ...prev.evaluationWeights,
        [field]: value
      }
    }))
  }

  if (loadingVacancy) {
    return (
      <div className="p-6">
        <p className="text-secondary-600">{t('loading_vacancy')}</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">{t('edit_vacancy_title')}</h1>
        <p className="text-secondary-600 mt-2">{t('edit_vacancy_subtitle')}</p>
      </div>

      <div className="card max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">{t('basic_information')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {t('title_required')}
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onInput={(e) => updateFormData('title', (e.target as HTMLInputElement).value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {t('status')}
                </label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => updateFormData('status', (e.target as HTMLSelectElement).value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">{t('form_active')}</option>
                  <option value="inactive">{t('form_inactive')}</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {t('description_required')}
              </label>
              <textarea
                value={formData.description || ''}
                onInput={(e) => updateFormData('description', (e.target as HTMLTextAreaElement).value)}
                rows={4}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Evaluation Weights */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">{t('evaluation_weights_title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {t('technical_skills_weight')} ({formData.evaluationWeights?.technicalSkills || 50}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.evaluationWeights?.technicalSkills || 50}
                  onInput={(e) => updateEvaluationWeights('technicalSkills', parseInt((e.target as HTMLInputElement).value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {t('communication_weight')} ({formData.evaluationWeights?.communication || 30}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.evaluationWeights?.communication || 30}
                  onInput={(e) => updateEvaluationWeights('communication', parseInt((e.target as HTMLInputElement).value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {t('problem_solving_weight')} ({formData.evaluationWeights?.problemSolving || 20}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.evaluationWeights?.problemSolving || 20}
                  onInput={(e) => updateEvaluationWeights('problemSolving', parseInt((e.target as HTMLInputElement).value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Soft Skills */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">{t('soft_skills_title')}</h2>
            <input
              type="text"
              placeholder={t('soft_skills_placeholder')}
              value={formData.requirements?.softSkills?.join(', ') || ''}
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
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? t('updating') : t('update_vacancy')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
