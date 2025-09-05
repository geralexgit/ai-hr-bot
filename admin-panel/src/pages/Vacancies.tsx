import { useState, useEffect } from 'preact/hooks'
import { fetchVacancies, deleteVacancy, Vacancy } from '../services/vacanciesService'
import { formatDate } from '../helpers'

export function Vacancies() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [expandedVacancy, setExpandedVacancy] = useState<number | null>(null)

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
      setError(result.error?.message || 'Failed to fetch vacancies')
    }
    setLoading(false)
  }

  const handleDeleteVacancy = async (vacancyId: number, vacancyTitle: string) => {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the vacancy "${vacancyTitle}"? This action cannot be undone.`)) {
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
        setError(result.error?.message || 'Failed to delete vacancy')
      }
    } catch (err) {
      setError('Network error occurred while deleting vacancy')
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(vacancyId)
        return newSet
      })
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const toggleVacancyExpansion = (vacancyId: number) => {
    setExpandedVacancy(expandedVacancy === vacancyId ? null : vacancyId)
  }

  const getTechnicalSkillsPreview = (vacancy: Vacancy) => {
    const skills = vacancy.requirements?.technicalSkills || []
    if (skills.length === 0) return 'No technical skills specified'
    if (skills.length <= 3) return skills.map(s => s.name).join(', ')
    return `${skills.slice(0, 3).map(s => s.name).join(', ')} +${skills.length - 3} more`
  }

  const getExperiencePreview = (vacancy: Vacancy) => {
    const experience = vacancy.requirements?.experience || []
    if (experience.length === 0) return 'No experience requirements'
    const minYears = Math.min(...experience.map(e => e.minimumYears))
    const maxYears = Math.max(...experience.map(e => e.minimumYears))
    if (minYears === maxYears) return `${minYears}+ years`
    return `${minYears}-${maxYears} years`
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">Vacancies</h1>
        <button
          onClick={() => window.location.href = '/vacancies/new'}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Add New Vacancy
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-secondary-600">Loading vacancies...</span>
        </div>
      ) : vacancies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="mx-auto w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No vacancies yet</h3>
          <p className="text-secondary-600 mb-6">Get started by creating your first job vacancy.</p>
          <button
            onClick={() => window.location.href = '/vacancies/new'}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Vacancy
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {vacancies.map((vacancy) => (
            <div key={vacancy.id} className="bg-white rounded-lg shadow-sm border border-secondary-200 hover:shadow-md transition-shadow duration-200">
              {/* Header */}
              <div className="p-6 border-b border-secondary-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-secondary-900 mb-2">{vacancy.title}</h3>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        vacancy.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mr-1.5 ${
                          vacancy.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                        }`}></span>
                        {vacancy.status.charAt(0).toUpperCase() + vacancy.status.slice(1)}
                      </span>
                      <span className="text-secondary-500 text-sm">
                        Created: {formatDate(vacancy.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button 
                      onClick={() => window.location.href = `/vacancies/edit/${vacancy.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-secondary-600 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteVacancy(vacancy.id, vacancy.title)}
                      disabled={deletingIds.has(vacancy.id)}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {deletingIds.has(vacancy.id) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Description Preview */}
                <p className="text-secondary-600 leading-relaxed">
                  {expandedVacancy === vacancy.id 
                    ? vacancy.description 
                    : truncateText(vacancy.description, 150)
                  }
                </p>

                {vacancy.description.length > 150 && (
                  <button
                    onClick={() => toggleVacancyExpansion(vacancy.id)}
                    className="text-primary-600 text-sm mt-2 hover:text-primary-700 font-medium"
                  >
                    {expandedVacancy === vacancy.id ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              {/* Quick Info */}
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  {/* Technical Skills */}
                  <div>
                    <h4 className="text-sm font-medium text-secondary-700 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Technical Skills
                    </h4>
                    <p className="text-sm text-secondary-600">{getTechnicalSkillsPreview(vacancy)}</p>
                  </div>

                  {/* Experience */}
                  <div>
                    <h4 className="text-sm font-medium text-secondary-700 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Experience Required
                    </h4>
                    <p className="text-sm text-secondary-600">{getExperiencePreview(vacancy)}</p>
                  </div>

                  {/* Evaluation Weights */}
                  <div>
                    <h4 className="text-sm font-medium text-secondary-700 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Evaluation Focus
                    </h4>
                    <div className="flex space-x-4 text-xs">
                      <span className="text-secondary-600">
                        Technical: <span className="font-medium">{vacancy.evaluationWeights?.technicalSkills || 50}%</span>
                      </span>
                      <span className="text-secondary-600">
                        Communication: <span className="font-medium">{vacancy.evaluationWeights?.communication || 30}%</span>
                      </span>
                      <span className="text-secondary-600">
                        Problem Solving: <span className="font-medium">{vacancy.evaluationWeights?.problemSolving || 20}%</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedVacancy === vacancy.id && (
                  <div className="mt-6 pt-6 border-t border-secondary-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Detailed Technical Skills */}
                      {vacancy.requirements?.technicalSkills && vacancy.requirements.technicalSkills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-secondary-700 mb-3">Required Technical Skills</h4>
                          <div className="space-y-2">
                            {vacancy.requirements.technicalSkills.map((skill, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-secondary-600">{skill.name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    skill.level === 'expert' ? 'bg-red-100 text-red-800' :
                                    skill.level === 'advanced' ? 'bg-orange-100 text-orange-800' :
                                    skill.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {skill.level}
                                  </span>
                                  {skill.mandatory && (
                                    <span className="text-red-600 text-xs font-medium">Required</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Soft Skills */}
                      {vacancy.requirements?.softSkills && vacancy.requirements.softSkills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-secondary-700 mb-3">Soft Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {vacancy.requirements.softSkills.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
