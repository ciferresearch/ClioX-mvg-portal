import type { NewspaperPage } from './types'
import type { CorpusOrigin, CorpusProvenance } from './corpus-source'

export interface EvidenceSpan {
  id: string
  pageId: string
  pageLabel: string
  start: number
  end: number
  text: string
  kind: 'layout-block' | 'text-window'
  annotationId?: string
  region?: { x: number; y: number; width: number; height: number }
}
export interface ResearchPage extends NewspaperPage {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  textSha256: string
}
export interface ResearchDataset {
  corpusId?: string
  expiresAt?: string
  origin?: CorpusOrigin
  provenance?: CorpusProvenance
  manifestUrl?: string
  totalSourcePages?: number
  warnings?: string[]
  version: string
  retrievedAt: string
  pages: ResearchPage[]
  spans: EvidenceSpan[]
}
export interface EvidenceAnswer {
  answer: string
  insufficientEvidence: boolean
  evidence: EvidenceSpan[]
  candidateCount: number
  generatedAt: string
  model: string
  sessionCleared: boolean
}
export interface BlockLabel {
  spanId: string
  label: 'positive' | 'neutral' | 'negative' | 'mixed' | 'uncertain'
  explanation: string
  toneTarget: string
  humanReviewed: boolean
  origin: 'model' | 'manual'
}

export function textWindows(page: NewspaperPage): EvidenceSpan[] {
  const tokens = [...page.text.matchAll(/\S+/g)]
  const spans: EvidenceSpan[] = []
  for (let index = 0; index < tokens.length; index += 250) {
    const last = tokens[Math.min(index + 299, tokens.length - 1)]
    const start = tokens[index].index || 0
    const end = (last.index || 0) + last[0].length
    spans.push({
      id: `${page.id}#char=${start},${end}`,
      pageId: page.id,
      pageLabel: page.page,
      start,
      end,
      text: page.text.slice(start, end),
      kind: 'text-window'
    })
    if (index + 300 >= tokens.length) break
  }
  return spans
}

export function coveredCharacters(
  spans: Array<Pick<EvidenceSpan, 'pageId' | 'start' | 'end'>>
): number {
  const groups = new Map<string, typeof spans>()
  for (const span of spans)
    groups.set(span.pageId, [...(groups.get(span.pageId) || []), span])
  let sum = 0
  for (const group of groups.values()) {
    let end = 0
    for (const span of [...group].sort((a, b) => a.start - b.start)) {
      sum += Math.max(0, span.end - Math.max(end, span.start))
      end = Math.max(end, span.end)
    }
  }
  return sum
}

function searchText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
export function rankEvidence(
  question: string,
  spans: EvidenceSpan[],
  limit = 8
) {
  const stops = new Set(
    'what where when which according newspaper report reports does about happened tell from this that with were have into paper source please could would'.split(
      ' '
    )
  )
  const terms = [
    ...new Set(searchText(question).match(/[\p{L}\p{N}]{3,}/gu) || [])
  ].filter((t) => !stops.has(t))
  const documents = spans.map((span) => searchText(span.text))
  const frequencies = terms.map(
    (term) => documents.filter((text) => text.includes(term)).length
  )
  return spans
    .map((span, index) => ({
      span,
      score: terms.reduce(
        (score, term, i) =>
          score +
          (documents[index].includes(term)
            ? Math.log(1 + spans.length / (1 + frequencies[i]))
            : 0),
        0
      )
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

export function selectEvidence(
  question: string,
  spans: EvidenceSpan[],
  limit = 8
) {
  return rankEvidence(question, spans, limit).map((entry) => entry.span)
}

// Model-selected IDs resolve only to server-owned source spans.
export function resolveAnswer(value: unknown, candidates: EvidenceSpan[]) {
  if (!value || typeof value !== 'object')
    throw new Error('Model did not return structured evidence.')
  const result = value as {
    answer?: unknown
    insufficientEvidence?: unknown
    evidenceIds?: unknown
  }
  if (
    typeof result.answer !== 'string' ||
    typeof result.insufficientEvidence !== 'boolean' ||
    !Array.isArray(result.evidenceIds)
  )
    throw new Error('Model response is missing required evidence fields.')
  const ids = [...new Set(result.evidenceIds)]
  const evidence = ids.map((id) => candidates.find((span) => span.id === id))
  if (evidence.some((span) => !span))
    throw new Error(
      'Model selected an unknown source span. No answer was accepted.'
    )
  if (!result.insufficientEvidence && !evidence.length)
    throw new Error('Model answer has no source evidence.')
  return {
    answer: result.answer,
    insufficientEvidence: result.insufficientEvidence,
    evidence: result.insufficientEvidence ? [] : (evidence as EvidenceSpan[])
  }
}

export function resolveLabels(
  value: unknown,
  candidates: EvidenceSpan[]
): BlockLabel[] {
  if (!Array.isArray(value))
    throw new Error('Model did not return a label list.')
  return candidates.map((span) => {
    const row = value.find((entry) => entry?.spanId === span.id)
    const valid =
      row &&
      ['positive', 'neutral', 'negative', 'mixed', 'uncertain'].includes(
        row.label
      )
    return {
      spanId: span.id,
      label: valid ? row.label : 'uncertain',
      explanation:
        valid && typeof row.explanation === 'string'
          ? row.explanation
          : 'No usable classification was returned.',
      toneTarget: typeof row?.toneTarget === 'string' ? row.toneTarget : '',
      humanReviewed: false,
      origin: 'model'
    }
  })
}

export function scanRegionUrl(page: ResearchPage, span?: EvidenceSpan): string {
  if (!page.imageUrl) return ''
  const parsed = new URL(page.imageUrl)
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'iiif.europeana.eu' ||
    !parsed.pathname.startsWith('/image/')
  )
    return ''
  const region = span?.region
  const crop = region
    ? `${region.x},${region.y},${region.width},${region.height}`
    : 'full'
  const width = region ? Math.min(region.width, 1000) : 900
  return page.imageUrl.replace(
    /\/full\/full\/0\/default\.jpg$/,
    `/${crop}/${width},/0/default.jpg`
  )
}
