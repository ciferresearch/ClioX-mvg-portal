import type { NextApiRequest, NextApiResponse } from 'next'
import { Readable } from 'stream'

export const config = {
  api: {
    bodyParser: true
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const chatbotApiUrl = process.env.CHATBOT_API_URL
  if (!chatbotApiUrl) {
    return res.status(500).json({ error: 'Chatbot API URL not configured' })
  }

  try {
    const { sessionId, message, config } = req.body || {}
    if (!sessionId || !message) {
      return res
        .status(400)
        .json({ error: 'sessionId and message are required' })
    }

    // Abort controller to cancel upstream when client disconnects
    const controller = new AbortController()
    const onClose = () => controller.abort()
    res.on('close', onClose)

    // Use the same path pattern as status.ts for consistency
    const upstreamResponse = await fetch(
      `${chatbotApiUrl}/api/v1/session/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          session_id: sessionId,
          message,
          config
        }),
        signal: controller.signal
      }
    )

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      const text = await upstreamResponse.text().catch(() => '')
      res.off('close', onClose)
      return res.status(upstreamResponse.status || 502).json({
        error: `Upstream error: ${text || upstreamResponse.statusText}`
      })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')

    // Ensure headers are sent before streaming
    if ('flushHeaders' in res && typeof res.flushHeaders === 'function') {
      res.flushHeaders()
    }

    const readable = Readable.fromWeb(upstreamResponse.body as any)

    readable.on('data', (chunk) => {
      res.write(chunk)
    })

    readable.on('end', () => {
      res.off('close', onClose)
      res.end()
    })

    readable.on('error', (err) => {
      console.error('SSE proxy stream error:', err)
      try {
        res.off('close', onClose)
        res.end()
      } catch {}
    })
  } catch (error) {
    console.error('SSE proxy handler error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
