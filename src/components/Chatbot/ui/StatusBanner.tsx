import { ReactElement } from 'react'
import { chatbotApi, KnowledgeStatus } from '../../../@utils/chatbot'

export type AssistantState =
  | 'connecting'
  | 'backend-error'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'no-knowledge'

export default function StatusBanner({
  status,
  knowledgeStatus,
  backendError
}: {
  status: AssistantState
  knowledgeStatus: KnowledgeStatus | null
  backendError: string | null
}): ReactElement {
  if (backendError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <span className="text-red-600">❌</span>
          <span className="text-red-700 text-sm font-medium">
            Backend Connection Error
          </span>
        </div>
        <p className="text-red-600 text-xs mt-1">{backendError}</p>
        <p className="text-red-500 text-xs mt-1">
          Please ensure the RAG backend is running on http://localhost:8001
        </p>
      </div>
    )
  }

  if (status === 'uploading') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>📤</span>
            <span className="text-sm font-medium text-orange-700">
              Uploading Knowledge...
            </span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
            Session: {chatbotApi.getSessionId()?.slice(-8) || 'Unknown'}
          </span>
        </div>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>⚙️</span>
            <span className="text-sm font-medium text-yellow-700">
              Processing Knowledge...
            </span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
            Session: {chatbotApi.getSessionId()?.slice(-8) || 'Unknown'}
          </span>
        </div>
        <p className="text-yellow-600 text-xs mt-1">
          Please wait until processing is complete.
        </p>
      </div>
    )
  }

  if (status === 'ready') {
    return (
      <div className="border rounded-lg p-3 bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>✅</span>
            <span className="text-sm font-medium text-green-700">
              AI Assistant Ready
            </span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
            Session: {chatbotApi.getSessionId()?.slice(-8) || 'Unknown'}
          </span>
        </div>
        {knowledgeStatus && (
          <div className="mt-2 text-xs text-green-600">
            📚 {knowledgeStatus.chunk_count || 0} chunks from domains:{' '}
            {knowledgeStatus.domains && knowledgeStatus.domains.length > 0
              ? knowledgeStatus.domains.join(', ')
              : 'No specific domains'}
          </div>
        )}
      </div>
    )
  }

  if (status === 'no-knowledge') {
    return (
      <div className="border rounded-lg p-3 bg-yellow-50 border-yellow-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span className="text-sm font-medium text-yellow-700">
              No Information Loaded
            </span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
            Session: {chatbotApi.getSessionId()?.slice(-8) || 'Unknown'}
          </span>
        </div>
        <p className="text-yellow-600 text-xs mt-1">
          Add compute job results above to enable enhanced chat features
        </p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center space-x-2">
        <span className="text-blue-600">🔄</span>
        <span className="text-blue-700 text-sm font-medium">
          Connecting to Backend...
        </span>
      </div>
    </div>
  )
}
