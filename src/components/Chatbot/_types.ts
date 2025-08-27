// Basic types for chatbot component
export interface ChatbotResult {
  // Knowledge base chunks for chatbot context
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

  // Domain information
  domainInfo?: {
    domain: string // 'enron-emails', 'cameroon-gazette', etc.
    entities: string[]
    timeRange?: string
    description?: string
  }
}

// Chat message interface
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    sources?: string[]
    confidence?: number
  }
}

// Knowledge base interface
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
