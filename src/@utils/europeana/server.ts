import { chunkPages, recordIdFromInput } from './process'
import type { Corpus, NewspaperPage } from './types'

// IIIF resources are heterogeneous JSON-LD; validate fields when consuming them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>

export function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function label(map: Json = {}): string {
  return plainText(
    (map['@none'] || map.none || map.en || Object.values(map)[0] || []).join(
      ' '
    )
  )
}

export async function europeanaJson(url: string): Promise<Json> {
  const parsed = new URL(url)
  if (
    parsed.protocol !== 'https:' ||
    !['api.europeana.eu', 'iiif.europeana.eu'].includes(parsed.hostname) ||
    parsed.port ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error('Unsupported Europeana resource URL.')
  }
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(25000)
  })
  if (!response.ok)
    throw new Error(`Europeana returned HTTP ${response.status}.`)
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Europeana returned an empty response.')
  const parts: Uint8Array[] = []
  let bytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.length
    if (bytes > 4 * 1024 * 1024) {
      await reader.cancel()
      throw new Error('Europeana response exceeds the demo size limit.')
    }
    parts.push(value)
  }
  return JSON.parse(Buffer.concat(parts).toString('utf8'))
}

export async function importNewspapers(
  inputs: string[],
  maxPages = 3
): Promise<Corpus> {
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 6)
    throw new Error('Select between 1 and 6 pages.')
  if (!inputs.length || inputs.length > 3)
    throw new Error('Provide between 1 and 3 Europeana records.')
  const recordIds = [...new Set(inputs.map(recordIdFromInput))]
  const pages: NewspaperPage[] = []
  const warnings: string[] = []
  for (const recordId of recordIds) {
    if (pages.length >= maxPages) break
    const manifest = await europeanaJson(
      `https://iiif.europeana.eu/presentation${recordId}/manifest?format=3`
    )
    const language = label(
      manifest.metadata?.find(
        (entry: Json) => label(entry.label) === 'language'
      )?.value
    )
    const before = pages.length
    for (const canvas of (manifest.items || []).slice(0, 12)) {
      if (pages.length >= maxPages) break
      const annotation =
        canvas.annotations?.find(
          (entry: Json) => !language || entry.language === language
        ) || canvas.annotations?.[0]
      if (!annotation) continue
      const annotationUrl = new URL(annotation.id)
      const match = annotationUrl.pathname.match(
        /\/annopage\/([a-zA-Z0-9_-]+)$/
      )
      if (!match) continue
      const fulltextUrl = `https://api.europeana.eu/fulltext${recordId}/${match[1]}`
      try {
        const text = await europeanaJson(fulltextUrl)
        const rights =
          text.edmRights || canvas.rights?.id || manifest.rights?.id || ''
        // The first demo imports public-domain or CC0 OCR only.
        if (
          !/^https?:\/\/creativecommons\.org\/publicdomain\/(mark|zero)\/1\.0\/?$/.test(
            rights
          )
        ) {
          warnings.push(
            `${label(canvas.label)}: skipped; full-text rights need review (${
              rights || 'unspecified'
            }).`
          )
          continue
        }
        if (typeof text.value !== 'string' || !text.value.trim()) {
          warnings.push(`${label(canvas.label)}: no OCR text available.`)
          continue
        }
        if (text.value.length > 150000) {
          warnings.push(`${label(canvas.label)}: exceeds the page size limit.`)
          continue
        }
        pages.push({
          id: `${recordId}/${match[1]}`,
          recordId,
          title: label(manifest.label),
          date: /^\d{4}-\d{2}-\d{2}/.test(manifest.navDate || '')
            ? manifest.navDate.slice(0, 10)
            : '',
          language:
            text.language || annotation.language || language || 'unknown',
          page: label(canvas.label),
          source: `https://www.europeana.eu/item${recordId}`,
          fulltextUrl,
          rights,
          attribution: label(
            (canvas.requiredStatement || manifest.requiredStatement)?.value
          ),
          text: text.value,
          retrievedAt: new Date().toISOString()
        })
      } catch (error) {
        warnings.push(
          `${label(canvas.label)}: ${
            error instanceof Error ? error.message : 'Unable to load OCR.'
          }`
        )
      }
    }
    if (pages.length === before)
      warnings.push(`${recordId}: no usable full-text pages were imported.`)
  }
  return { pages, chunks: chunkPages(pages), warnings, origin: 'live' }
}
