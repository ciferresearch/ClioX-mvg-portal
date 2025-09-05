import type { NextApiRequest, NextApiResponse } from 'next'

interface KnowledgeStatus {
  has_knowledge: boolean
  chunk_count: number
  domains: string[]
  session_id: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KnowledgeStatus | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const sessionId = req.headers['x-session-id'] as string
    const chatbotApiUrl = process.env.CHATBOT_API_URL

    if (!chatbotApiUrl) {
      return res.status(500).json({
        error: 'Chatbot API URL not configured'
      })
    }

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID header is required'
      })
    }

    // First, check the backend knowledge status
    const backendResponse = await fetch(
      `${chatbotApiUrl}/api/v1/session/knowledge/status`,
      {
        headers: { 'X-Session-ID': sessionId }
      }
    )

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error('Chatbot API status error:', errorText)
      return res.status(backendResponse.status).json({
        error: `Status check failed: ${backendResponse.statusText}`
      })
    }

    const backendStatus = await backendResponse.json()

    // Pure proxy: do not access local IndexedDB or auto-sync here
    return res.status(200).json(backendStatus)
  } catch (error) {
    console.error('Chatbot status API error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}
