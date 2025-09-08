import { useState, useEffect } from 'preact/hooks'
import { 
  fetchCandidates, 
  Candidate, 
  formatCandidateName, 
  getRecommendationBadgeColor,
  getCvFileUrl
} from '../services/candidatesService'
import { DialogueHistoryModal } from '../components/DialogueHistoryModal'
import { InterviewResultsModal } from '../components/InterviewResultsModal'
import { useI18n } from '../hooks/useI18n'

export function Candidates() {
  const { t } = useI18n()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  
  // Modal state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | undefined>(undefined)
  const [selectedVacancyTitle, setSelectedVacancyTitle] = useState<string | undefined>(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Interview Results Modal state
  const [isInterviewResultsModalOpen, setIsInterviewResultsModalOpen] = useState(false)
  const [selectedCandidateForResults, setSelectedCandidateForResults] = useState<Candidate | null>(null)

  const loadCandidates = async (page: number = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchCandidates(page, 20)
      
      if (response.success && response.data) {
        setCandidates(response.data.candidates)
        setPagination(response.data.pagination)
        setCurrentPage(page)
      } else {
        setError(response.error?.message || t('failed_to_load_candidates'))
      }
    } catch (err) {
      setError(t('failed_to_load_candidates'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCandidates()
  }, [])

  const handlePageChange = (page: number) => {
    loadCandidates(page)
  }

  const handleCandidateClick = (candidate: Candidate) => {
    // For backward compatibility, use the first application if available
    setSelectedCandidate(candidate)
    setSelectedVacancyId(candidate.applications[0]?.vacancy.id)
    setSelectedVacancyTitle(candidate.applications[0]?.vacancy.title)
    setIsModalOpen(true)
  }

  const handleApplicationClick = (candidate: Candidate, vacancyId: number, vacancyTitle: string, event: Event) => {
    event.stopPropagation() // Prevent row click
    setSelectedCandidate(candidate)
    setSelectedVacancyId(vacancyId)
    setSelectedVacancyTitle(vacancyTitle)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCandidate(null)
    setSelectedVacancyId(undefined)
    setSelectedVacancyTitle(undefined)
  }

  const handleCvPreview = (candidate: Candidate, event: Event) => {
    event.stopPropagation() // Prevent row click
    const cvUrl = getCvFileUrl(candidate)
    if (cvUrl) {
      window.open(cvUrl, '_blank')
    }
  }

  const handleInterviewResultsClick = (candidate: Candidate, event: Event) => {
    event.stopPropagation() // Prevent row click
    setSelectedCandidateForResults(candidate)
    setIsInterviewResultsModalOpen(true)
  }

  const handleCloseInterviewResultsModal = () => {
    setIsInterviewResultsModalOpen(false)
    setSelectedCandidateForResults(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">{t('candidates_title')}</h1>
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-secondary-600">{t('loading_candidates')}</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">{t('candidates_title')}</h1>
        <div className="card">
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">⚠️ {t('error_occurred')}</div>
            <p className="text-secondary-600">{error}</p>
            <button 
              onClick={() => loadCandidates()}
              className="mt-4 btn-primary"
            >
              {t('try_again')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">{t('candidates_title')}</h1>
          <p className="text-sm text-secondary-600 mt-1">
            {t('candidates_subtitle')}
          </p>
        </div>
        <div className="text-sm text-secondary-600">
          {t('total_candidates_count', { count: pagination.total })}
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">{t('no_candidates_yet')}</h3>
            <p className="text-secondary-600">{t('no_candidates_description')}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      {t('candidate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      {t('applications')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      CV/Resume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Результаты интервью
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      {t('registered')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {candidates.map((candidate) => (
                    <tr 
                      key={candidate.id} 
                      className="hover:bg-secondary-50 cursor-pointer transition-colors"
                      onClick={() => handleCandidateClick(candidate)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {formatCandidateName(candidate).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-secondary-900">
                              {formatCandidateName(candidate)}
                            </div>
                            {candidate.username && (
                              <div className="text-sm text-secondary-500">
                                @{candidate.username}
                              </div>
                            )}
                            <div className="text-xs text-secondary-400">
                              ID: {candidate.telegramUserId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {candidate.applications.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-xs text-secondary-500 mb-2">
                              {candidate.applications.length} application{candidate.applications.length !== 1 ? 's' : ''}
                            </div>
                            {candidate.applications.map((application) => (
                              <div 
                                key={`${candidate.id}-${application.vacancy.id}`} 
                                className="flex items-center justify-between p-2 bg-secondary-50 rounded-md hover:bg-secondary-100 cursor-pointer transition-colors"
                                onClick={(e) => handleApplicationClick(candidate, application.vacancy.id, application.vacancy.title, e)}
                                title="Click to view dialogue history for this application"
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-secondary-900">
                                    {application.vacancy.title}
                                  </div>
                                  <div className="text-xs text-secondary-500">
                                    Applied: {new Date(application.applicationDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  {application.evaluation ? (
                                    <>
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecommendationBadgeColor(application.evaluation.recommendation)}`}>
                                        {application.evaluation.recommendation}
                                      </span>
                                      <span className="text-xs text-secondary-600 font-medium">
                                        {application.evaluation.overallScore}%
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-secondary-500 italic">{t('not_evaluated')}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-secondary-500 italic">{t('no_applications')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {candidate.cvFileName ? (
                          <button
                            onClick={(e) => handleCvPreview(candidate, e)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                            title={`Preview CV: ${candidate.cvFileName}`}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {t('preview_cv')}
                          </button>
                        ) : (
                          <span className="text-sm text-secondary-500 italic">{t('no_cv_uploaded')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => handleInterviewResultsClick(candidate, e)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                          title="Просмотр результатов интервью"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Результаты
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {formatDate(candidate.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-secondary-700">
                {t('showing_results', { 
                  from: ((currentPage - 1) * pagination.limit) + 1, 
                  to: Math.min(currentPage * pagination.limit, pagination.total), 
                  total: pagination.total 
                })}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('previous')}
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        pageNum === currentPage
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-secondary-300 hover:bg-secondary-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogue History Modal */}
      {selectedCandidate && (
        <DialogueHistoryModal
          candidateId={selectedCandidate.id}
          candidateName={formatCandidateName(selectedCandidate)}
          vacancyId={selectedVacancyId}
          vacancyTitle={selectedVacancyTitle}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Interview Results Modal */}
      {selectedCandidateForResults && (
        <InterviewResultsModal
          candidateId={selectedCandidateForResults.id}
          candidateName={formatCandidateName(selectedCandidateForResults)}
          isOpen={isInterviewResultsModalOpen}
          onClose={handleCloseInterviewResultsModal}
        />
      )}
    </div>
  )
}
