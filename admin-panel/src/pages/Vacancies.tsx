import { useState, useEffect } from 'preact/hooks'
import { fetchVacancies, deleteVacancy, Vacancy } from '../services/vacanciesService'
import { formatDate } from '../helpers'
import { useI18n } from '../hooks/useI18n'

export function Vacancies() {
  const { t } = useI18n()
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    handleFetchVacancies()
  }, [])

  const handleFetchVacancies = async () => {
    const result = await fetchVacancies()
    if (result.success && result.data) {
      // Debug logging to check date format
      if (result.data.length > 0) {
        console.log('Sample vacancy data:', result.data[0])
        console.log('CreatedAt value:', result.data[0].createdAt, 'Type:', typeof result.data[0].createdAt)
      }
      setVacancies(result.data)
    } else {
      setError(result.error?.message || t('failed_to_fetch_vacancies'))
    }
    setLoading(false)
  }

  const handleDeleteVacancy = async (vacancyId: number, vacancyTitle: string) => {
    // Confirm deletion
    if (!confirm(t('confirm_delete_vacancy', { title: vacancyTitle }))) {
      return
    }

    // Add to deleting set
    setDeletingIds(prev => new Set([...prev, vacancyId]))
    setError(null)

    try {
      const result = await deleteVacancy(vacancyId)
      
      if (result.success) {
        // Remove from local state
        setVacancies(prev => prev.filter(v => v.id !== vacancyId))
      } else {
        setError(result.error?.message || t('failed_to_load', { item: 'vacancy' }))
      }
    } catch (err) {
      setError(t('network_error_delete_vacancy'))
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(vacancyId)
        return newSet
      })
    }
  }

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-orange-100 text-orange-800'
      case 'expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('job_vacancies_title')}</h1>
            <p className="text-gray-600">{t('job_vacancies_subtitle')}</p>
          </div>
          <button
            onClick={() => window.location.href = '/vacancies/new'}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            {t('add_new_vacancy')}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 font-medium">{t('loading_vacancies')}</p>
              </div>
            </div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('no_vacancies_yet')}</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {t('no_vacancies_description')}
              </p>
              <button
                onClick={() => window.location.href = '/vacancies/new'}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                {t('create_first_vacancy')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {vacancies.map((vacancy, index) => (
                <div key={vacancy.id} className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${index === 0 ? '' : 'border-t border-gray-100'}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer transition-colors">
                            {vacancy.title}
                          </h3>
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              vacancy.status === 'active'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                vacancy.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                              }`}></div>
                              {vacancy.status === 'active' ? t('active') : t('inactive')}
                            </span>
                            <span className="text-gray-500 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"/>
                              </svg>
                              {t('created')} {vacancy.createdAt ? formatDate(vacancy.createdAt) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 leading-relaxed mb-4 text-sm">
                        {truncateText(vacancy.description, 200)}
                      </p>

                      {/* Skills Preview */}
                      {vacancy.requirements.technicalSkills && vacancy.requirements.technicalSkills.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                            </svg>
                            {t('technical_skills_required')}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {vacancy.requirements.technicalSkills.slice(0, 6).map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(skill.level)} border`}
                              >
                                {skill.name}
                                {skill.mandatory && (
                                  <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                  </svg>
                                )}
                              </span>
                            ))}
                            {vacancy.requirements.technicalSkills.length > 6 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                +{vacancy.requirements.technicalSkills.length - 6} {t('more')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Experience Requirements */}
                      {vacancy.requirements.experience && vacancy.requirements.experience.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"/>
                            </svg>
                            {t('experience_requirements')}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {vacancy.requirements.experience.slice(0, 3).map((exp, expIndex) => (
                              <span
                                key={expIndex}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                              >
                                {exp.domain} ({exp.minimumYears}+ {t('years')})
                                {exp.preferred && (
                                  <span className="ml-1 text-blue-600">★</span>
                                )}
                              </span>
                            ))}
                            {vacancy.requirements.experience.length > 3 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                +{vacancy.requirements.experience.length - 3} {t('more')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Evaluation Weights */}
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                          </svg>
                          {t('evaluation_criteria')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            {t('technical')}: {vacancy.evaluationWeights.technicalSkills}%
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            {t('communication')}: {vacancy.evaluationWeights.communication}%
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            {t('problem_solving')}: {vacancy.evaluationWeights.problemSolving}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[120px]">
                      <button 
                        onClick={() => window.location.href = `/vacancies/edit/${vacancy.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        {t('edit')}
                      </button>
                      <button 
                        onClick={() => handleDeleteVacancy(vacancy.id, vacancy.title)}
                        disabled={deletingIds.has(vacancy.id)}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {deletingIds.has(vacancy.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                            {t('deleting')}
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            {t('delete')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
