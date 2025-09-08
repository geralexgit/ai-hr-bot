import { useState, useEffect } from 'preact/hooks'
import { 
  fetchCandidateDialogues, 
  Dialogue, 
  DialogueHistoryResponse,
  formatMessageTime,
  getMessageTypeIcon,
  getSenderBadgeStyle,
  truncateMessage,
  formatBotMessage
} from '../services/dialogueService'

interface DialogueHistoryModalProps {
  candidateId: number
  candidateName: string
  vacancyId?: number
  vacancyTitle?: string
  isOpen: boolean
  onClose: () => void
}

export function DialogueHistoryModal({ 
  candidateId, 
  candidateName, 
  vacancyId, 
  vacancyTitle,
  isOpen, 
  onClose 
}: DialogueHistoryModalProps) {
  const [dialogueData, setDialogueData] = useState<DialogueHistoryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (isOpen && candidateId) {
      loadDialogues()
    }
  }, [isOpen, candidateId, vacancyId])

  const loadDialogues = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchCandidateDialogues(candidateId, vacancyId)
      
      if (response.success && response.data) {
        setDialogueData(response.data)
      } else {
        setError(response.error?.message || 'Failed to load dialogue history')
      }
    } catch (err) {
      setError('Failed to load dialogue history')
    } finally {
      setLoading(false)
    }
  }

  const toggleMessageExpansion = (messageId: number) => {
    const newExpanded = new Set(expandedMessages)
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId)
    } else {
      newExpanded.add(messageId)
    }
    setExpandedMessages(newExpanded)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const renderMessage = (dialogue: Dialogue) => {
    const isExpanded = expandedMessages.has(dialogue.id)
    
    // Format bot messages to handle JSON responses properly
    const formattedContent = dialogue.sender === 'bot' 
      ? formatBotMessage(dialogue.content || '') 
      : dialogue.content || ''
    
    // For audio messages, check transcription length, otherwise check content length
    const textToCheck = dialogue.messageType === 'audio' && dialogue.transcription 
      ? dialogue.transcription 
      : formattedContent
    
    const shouldTruncate = textToCheck.length > 200
    const displayContent = isExpanded || !shouldTruncate 
      ? formattedContent 
      : truncateMessage(formattedContent, 200)

    return (
      <div 
        key={dialogue.id} 
        className={`mb-4 p-4 rounded-lg border ${
          dialogue.sender === 'candidate' 
            ? 'bg-blue-50 border-blue-200 ml-8' 
            : 'bg-green-50 border-green-200 mr-8'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getMessageTypeIcon(dialogue.messageType)}</span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSenderBadgeStyle(dialogue.sender)}`}>
              {dialogue.sender}
            </span>
            {dialogue.messageType === 'audio' && (
              <span className="inline-flex px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                Audio Message
              </span>
            )}
            {dialogue.messageType === 'document' && (
              <span className="inline-flex px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                Document
              </span>
            )}
          </div>
          <span className="text-xs text-secondary-500">
            {formatMessageTime(dialogue.createdAt)}
          </span>
        </div>
        
        <div className="text-sm text-secondary-800">
          {dialogue.messageType === 'audio' && dialogue.transcription ? (
            <div>
              <div className="italic text-secondary-600 mb-2">
                Transcription:
              </div>
              <div>
                {isExpanded || !shouldTruncate 
                  ? dialogue.transcription 
                  : truncateMessage(dialogue.transcription, 200)
                }
              </div>
            </div>
          ) : (
            <div>{displayContent}</div>
          )}
          
          {shouldTruncate && (
            <button 
              onClick={() => toggleMessageExpansion(dialogue.id)}
              className="mt-2 text-xs text-primary-600 hover:text-primary-800 underline"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {dialogue.audioFilePath && (
          <div className="mt-2 text-xs text-secondary-500">
            Audio file: {dialogue.audioFilePath}
          </div>
        )}

        {dialogue.messageType === 'document' && dialogue.documentFilePath && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center gap-2 text-sm text-orange-800 mb-1">
              <span>📄</span>
              <span className="font-medium">Uploaded Document</span>
            </div>
            <div className="text-xs text-orange-700 space-y-1">
              <div><span className="font-medium">File:</span> {dialogue.documentFileName || 'Unknown'}</div>
              <div><span className="font-medium">Size:</span> {formatFileSize(dialogue.documentFileSize)}</div>
              <div className="text-orange-600 italic text-[10px] break-all">
                Path: {dialogue.documentFilePath}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div>
            <h2 className="text-xl font-semibold text-secondary-900">
              Dialogue History
            </h2>
            <p className="text-sm text-secondary-600 mt-1">
              Conversation with {candidateName}
              {vacancyTitle && ` for ${vacancyTitle}`}
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-secondary-600">Loading dialogue history...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">⚠️ Error</div>
              <p className="text-secondary-600 mb-4">{error}</p>
              <button 
                onClick={loadDialogues}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : !dialogueData || !dialogueData.dialogues || dialogueData.dialogues.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No conversation yet</h3>
              <p className="text-secondary-600">
                This candidate hasn't started a conversation for any vacancy yet.
              </p>
            </div>
          ) : (
            <div>
              {/* Summary */}
              <div className="bg-secondary-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary-600">
                      {dialogueData.totalMessages || 0}
                    </div>
                    <div className="text-sm text-secondary-600">Total Messages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {dialogueData.dialogues?.filter(d => d.sender === 'candidate').length || 0}
                    </div>
                    <div className="text-sm text-secondary-600">From Candidate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dialogueData.dialogues?.filter(d => d.sender === 'bot').length || 0}
                    </div>
                    <div className="text-sm text-secondary-600">From Bot</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {dialogueData.dialogues?.filter(d => d.messageType === 'audio').length || 0}
                    </div>
                    <div className="text-sm text-secondary-600">Audio Messages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {dialogueData.dialogues?.filter(d => d.messageType === 'document').length || 0}
                    </div>
                    <div className="text-sm text-secondary-600">Documents</div>
                  </div>
                </div>
                
                {/* CV Information */}
                {dialogueData.candidate.cvFilePath && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                      <span>📄</span>
                      <span className="font-medium">CV/Resume on file</span>
                    </div>
                    <div className="text-xs text-blue-700 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div><span className="font-medium">File:</span> {dialogueData.candidate.cvFileName || 'Unknown'}</div>
                      <div><span className="font-medium">Size:</span> {formatFileSize(dialogueData.candidate.cvFileSize)}</div>
                      <div><span className="font-medium">Uploaded:</span> {dialogueData.candidate.cvUploadedAt ? formatMessageTime(dialogueData.candidate.cvUploadedAt) : 'Unknown'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Vacancy Info */}
              {dialogueData.vacancy && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-secondary-900 mb-1">Applied for:</h4>
                  <p className="text-sm text-secondary-700">{dialogueData.vacancy.title}</p>
                </div>
              )}

              {/* Messages */}
              <div className="space-y-4">
                <h4 className="font-medium text-secondary-900 mb-4">
                  Conversation Timeline
                </h4>
                {dialogueData.dialogues?.map(renderMessage) || []}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-secondary-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-md hover:bg-secondary-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
