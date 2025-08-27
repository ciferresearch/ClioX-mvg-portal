import { ReactElement, useState } from 'react'
import JobList from './JobList'
import ChatInterface from './ChatInterface'
import { ChatbotUseCaseData } from '../../@utils/chatbot'

export default function ChatbotViz(): ReactElement {
  const [, setChatbotData] = useState<ChatbotUseCaseData[]>([])
  return (
    <div className="flex flex-col gap-6">
      <JobList setChatbotData={setChatbotData} />
      <div className="bg-gray-50 rounded-lg shadow-sm">
        <ChatInterface />
      </div>
    </div>
  )
}
