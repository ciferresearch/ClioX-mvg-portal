import { ReactElement, useState } from 'react'
import JobList from './JobList'
import ChatInterface from './ChatInterface'
import { useDataLoader } from './useDataLoader'
import { ChatbotResult } from './_types'

// Temporary interface until we create the proper model
interface ChatbotUseCaseData {
  id?: number
  job: ComputeJobMetaData
  result: ChatbotResult[]
}

export default function ChatbotViz(): ReactElement {
  const [chatbotData, setChatbotData] = useState<ChatbotUseCaseData[]>([])

  const { knowledgeBase, isLoading, error } = useDataLoader(chatbotData)

  return (
    <div className="flex flex-col gap-6">
      <JobList setChatbotData={setChatbotData} />
      {knowledgeBase ? (
        <div className="bg-gray-50 rounded-lg shadow-sm">
          <ChatInterface knowledgeBase={knowledgeBase} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {isLoading
                ? 'Loading knowledge base...'
                : 'No knowledge base available'}
            </div>
            <div className="text-gray-400 text-sm">
              {error
                ? `Error: ${error}`
                : 'Add compute jobs to build knowledge base for the chatbot.'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
