import type { NextApiRequest, NextApiResponse } from 'next'

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { sessionId, message, config } = req.body
    const chatbotApiUrl = process.env.CHATBOT_API_URL

    if (!chatbotApiUrl) {
      return res.status(500).json({
        error: 'Chatbot API URL not configured'
      })
    }

    // Forward the request to the external chatbot service
    const response = await fetch(`${chatbotApiUrl}/api/v1/session/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        config
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Chatbot API chat error:', errorText)
      return res.status(response.status).json({
        error: `Chat request failed: ${response.statusText}`
      })
    }

    const result = await response.json()
    return res.status(200).json(result)
  } catch (error) {
    console.error('Chatbot chat API error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}
