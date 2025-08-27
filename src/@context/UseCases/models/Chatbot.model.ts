import { ChatbotResult } from '../../../components/Chatbot/_types'

export interface ChatbotUseCaseData {
  id?: number
  job: ComputeJobMetaData
  result: ChatbotResult
}

export const TEXT_ANALYSIS_TABLE = {
  textAnalysises: '++id, job, result'
}
