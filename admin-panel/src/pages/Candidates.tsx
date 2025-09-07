import { useState, useEffect } from 'preact/hooks'
import { 
  fetchCandidates, 
  Candidate, 
  formatCandidateName, 
  getRecommendationBadgeColor 
} from '../services/candidatesService'
import { DialogueHistoryModal } from '../components/DialogueHistoryModal'

export function Candidates() {
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
  const [isModalOpen, setIsModalOpen] = useState(false)

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
        setError(response.error?.message || 'Failed to load candidates')
      }
    } catch (err) {
      setError('Failed to load candidates')
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
    setSelectedCandidate(candidate)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCandidate(null)
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
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">Candidates</h1>
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-secondary-600">Loading candidates...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">Candidates</h1>
        <div className="card">
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">⚠️ Error</div>
            <p className="text-secondary-600">{error}</p>
            <button 
              onClick={() => loadCandidates()}
              className="mt-4 btn-primary"
            >
              Try Again
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
          <h1 className="text-3xl font-bold text-secondary-900">Candidates</h1>
          <p className="text-sm text-secondary-600 mt-1">
            Click on any candidate to view their conversation history
          </p>
        </div>
        <div className="text-sm text-secondary-600">
          Total: {pagination.total} candidates
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No candidates yet</h3>
            <p className="text-secondary-600">Candidates will appear here once they start applying for vacancies.</p>
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
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Vacancy Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Evaluation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Registered
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
                        {candidate.vacancy ? (
                          <div className="text-sm text-secondary-900">
                            {candidate.vacancy.title}
                          </div>
                        ) : (
                          <span className="text-sm text-secondary-500 italic">No applications</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {candidate.evaluation ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecommendationBadgeColor(candidate.evaluation.recommendation)}`}>
                            {candidate.evaluation.recommendation}
                          </span>
                        ) : (
                          <span className="text-sm text-secondary-500 italic">Not evaluated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {candidate.evaluation ? (
                          <div className="text-sm text-secondary-900">
                            {candidate.evaluation.overallScore}%
                          </div>
                        ) : (
                          <span className="text-sm text-secondary-500">-</span>
                        )}
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
                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
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
                  Next
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
          vacancyId={selectedCandidate.vacancy?.id}
          vacancyTitle={selectedCandidate.vacancy?.title}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
