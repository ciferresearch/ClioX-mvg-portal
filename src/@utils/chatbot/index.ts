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

export interface StreamProgressEvent {
  content?: string
  done?: boolean
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

  async streamChat(
    message: string,
    config: { maxTokens?: number; temperature?: number; model?: string } = {},
    onProgress?: (event: StreamProgressEvent) => void,
    options?: { signal?: AbortSignal }
  ): Promise<{
    fullResponse: string
    sources?: StreamProgressEvent['sources']
    metadata?: StreamProgressEvent['metadata']
  }> {
    const requestBody = {
      sessionId: this.sessionId,
      message,
      config: {
        max_tokens: config.maxTokens || 500,
        temperature: config.temperature || 0.7,
        model: config.model || undefined
      }
    }

    const response = await fetch(`${this.baseUrl}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId,
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      },
      body: JSON.stringify(requestBody),
      signal: options?.signal
    })

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '')
      throw new Error(text || `Stream request failed: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let fullResponse = ''
    let lastSources: StreamProgressEvent['sources'] | undefined
    let lastMetadata: StreamProgressEvent['metadata'] | undefined
    let sseBuffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      sseBuffer += chunk
      const lines = sseBuffer.split('\n')
      sseBuffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (!payload) continue
        try {
          const data: StreamProgressEvent = JSON.parse(payload)
          if (data.error) throw new Error(data.error)
          if (typeof data.content === 'string') {
            fullResponse += data.content
            onProgress?.({ content: data.content })
          }
          if (data.sources) lastSources = data.sources
          if (data.metadata) lastMetadata = data.metadata
          if (data.done) {
            onProgress?.({
              done: true,
              sources: lastSources,
              metadata: lastMetadata
            })
          }
        } catch (err) {
          // ignore parse errors of keep-alive comments or partial JSON
        }
      }
    }

    return { fullResponse, sources: lastSources, metadata: lastMetadata }
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

  // Check if auto-sync is needed and trigger it
  async checkAndAutoSync(): Promise<KnowledgeStatus> {
    try {
      // Get current backend status
      const backendStatus = await this.getKnowledgeStatus()

      // If backend already has knowledge, no sync needed
      if (backendStatus.has_knowledge) {
        return backendStatus
      }

      // Check if we have data in IndexedDB that needs syncing (browser-only)
      if (typeof window === 'undefined') {
        return backendStatus
      }
      const { database } = await import('../../@context/UseCases')
      const chatbotData = await database.chatbots.toArray()

      if (chatbotData && chatbotData.length > 0) {
        // Extract knowledge chunks and domains
        const knowledgeChunks = this.extractKnowledgeChunks(chatbotData)
        const domains = this.extractDomains(chatbotData)

        if (knowledgeChunks.length > 0) {
          // Upload to backend
          const uploadResult = await this.uploadKnowledge(chatbotData)

          if (uploadResult.success) {
            return {
              has_knowledge: true,
              chunk_count: uploadResult.chunks_processed,
              domains: uploadResult.domains,
              session_id: this.sessionId
            }
          }
        }
      }

      // Return original status if no sync was possible
      return backendStatus
    } catch (error) {
      console.error('❌ Auto-sync check failed:', error)
      throw error
    }
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
