import { serverEnv } from '@utils/europeana/server-env'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  beginActivity,
  observe,
  finishActivity,
  sha256
} from '@utils/europeana/activity-server'
import { searchNewspapers, SearchError } from '@utils/europeana/search-server'
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  const activity = beginActivity('search')
  activity.request = {
    querySha256: sha256(typeof req.query.q === 'string' ? req.query.q : ''),
    resultPage: String(req.query.page || '1').slice(0, 10)
  }
  observe(
    activity,
    'search',
    'started',
    'Validating the query and requesting newspaper metadata from Europeana. Credentials stay on the server.'
  )
  try {
    const result = await searchNewspapers(
      req.query.q,
      req.query.page === undefined
        ? 1
        : typeof req.query.page === 'string'
        ? Number(req.query.page)
        : NaN,
      serverEnv('EUROPEANA_API_KEY')
    )
    activity.outputSha256 = sha256(JSON.stringify(result))
    observe(
      activity,
      'search',
      'succeeded',
      `${result.items.length} record summaries returned. No newspaper OCR was fetched or sent to a model.`
    )
    return res
      .status(200)
      .json({ ...result, activity: finishActivity(activity) })
  } catch (error) {
    observe(
      activity,
      'search',
      'failed',
      'Search did not complete. No saved results were substituted.'
    )
    return res.status(error instanceof SearchError ? error.status : 502).json({
      activity: finishActivity(activity, true),
      error:
        error instanceof SearchError ? error.message : 'Search is unavailable.'
    })
  }
}
