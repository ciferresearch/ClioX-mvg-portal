import { serverEnv } from '@utils/europeana/server-env'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ingestC2D } from '@utils/europeana/c2d-server'
import { OUTPUT_POLICY } from '@utils/europeana/output-policy'

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } }
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Output-Policy', OUTPUT_POLICY.id)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  // Match research's origin check; also reject browser cross-site fetches and
  // simple form content types, which cannot carry the JSON ingestion request.
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host)
        return res
          .status(403)
          .json({ error: 'Cross-origin requests are not allowed.' })
    } catch {
      return res.status(403).json({ error: 'Invalid request origin.' })
    }
  }
  if (req.headers['sec-fetch-site'] === 'cross-site')
    return res
      .status(403)
      .json({ error: 'Cross-origin requests are not allowed.' })
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || ''))
    return res.status(415).json({ error: 'JSON is required.' })
  if (!serverEnv('EUROPEANA_INGEST_PRIVATE_KEY_B64'))
    return res
      .status(503)
      .json({ error: 'C2D ingestion is not configured on this server.' })
  try {
    if (Buffer.byteLength(JSON.stringify(req.body) || '') > 4 * 1024 * 1024)
      return res.status(413).json({ error: 'C2D request is too large.' })
    return res.status(200).json(ingestC2D(req.body))
  } catch {
    // Never echo parsing/crypto/provider errors: these may contain source text.
    return res.status(400).json({
      error:
        'C2D output validation failed. Check the sealed file, summary, aggregates and logs.'
    })
  }
}
