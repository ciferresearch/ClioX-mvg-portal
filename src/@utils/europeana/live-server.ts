import { createHash, randomUUID } from 'crypto'
import { europeanaJson, plainText } from './server'
import { recordIdFromInput } from './process'
import { ResearchDataset, ResearchPage, textWindows } from './research'

const TTL = 60 * 60 * 1000
const MAX_CORPORA = 8
const cacheKey = Symbol.for('cliox.europeana.live-corpora')
type Entry = { dataset: ResearchDataset; expires: number }
const cache: Map<string, Entry> =
  (globalThis as any)[cacheKey] ||
  ((globalThis as any)[cacheKey] = new Map<string, Entry>())

export function retainCorpus(dataset: ResearchDataset): ResearchDataset {
  for (const [id, entry] of cache) {
    if (entry.expires <= Date.now()) cache.delete(id)
  }
  while (cache.size >= MAX_CORPORA) cache.delete(cache.keys().next().value)
  const corpusId = randomUUID()
  const expires = Date.now() + TTL
  const retained = {
    ...dataset,
    corpusId,
    expiresAt: new Date(expires).toISOString()
  }
  cache.set(corpusId, { dataset: retained, expires })
  return retained
}

export function getLiveCorpus(id: unknown): ResearchDataset {
  if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id))
    throw new Error('Invalid corpus handle. Load the source again.')
  const entry = cache.get(id)
  if (!entry || entry.expires <= Date.now()) {
    cache.delete(id)
    throw new Error(
      'The live corpus has expired or the server restarted. Load the source again.'
    )
  }
  return entry.dataset
}

function label(value: any): string {
  if (typeof value === 'string') return plainText(value)
  if (!value || typeof value !== 'object') return ''
  const first =
    value['@none'] || value.none || value.en || Object.values(value)[0]
  return plainText(Array.isArray(first) ? first.join(' ') : String(first || ''))
}

export async function fetchLiveCorpus(
  input: unknown,
  maxPages: unknown = 3
): Promise<ResearchDataset> {
  if (typeof input !== 'string' || input.length > 500)
    throw new Error('Enter a Europeana record URL or record identifier.')
  if (
    !Number.isInteger(maxPages) ||
    Number(maxPages) < 1 ||
    Number(maxPages) > 10
  )
    throw new Error('Choose between 1 and 10 pages.')
  const recordId = recordIdFromInput(input)
  const manifestUrl = `https://iiif.europeana.eu/presentation${recordId}/manifest?format=3`
  const manifest = await europeanaJson(manifestUrl)
  if (!Array.isArray(manifest.items) || !manifest.items.length)
    throw new Error('This record does not provide a usable IIIF page list.')
  const retrievedAt = new Date().toISOString()
  const warnings: string[] = []
  const pages: ResearchPage[] = []
  let total = 0
  const canvases = manifest.items.slice(0, Number(maxPages))
  // One bounded batch; the requested limit counts attempted source pages.
  const results = await Promise.all(
    canvases.map(async (canvas: any, index: number) => {
      try {
        const annotation = canvas.annotations?.[0]
        const match =
          typeof annotation?.id === 'string' &&
          new URL(annotation.id).pathname.match(/\/annopage\/([a-zA-Z0-9_-]+)$/)
        if (!match) throw new Error('No full-text reference available.')
        const fulltextUrl = `https://api.europeana.eu/fulltext${recordId}/${match[1]}`
        const text = await europeanaJson(fulltextUrl)
        const rights =
          text.edmRights ||
          canvas.rights?.id ||
          canvas.rights ||
          manifest.rights?.id ||
          manifest.rights ||
          ''
        if (
          typeof rights !== 'string' ||
          !/^https?:\/\/creativecommons\.org\/publicdomain\/(mark|zero)\/1\.0\/?$/.test(
            rights
          )
        )
          throw new Error(
            'Full-text reuse terms are outside this demo’s Public Domain / CC0 scope.'
          )
        if (typeof text.value !== 'string' || !text.value.trim())
          throw new Error('No OCR text available.')
        if (text.value.length > 150000)
          throw new Error('Page exceeds the demo text limit.')
        const image = canvas.items?.[0]?.items?.[0]?.body
        const imageUrl =
          typeof image?.id === 'string' &&
          /^https:\/\/iiif\.europeana\.eu\/image\//.test(image.id)
            ? image.id
            : ''
        return {
          page: {
            id: `${recordId}/${match[1]}`,
            recordId,
            title: label(manifest.label),
            date: /^\d{4}-\d{2}-\d{2}/.test(manifest.navDate || '')
              ? manifest.navDate.slice(0, 10)
              : '',
            language: text.language || annotation.language || 'unknown',
            page: label(canvas.label) || `Page ${index + 1}`,
            source: `https://www.europeana.eu/item${recordId}`,
            fulltextUrl,
            rights,
            attribution: label(
              (canvas.requiredStatement || manifest.requiredStatement)?.value
            ),
            text: text.value,
            retrievedAt,
            imageUrl,
            imageWidth: Number(canvas.width) || 0,
            imageHeight: Number(canvas.height) || 0,
            textSha256: createHash('sha256').update(text.value).digest('hex')
          } as ResearchPage
        }
      } catch (error) {
        return {
          warning: `Page ${index + 1}: ${
            error instanceof Error ? error.message : 'Import failed.'
          }`
        }
      }
    })
  )
  for (const result of results) {
    if (result.warning) warnings.push(result.warning)
    if (result.page) {
      if (total + result.page.text.length > 600000) {
        warnings.push(
          `${result.page.page}: skipped because the corpus size limit was reached.`
        )
      } else {
        pages.push(result.page)
        total += result.page.text.length
      }
    }
  }
  if (!pages.length)
    throw new Error(`No usable full text was imported. ${warnings.join(' ')}`)
  if (manifest.items.length > canvases.length)
    warnings.push(
      `Imported from the first ${canvases.length} of ${manifest.items.length} source pages. Increase the limit to include more (maximum 10).`
    )
  const version = createHash('sha256')
    .update(JSON.stringify(pages.map((p) => [p.id, p.textSha256, p.rights])))
    .digest('hex')
    .slice(0, 16)
  return {
    version,
    retrievedAt,
    pages,
    spans: pages.flatMap(textWindows),
    origin: 'live',
    manifestUrl,
    totalSourcePages: manifest.items.length,
    warnings
  }
}
