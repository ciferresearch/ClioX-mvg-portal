import { ChatbotResult } from '../../../components/@shared/Chatbot/_types'

export interface ChatbotUseCaseData {
  id?: number
  job: ComputeJobMetaData
  result: ChatbotResult[]
  namespace?: string
}

export const CHATBOT_TABLE = {
  chatbots: '++id, namespace, job, result'
}
