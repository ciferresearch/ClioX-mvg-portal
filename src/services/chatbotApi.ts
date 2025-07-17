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
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
  private sessionId = this.generateSessionId()

  async uploadKnowledge(
    chatbotData: ChatbotUseCaseData[]
  ): Promise<UploadResponse> {
    try {
      const allChunks = this.extractKnowledgeChunks(chatbotData)
      const domains = this.extractDomains(chatbotData)

      console.log(
        `📤 Uploading ${allChunks.length} knowledge chunks for session ${this.sessionId}`
      )

      const response = await fetch(
        `${this.baseUrl}/api/v1/session/knowledge/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId
          },
          body: JSON.stringify({
            session_id: this.sessionId,
            knowledge_chunks: allChunks,
            domains: domains
          })
        }
      )

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

  async chat(message: string, config: any = {}): Promise<ChatResponse> {
    try {
      console.log(
        `💬 Sending chat message for session ${this.sessionId}: "${message}"`
      )

      const requestBody = {
        session_id: this.sessionId,
        message: message,
        config: {
          max_tokens: config.maxTokens || 500,
          temperature: config.temperature || 0.7,
          model: config.model || undefined
        }
      }

      console.log('📤 Request details:', {
        url: `${this.baseUrl}/api/v1/session/chat`,
        sessionId: this.sessionId,
        requestBody: requestBody
      })

      const response = await fetch(`${this.baseUrl}/api/v1/session/chat`, {
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

      console.log(
        '📥 Raw response status:',
        response.status,
        response.statusText
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ HTTP Error Response:', errorText)
        throw new Error(
          `Chat request failed: ${response.status} ${response.statusText}`
        )
      }

      const jsonResponse = await response.json()

      console.log(
        '📥 Full API Response:',
        JSON.stringify(jsonResponse, null, 2)
      )
      console.log('🔍 Response breakdown:', {
        success: jsonResponse.success,
        hasResponse: !!jsonResponse.response,
        responseLength: jsonResponse.response?.length || 0,
        responsePreview: jsonResponse.response?.substring(0, 100) + '...',
        sources: jsonResponse.sources?.length || 0,
        error: jsonResponse.error,
        metadata: jsonResponse.metadata
      })

      return jsonResponse
    } catch (error) {
      console.error('❌ Chat request failed:', error)
      throw error
    }
  }

  async getKnowledgeStatus(): Promise<KnowledgeStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/session/knowledge/status`,
        {
          headers: { 'X-Session-ID': this.sessionId }
        }
      )

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

  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`)
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
    console.log('🔍 extractKnowledgeChunks called with:', {
      dataLength: chatbotData.length,
      dataStructure: chatbotData.map((d) => ({
        jobId: d.job?.jobId,
        resultLength: d.result?.length || 0,
        resultTypes: d.result?.map((r) => Object.keys(r)) || []
      }))
    })

    const chunks: KnowledgeChunk[] = []
    chatbotData.forEach((data, dataIndex) => {
      console.log(`🔍 Processing data[${dataIndex}]:`, {
        jobId: data.job?.jobId,
        resultLength: data.result?.length || 0
      })

      data.result.forEach((result, resultIndex) => {
        console.log(`🔍 Processing result[${resultIndex}]:`, {
          hasKnowledgeBase: !!result.knowledgeBase,
          knowledgeBaseKeys: result.knowledgeBase
            ? Object.keys(result.knowledgeBase)
            : [],
          chunksLength: result.knowledgeBase?.chunks?.length || 0,
          chunksSample: result.knowledgeBase?.chunks?.slice(0, 1) || []
        })

        if (result.knowledgeBase?.chunks) {
          console.log(
            `✅ Adding ${result.knowledgeBase.chunks.length} chunks from result[${resultIndex}]`
          )
          chunks.push(...result.knowledgeBase.chunks)
        } else {
          console.log(`⚠️ No chunks found in result[${resultIndex}]:`, result)
        }
      })
    })

    console.log('🔍 Final extracted chunks:', {
      totalChunks: chunks.length,
      chunksSample: chunks.slice(0, 2)
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
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  getSessionId(): string {
    return this.sessionId
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
