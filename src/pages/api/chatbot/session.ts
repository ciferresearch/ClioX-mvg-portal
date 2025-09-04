import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | { success: boolean; session_id?: string; message?: string }
    | { error: string }
  >
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const sessionId = req.headers['x-session-id'] as string
    const chatbotApiUrl = process.env.CHATBOT_API_URL

    if (!chatbotApiUrl) {
      return res.status(500).json({ error: 'Chatbot API URL not configured' })
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID header is required' })
    }

    const upstream = await fetch(
      `${chatbotApiUrl}/api/v1/session/knowledge/session`,
      {
        method: 'DELETE',
        headers: { 'X-Session-ID': sessionId }
      }
    )

    const text = await upstream.text()

    if (!upstream.ok) {
      try {
        const json = JSON.parse(text)
        return res.status(upstream.status).json(json)
      } catch {
        return res
          .status(upstream.status)
          .json({ error: text || 'Upstream error' })
      }
    }

    try {
      const json = JSON.parse(text)
      return res.status(200).json(json)
    } catch {
      return res.status(200).json({
        success: true,
        session_id: sessionId,
        message: 'Session deleted'
      })
    }
  } catch (error) {
    console.error('Chatbot session delete API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
