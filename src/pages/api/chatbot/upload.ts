import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

interface UploadResponse {
  success: boolean
  session_id: string
  chunks_processed: number
  domains: string[]
  message?: string
}

// Increase JSON body size limit for large knowledge uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
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

    // Validate payload
    if (!sessionId || !Array.isArray(knowledgeChunks)) {
      return res.status(400).json({
        error: 'Invalid payload: sessionId and knowledgeChunks are required'
      })
    }

    // Sanitize chunk IDs to ensure uniqueness (Chroma requires unique IDs)
    const seen = new Set<string>()
    const sanitizedChunks = knowledgeChunks.map((chunk: any, idx: number) => {
      const content = typeof chunk?.content === 'string' ? chunk.content : ''
      const metadata = chunk?.metadata ? JSON.stringify(chunk.metadata) : ''
      // Create a stable short fingerprint from content + metadata
      const fp = crypto
        .createHash('sha1')
        .update(content + '|' + metadata)
        .digest('hex')
        .slice(0, 12)

      let newId = `${sessionId}_${fp}`
      // Guarantee uniqueness within this batch
      let salt = 0
      while (seen.has(newId)) {
        salt += 1
        newId = `${sessionId}_${fp}_${salt}`
      }
      seen.add(newId)

      return {
        ...chunk,
        id: newId
      }
    })

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
          knowledge_chunks: sanitizedChunks,
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
