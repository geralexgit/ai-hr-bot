import { useState, useEffect } from 'preact/hooks'
import { 
  fetchCandidateInterviewResults, 
  InterviewResult, 
  formatInterviewStatus,
  getInterviewStatusBadgeColor,
  calculateOverallAssessmentScore
} from '../services/interviewResultsService'

interface InterviewResultsModalProps {
  candidateId: number
  candidateName: string
  isOpen: boolean
  onClose: () => void
}

export function InterviewResultsModal({ 
  candidateId, 
  candidateName, 
  isOpen, 
  onClose 
}: InterviewResultsModalProps) {
  const [interviewResults, setInterviewResults] = useState<InterviewResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedResult, setExpandedResult] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && candidateId) {
      loadInterviewResults()
    }
  }, [isOpen, candidateId])

  const loadInterviewResults = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchCandidateInterviewResults(candidateId)
      
      if (response.success && response.data) {
        setInterviewResults(response.data.interviewResults)
      } else {
        setError(response.error?.message || 'Failed to load interview results')
      }
    } catch (err) {
      setError('Failed to load interview results')
    } finally {
      setLoading(false)
    }
  }

  const toggleResultExpansion = (resultId: number) => {
    setExpandedResult(expandedResult === resultId ? null : resultId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Не указано'
    if (minutes < 60) return `${minutes} мин.`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}ч ${remainingMinutes}м`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-secondary-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-secondary-900">
              🎯 Результаты интервью
            </h2>
            <p className="text-sm text-secondary-600 mt-1">
              Кандидат: {candidateName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-secondary-600">Загрузка результатов...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">⚠️ Ошибка</div>
              <p className="text-secondary-600">{error}</p>
              <button 
                onClick={loadInterviewResults}
                className="mt-4 btn-primary"
              >
                Попробовать снова
              </button>
            </div>
          ) : interviewResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                Результатов интервью пока нет
              </h3>
              <p className="text-secondary-600">
                Кандидат еще не проходил интервью или результаты еще не обработаны.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {interviewResults.map((result) => (
                <div key={result.id} className="border border-secondary-200 rounded-lg overflow-hidden">
                  {/* Result Header */}
                  <div 
                    className="px-6 py-4 bg-secondary-50 cursor-pointer hover:bg-secondary-100 transition-colors"
                    onClick={() => toggleResultExpansion(result.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-secondary-900">
                            {result.vacancy?.title || 'Неизвестная вакансия'}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInterviewStatusBadgeColor(result.interviewStatus)}`}>
                            {formatInterviewStatus(result.interviewStatus)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-secondary-600">
                          <div>
                            <span className="font-medium">Завершено:</span> {result.completionPercentage}%
                          </div>
                          <div>
                            <span className="font-medium">Вопросов:</span> {result.totalQuestions}
                          </div>
                          <div>
                            <span className="font-medium">Ответов:</span> {result.totalAnswers}
                          </div>
                          <div>
                            <span className="font-medium">Длительность:</span> {formatDuration(result.interviewDurationMinutes)}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-secondary-500">
                          Дата: {formatDate(result.createdAt)}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center">
                        {result.evaluation && (
                          <div className="text-right mr-4">
                            <div className="text-lg font-semibold text-primary-600">
                              {result.evaluation.overallScore}%
                            </div>
                            <div className="text-xs text-secondary-500">
                              {result.evaluation.recommendation}
                            </div>
                          </div>
                        )}
                        <svg 
                          className={`w-5 h-5 text-secondary-400 transition-transform ${
                            expandedResult === result.id ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedResult === result.id && (
                    <div className="px-6 py-4 bg-white border-t border-secondary-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Assessment Scores */}
                        <div>
                          <h4 className="font-medium text-secondary-900 mb-3">📊 Оценки</h4>
                          <div className="space-y-2">
                            {result.technicalAssessmentScore !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-secondary-600">Технические навыки:</span>
                                <span className="font-medium">{result.technicalAssessmentScore}/100</span>
                              </div>
                            )}
                            {result.softSkillsAssessmentScore !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-secondary-600">Мягкие навыки:</span>
                                <span className="font-medium">{result.softSkillsAssessmentScore}/100</span>
                              </div>
                            )}
                            {(() => {
                              const overallScore = calculateOverallAssessmentScore(result);
                              return overallScore !== null && (
                                <div className="flex justify-between items-center pt-2 border-t border-secondary-200">
                                  <span className="text-sm font-medium text-secondary-900">Общая оценка:</span>
                                  <span className="font-semibold text-primary-600">{overallScore}/100</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div>
                          <h4 className="font-medium text-secondary-900 mb-3">ℹ️ Дополнительная информация</h4>
                          <div className="space-y-2 text-sm">
                            {result.candidateSatisfactionRating && (
                              <div>
                                <span className="text-secondary-600">Удовлетворенность кандидата:</span>
                                <span className="ml-2 font-medium">{result.candidateSatisfactionRating}/5 ⭐</span>
                              </div>
                            )}
                            {result.followUpRequired && (
                              <div>
                                <span className="text-secondary-600">Требуется дополнительное собеседование:</span>
                                <span className="ml-2 text-orange-600 font-medium">Да</span>
                                {result.followUpDate && (
                                  <div className="text-xs text-secondary-500 ml-2">
                                    Дата: {new Date(result.followUpDate).toLocaleDateString('ru-RU')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Feedback and Notes */}
                      {(result.finalFeedback || result.overallImpression || result.nextSteps || result.interviewerNotes) && (
                        <div className="mt-6 pt-6 border-t border-secondary-200">
                          <div className="grid grid-cols-1 gap-4">
                            {result.finalFeedback && (
                              <div>
                                <h4 className="font-medium text-secondary-900 mb-2">📝 Финальный отзыв</h4>
                                <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-md">
                                  {result.finalFeedback}
                                </p>
                              </div>
                            )}
                            {result.overallImpression && (
                              <div>
                                <h4 className="font-medium text-secondary-900 mb-2">💭 Общее впечатление</h4>
                                <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-md">
                                  {result.overallImpression}
                                </p>
                              </div>
                            )}
                            {result.nextSteps && (
                              <div>
                                <h4 className="font-medium text-secondary-900 mb-2">🎯 Следующие шаги</h4>
                                <p className="text-sm text-secondary-700 bg-blue-50 p-3 rounded-md">
                                  {result.nextSteps}
                                </p>
                              </div>
                            )}
                            {result.interviewerNotes && (
                              <div>
                                <h4 className="font-medium text-secondary-900 mb-2">📋 Заметки интервьюера</h4>
                                <p className="text-sm text-secondary-700 bg-yellow-50 p-3 rounded-md">
                                  {result.interviewerNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-secondary-200 bg-secondary-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
