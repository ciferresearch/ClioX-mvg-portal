import { object, decryptChunks, SealedChunk } from './sealed'
import type { C2DAggregates, C2DIngestResult } from './c2d-types'
import type { CorpusProvenance } from './corpus-source'
import type { ResearchDataset, ResearchPage } from './research'
import { publicDataset, publicMetadata, OUTPUT_WITHHELD } from './output-policy'
import {
  beginActivity,
  observe,
  finishActivity,
  recordSources,
  recordChunking,
  sha256
} from './activity-server'
import { rememberDataset } from './activity-journal'
import { retainCorpus } from './live-server'

const MAX_LOG_BYTES = 64 * 1024
function json(value: unknown): Record<string, unknown> {
  return object(typeof value === 'string' ? JSON.parse(value) : value)
}
function identifier(value: unknown, pattern: RegExp): string {
  if (typeof value !== 'string' || value.length > 200 || !pattern.test(value))
    throw new Error('Invalid C2D identifier.')
  return value
}
export function redactProviderLog(value: string): string {
  const cleaned = value
    .split('')
    .filter(
      (character) =>
        character === '\n' ||
        character === '\r' ||
        character === '\t' ||
        (character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
    )
    .join('')
  return cleaned
    .replace(/\bBearer\s+[^\s"'<>]+/gi, 'Bearer [REDACTED]')
    .replace(
      /((?:signature|nonce|access_token|api_key|apikey|token|authorization)(?:=|%3d|["']?\s*:\s*["']?))[^\s&#"'<>]+/gi,
      '$1[REDACTED]'
    )
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[REDACTED]@')
}
// Logs and metadata are untrusted public output. In addition to secret
// redaction, suppress copied source text (including short complete chunks).
function safeText(
  dataset: ResearchDataset,
  value: unknown,
  max: number
): string {
  if (typeof value !== 'string' || value.length > max) return OUTPUT_WITHHELD
  const cleaned = redactProviderLog(value)
  const normalized = cleaned
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .trim()
  for (const span of dataset.spans) {
    const source = span.text
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\s+/gu, ' ')
      .trim()
    if (source && normalized.includes(source)) return OUTPUT_WITHHELD
  }
  return publicMetadata(dataset, cleaned, max)
}
function corpus(
  chunks: SealedChunk[],
  provenance: CorpusProvenance,
  version: string
): ResearchDataset {
  const dataset: ResearchDataset = {
    origin: 'c2d',
    provenance,
    version,
    retrievedAt: new Date().toISOString(),
    pages: [],
    spans: [],
    warnings: []
  }
  const pages = new Map<string, ResearchPage>()
  for (const chunk of chunks) {
    const { recordId, page: label } = chunk.source
    const id = `${recordId}/${label}`
    let page = pages.get(id)
    if (!page) {
      if (pages.size >= 10) throw new Error('C2D page limit exceeded.')
      page = {
        id,
        recordId,
        page: label,
        title: 'Europeana C2D corpus',
        date: '',
        language: '',
        source: `https://www.europeana.eu/item${recordId}`,
        fulltextUrl: '',
        rights: '',
        attribution: '',
        text: '',
        retrievedAt: dataset.retrievedAt,
        imageUrl: '',
        imageWidth: 0,
        imageHeight: 0,
        textSha256: ''
      }
      pages.set(id, page)
    }
    // Provider chunks can overlap. Preserve each chunk verbatim; offsets refer
    // to this server assembly, not original OCR or IIIF image coordinates.
    if (page.text) page.text += '\n'
    const start = page.text.length
    page.text += chunk.text
    dataset.spans.push({
      id: chunk.id,
      pageId: id,
      pageLabel: label,
      start,
      end: page.text.length,
      text: chunk.text,
      kind: 'text-window'
    })
  }
  dataset.pages = [...pages.values()].map((page) => ({
    ...page,
    textSha256: sha256(page.text)
  }))
  return dataset
}
export function validateAggregates(
  value: unknown,
  dataset: ResearchDataset,
  runId: string
): C2DAggregates {
  const a = json(value)
  if (
    a.schemaVersion !== 1 ||
    (a.runId !== undefined && a.runId !== runId) ||
    !Array.isArray(a.pages) ||
    a.pages.length !== dataset.pages.length ||
    !Array.isArray(a.topTerms) ||
    a.topTerms.length > 50
  )
    throw new Error('Invalid aggregates.')
  const seen = new Set<string>()
  const pages = a.pages.map((entry) => {
    const row = object(entry)
    const page = dataset.pages.find(
      (p) => p.recordId === row.recordId && p.page === row.page
    )
    if (
      !page ||
      seen.has(page.id) ||
      !Number.isSafeInteger(row.wordCount) ||
      Number(row.wordCount) < 1 ||
      Number(row.wordCount) > page.text.trim().split(/\s+/u).length
    )
      throw new Error('Invalid page aggregate.')
    seen.add(page.id)
    // The algorithm emits flat page metadata; accept the nested public DTO too.
    const m = row.metadata === undefined ? row : object(row.metadata)
    const metadata = {
      title: safeText(dataset, m.title || '', 200),
      date: safeText(dataset, m.date || '', 40),
      language: safeText(dataset, m.language || '', 40),
      rights: safeText(dataset, m.rights || '', 200),
      attribution: safeText(dataset, m.attribution || '', 400)
    }
    return {
      recordId: page.recordId,
      page: page.page,
      wordCount: Number(row.wordCount),
      metadata
    }
  })
  const frequencies = new Map<string, number>()
  for (const page of dataset.pages)
    for (const term of page.text
      .normalize('NFC')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) || [])
      frequencies.set(term, (frequencies.get(term) || 0) + 1)
  const terms = new Set<string>()
  const topTerms = a.topTerms.map((entry) => {
    const row = object(entry)
    if (
      typeof row.term !== 'string' ||
      !/^[\p{L}]{4,39}$/u.test(row.term) ||
      terms.has(row.term.toLowerCase()) ||
      !Number.isSafeInteger(row.count) ||
      Number(row.count) < 5 ||
      Number(row.count) > (frequencies.get(row.term.toLowerCase()) || 0) ||
      safeText(dataset, row.term, 40) === OUTPUT_WITHHELD
    )
      throw new Error('Invalid term aggregate.')
    terms.add(row.term.toLowerCase())
    return { term: row.term, count: Number(row.count) }
  })
  return { schemaVersion: 1, runId, pages, topTerms }
}
export function ingestC2D(input: unknown): C2DIngestResult {
  const b = object(input)
  const jobId = identifier(b.jobId, /^[a-zA-Z0-9_-]+$/)
  const datasetDid = identifier(b.datasetDid, /^did:op:[a-zA-Z0-9]+$/)
  const algorithmDid = identifier(b.algorithmDid, /^did:op:[a-zA-Z0-9]+$/)
  for (const [configured, supplied] of [
    [process.env.NEXT_PUBLIC_EUROPEANA_DATASET_DID, datasetDid],
    [process.env.NEXT_PUBLIC_EUROPEANA_ALGORITHM_DID, algorithmDid]
  ])
    if (configured && configured !== supplied)
      throw new Error('Unexpected C2D asset pair.')
  if (typeof b.providerUrl !== 'string' || b.providerUrl.length > 500)
    throw new Error('Invalid provider URL.')
  const url = new URL(b.providerUrl)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('Invalid provider URL.')
  const summary = json(b.summary)
  const runId = identifier(summary.runId, /^[a-zA-Z0-9_-]+$/)
  const sealed = json(b.sealed)
  const chunks = decryptChunks(sealed, runId)
  if (
    summary.schemaVersion !== 1 ||
    summary.chunkCount !== chunks.length ||
    summary.recipientKeyId !== sealed.recipientKeyId ||
    summary.plaintextSha256 !== sealed.plaintextSha256
  )
    throw new Error('Summary does not match sealed output.')
  const sealedSha256 = sha256(
    typeof b.sealed === 'string' ? b.sealed : JSON.stringify(sealed)
  )
  if (
    typeof b.sealed === 'string' &&
    summary.chunksSealedSha256 !== sealedSha256
  )
    throw new Error('Sealed file hash mismatch.')
  const provenance: CorpusProvenance = {
    jobId,
    datasetDid,
    algorithmDid,
    providerUrl: url.toString(),
    sealedSha256
  }
  const dataset = corpus(chunks, provenance, String(sealed.plaintextSha256))
  if (summary.pageCount !== dataset.pages.length)
    throw new Error('Summary page count mismatch.')
  publicDataset(dataset) // Enforce page/corpus limits before processing public artifacts.
  const aggregates = validateAggregates(b.aggregates, dataset, runId)
  for (const page of dataset.pages)
    Object.assign(
      page,
      aggregates.pages.find(
        (p) => p.recordId === page.recordId && p.page === page.page
      ).metadata
    )
  const activity = beginActivity('load-source')
  activity.infrastructure = {
    mode: 'c2d',
    providerJob: 'client-reported',
    resourceLifecycle: 'not-observed',
    deletionVerified: false
  }
  activity.request = {
    jobId,
    datasetDid,
    algorithmDid,
    providerUrl: url.toString(),
    algorithmRunId: runId,
    sealedSha256,
    sealedHashEncoding:
      typeof b.sealed === 'string'
        ? 'exact-UTF8-file'
        : 'JSON.stringify-envelope'
  }
  for (const [field, filename] of [
    ['configureLog', 'configure.log'],
    ['algorithmLog', 'algorithm.log'],
    ['pipelineLog', 'pipeline.jsonl']
  ] as const) {
    const value = b[field]
    if (field === 'pipelineLog' && value === undefined) continue
    if (
      typeof value !== 'string' ||
      Buffer.byteLength(value) > MAX_LOG_BYTES ||
      value.split('\n').length > 1000
    )
      throw new Error('Invalid provider log.')
    const sanitized = value
      .split(/\r?\n/)
      .map((line) => safeText(dataset, line, 4000))
      .join('\n')
    const hash = sha256(sanitized)
    if (field === 'configureLog') provenance.configureLogSha256 = hash
    if (field === 'algorithmLog') provenance.algorithmLogSha256 = hash
    for (const line of sanitized.split('\n').filter(Boolean)) {
      const access =
        field === 'configureLog' ||
        /\b(fetch|fetching|access|download|downloading)\b/i.test(line)
      observe(
        activity,
        access ? 'c2d-access' : 'c2d-ingestion',
        'succeeded',
        line,
        {
          providerLog: {
            filename,
            sha256: hash,
            lineSha256: sha256(line),
            hashScope: 'sanitized-UTF8',
            provenance: 'client-supplied-provider-log'
          }
        }
      )
    }
  }
  observe(
    activity,
    'c2d-ingestion',
    'succeeded',
    'Verified sealed chunks and retained a server-held corpus. Chunk offsets describe assembled chunks; overlaps may repeat. Job provenance and provider logs are client-supplied, not attested.'
  )
  const retained = retainCorpus(dataset)
  recordSources(activity, retained)
  recordChunking(activity, retained)
  const metadata = { ...publicDataset(retained), traceId: activity.traceId }
  activity.outputSha256 = sha256(
    JSON.stringify({ publicDataset: metadata, aggregates })
  )
  observe(
    activity,
    'output-release',
    'succeeded',
    'Released source metadata, bounded aggregates and sanitized logs. No chunk text.'
  )
  finishActivity(activity)
  rememberDataset(activity.runId, metadata, aggregates)
  return {
    publicDataset: metadata,
    aggregates,
    traceId: activity.traceId,
    activity
  }
}
