import type { NextApiRequest, NextApiResponse } from 'next'

interface HealthResponse {
  status: string
  ollama_connected?: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const chatbotApiUrl = process.env.CHATBOT_API_URL

    if (!chatbotApiUrl) {
      return res.status(500).json({
        error: 'Chatbot API URL not configured'
      })
    }

    // Forward the request to the external chatbot service
    const response = await fetch(`${chatbotApiUrl}/api/health`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Chatbot API health check error:', errorText)
      return res.status(response.status).json({
        error: `Health check failed: ${response.statusText}`
      })
    }

    const result = await response.json()
    return res.status(200).json(result)
  } catch (error) {
    console.error('Chatbot health API error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}
