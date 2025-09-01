interface UploadResponse {
  success: boolean
  session_id: string
  chunks_processed: number
  domains: string[]
  message?: string
}

interface KnowledgeStatus {
  has_knowledge: boolean
  chunk_count: number
  domains: string[]
  session_id: string
}

interface ChatResponse {
  success: boolean
  response?: string
  sources?: Array<{
    source: string
    relevance_score: number
    content_preview: string
  }>
  metadata?: {
    chunks_retrieved: number
    processing_time_ms: number
    model_used: string
  }
  error?: string
  message?: string
}

interface KnowledgeChunk {
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
}

interface ChatbotUseCaseData {
  id?: number
  job: ComputeJobMetaData
  result: Array<{
    knowledgeBase?: {
      chunks: KnowledgeChunk[]
      searchIndex?: Record<string, string[]>
    }
    domainInfo?: {
      domain: string
      entities: string[]
      timeRange?: string
      description?: string
    }
  }>
}

class ChatbotApiService {
  // Use relative URLs to call our internal API routes
  private baseUrl = '/api/chatbot'
  private sessionId: string

  constructor() {
    // Restore sessionId from sessionStorage, or generate new one
    this.sessionId = this.getOrCreateSessionId()
  }

  private getOrCreateSessionId(): string {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      // Server-side rendering, generate a temporary session ID
      return this.generateSessionId()
    }

    const storedSessionId = sessionStorage.getItem('chatbot_session_id')
    if (storedSessionId) {
      return storedSessionId
    }

    const newSessionId = this.generateSessionId()
    sessionStorage.setItem('chatbot_session_id', newSessionId)
    return newSessionId
  }

  async uploadKnowledge(
    chatbotData: ChatbotUseCaseData[]
  ): Promise<UploadResponse> {
    try {
      const allChunks = this.extractKnowledgeChunks(chatbotData)
      const domains = this.extractDomains(chatbotData)

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          knowledgeChunks: allChunks,
          domains
        })
      })

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Knowledge upload failed:', error)
      throw error
    }
  }

  async chat(
    message: string,
    config: { maxTokens?: number; temperature?: number; model?: string } = {}
  ): Promise<ChatResponse> {
    try {
      const requestBody = {
        sessionId: this.sessionId,
        message,
        config: {
          max_tokens: config.maxTokens || 500,
          temperature: config.temperature || 0.7,
          model: config.model || undefined
        }
      }

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ HTTP Error Response:', errorText)
        throw new Error(
          `Chat request failed: ${response.status} ${response.statusText}`
        )
      }

      const jsonResponse = await response.json()
      return jsonResponse
    } catch (error) {
      console.error('❌ Chat request failed:', error)
      throw error
    }
  }

  async getKnowledgeStatus(): Promise<KnowledgeStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        headers: { 'X-Session-ID': this.sessionId }
      })

      if (!response.ok) {
        throw new Error(
          `Status check failed: ${response.status} ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Knowledge status check failed:', error)
      throw error
    }
  }

  async healthCheck(): Promise<{ status: string; ollama_connected?: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('❌ Health check failed:', error)
      throw error
    }
  }

  private extractKnowledgeChunks(
    chatbotData: ChatbotUseCaseData[]
  ): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = []
    chatbotData.forEach((data) => {
      data.result.forEach((result) => {
        if (result.knowledgeBase?.chunks) {
          chunks.push(...result.knowledgeBase.chunks)
        }
      })
    })
    return chunks
  }

  private extractDomains(chatbotData: ChatbotUseCaseData[]): string[] {
    const domains = new Set<string>()
    chatbotData.forEach((data) => {
      data.result.forEach((result) => {
        if (result.domainInfo?.domain) {
          domains.add(result.domainInfo.domain)
        }
      })
    })
    return Array.from(domains)
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  // Add method to manually clear session
  clearSession(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('chatbot_session_id')
    }
    this.sessionId = this.getOrCreateSessionId()
  }

  // Get current sessionId
  getSessionId(): string {
    return this.sessionId
  }

  getBaseUrl(): string {
    return this.baseUrl
  }
}

export const chatbotApi = new ChatbotApiService()
export type {
  UploadResponse,
  KnowledgeStatus,
  ChatResponse,
  KnowledgeChunk,
  ChatbotUseCaseData
}
