import { ChatbotResult } from '../../../components/Chatbot/_types'

export interface ChatbotUseCaseData {
  id?: number
  job: ComputeJobMetaData
  result: ChatbotResult[]
}

export const CHATBOT_TABLE = {
  chatbots: '++id, job, result'
}
