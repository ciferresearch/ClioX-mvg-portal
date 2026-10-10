import { plainText } from './server'

export class SearchError extends Error {
  constructor(message: string, public status = 502) {
    super(message)
  }
}
const ROWS = 5
export async function searchNewspapers(
  query: unknown,
  page: unknown = 1,
  apiKey?: string
) {
  if (
    typeof query !== 'string' ||
    query.trim().length < 2 ||
    query.length > 200
  )
    throw new SearchError(
      'Enter between 2 and 200 characters to search newspaper records.',
      400
    )
  if (!Number.isInteger(page) || Number(page) < 1 || Number(page) > 100)
    throw new SearchError('Choose a result page between 1 and 100.', 400)
  const key = apiKey?.trim()
  if (!key)
    throw new SearchError(
      'Europeana search is not configured on this server. You can still import a known record below.',
      503
    )
  const url = new URL('https://api.europeana.eu/record/v2/search.json')
  url.search = new URLSearchParams({
    query: query.trim(),
    theme: 'newspaper',
    rows: String(ROWS),
    start: String((Number(page) - 1) * ROWS + 1),
    profile: 'standard'
  }).toString()
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'X-Api-Key': key },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(20000)
    })
    if (response.status === 401 || response.status === 403)
      throw new SearchError(
        'Europeana did not accept the configured search key.',
        503
      )
    if (response.status === 429)
      throw new SearchError(
        'Europeana search usage limit reached. Please try again later.',
        429
      )
    if (!response.ok)
      throw new SearchError(
        'Europeana search is temporarily unavailable. Please try again.'
      )
    const reader = response.body?.getReader()
    if (!reader)
      throw new SearchError('Europeana returned an empty search response.')
    const parts: Uint8Array[] = []
    let bytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.length
      if (bytes > 2 * 1024 * 1024) {
        await reader.cancel()
        throw new SearchError(
          'Europeana search response exceeded the demo limit.'
        )
      }
      parts.push(value)
    }
    const data = JSON.parse(Buffer.concat(parts).toString('utf8'))
    if (
      data.success !== true ||
      (!Array.isArray(data.items) && data.totalResults !== 0)
    )
      throw new SearchError(
        'Europeana could not complete this search. Try a simpler keyword or newspaper title.',
        502
      )
    const clean = (value: unknown) =>
      plainText(
        (Array.isArray(value)
          ? value.filter((v) => typeof v === 'string').join(' · ')
          : typeof value === 'string'
          ? value
          : ''
        )
          .split(key)
          .join('[redacted]')
      ).slice(0, 500)
    // Europeana can echo the credential in apikey and link fields. Never forward raw responses.
    const items = (data.items || [])
      .slice(0, ROWS)
      .filter(
        (item: any) =>
          typeof item.id === 'string' &&
          /^\/[0-9]+\/[A-Za-z0-9_-]+$/.test(item.id) &&
          !item.id.includes(key)
      )
      .map((item: any) => ({
        id: item.id,
        title:
          clean(Array.isArray(item.title) ? item.title[0] : item.title) ||
          'Untitled newspaper record',
        provider: clean(item.dataProvider),
        language: clean(item.language),
        year: clean(item.year),
        url: `https://www.europeana.eu/item${item.id}`
      }))
    const total =
      Number.isSafeInteger(data.totalResults) && data.totalResults >= 0
        ? data.totalResults
        : items.length
    return {
      query: query.trim(),
      page: Number(page),
      pageSize: ROWS,
      total,
      items,
      hasNext: Number(page) < 100 && Number(page) * ROWS < total,
      retrievedAt: new Date().toISOString()
    }
  } catch (error) {
    if (error instanceof SearchError) throw error
    throw new SearchError(
      'Europeana search could not be reached or returned an unreadable response. Please try again.'
    )
  }
}
