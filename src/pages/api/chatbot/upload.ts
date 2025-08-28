import type { NextApiRequest, NextApiResponse } from 'next'

interface UploadResponse {
  success: boolean
  session_id: string
  chunks_processed: number
  domains: string[]
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { sessionId, knowledgeChunks, domains } = req.body
    const chatbotApiUrl = process.env.CHATBOT_API_URL

    if (!chatbotApiUrl) {
      return res.status(500).json({
        error: 'Chatbot API URL not configured'
      })
    }

    // Forward the request to the external chatbot service
    const response = await fetch(
      `${chatbotApiUrl}/api/v1/session/knowledge/upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          session_id: sessionId,
          knowledge_chunks: knowledgeChunks,
          domains
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Chatbot API upload error:', errorText)
      return res.status(response.status).json({
        error: `Upload failed: ${response.statusText}`
      })
    }

    const result = await response.json()
    return res.status(200).json(result)
  } catch (error) {
    console.error('Chatbot upload API error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}
