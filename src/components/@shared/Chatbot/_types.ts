export interface ChatbotResult {
  knowledgeBase?: {
    chunks: Array<{
      id: string
      content: string
      metadata: {
        source: string
        topic?: string
        date?: string
        entities?: string[]
        category?: string
        tags?: string[]
      }
    }>
    embeddings?: number[][]
    searchIndex?: Record<string, string[]>
  }

  domainInfo?: {
    domain: string
    entities: string[]
    timeRange?: string
    description?: string
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    sources?: string[]
    confidence?: number
    isComplete?: boolean
    isAborted?: boolean
  }
}

export interface KnowledgeBase {
  domains: Record<string, any>
  allChunks: Array<{
    id: string
    content: string
    metadata: any
  }>
  searchIndex: Record<string, string[]>
  totalChunks: number
}
