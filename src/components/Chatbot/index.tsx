import { ReactElement, useState, useEffect } from 'react'
import JobList from './JobList'
import ChatInterface from './ChatInterface'
import { ChatbotUseCaseData } from '../../@context/UseCases/models/Chatbot.model'
import { useUseCases } from '../../@context/UseCases'

export default function ChatbotViz(): ReactElement {
  // Get chatbot data from IndexedDB through useUseCases hook
  const { chatbotList } = useUseCases()
  const [chatbotData, setChatbotData] = useState<ChatbotUseCaseData[]>([])

  // Restore data from IndexedDB when component mounts or data changes
  useEffect(() => {
    if (chatbotList) {
      setChatbotData(chatbotList)
    }
  }, [chatbotList])

  return (
    <div className="flex flex-col gap-6">
      <JobList setChatbotData={setChatbotData} />
      <div className="bg-gray-50 rounded-lg shadow-sm">
        <ChatInterface />
      </div>
    </div>
  )
}
