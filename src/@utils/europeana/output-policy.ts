import { createHash } from 'crypto'
import type {
  BlockLabel,
  EvidenceSpan,
  ResearchDataset,
  ResearchPage
} from './research'

// Local application egress policy, not a Provider policy or a privacy guarantee.
// It does not prevent semantic inference, all model transformations, or attacks
// across processes. Restarting this process clears the in-memory budget.
// Engineering draft, not an approved Europeana/data-holder or C2D policy.
export const OUTPUT_POLICY = Object.freeze({
  id: 'europeana-local-output/2026-10-07-v1',
  scope: 'Local application output only; no data-holder custody guarantee.',
  answerCharacters: 800,
  evidenceItems: 2,
  evidenceCharacters: 320,
  evidencePageDivisor: 4,
  // Reject normalized copy runs independently of the permitted evidence quotes.
  copyRunCharacters: 120,
  modelInputCharacters: 32768,
  labelItems: 8,
  explanationCharacters: 160,
  toneTargetCharacters: 80,
  budgetCharacters: 16000,
  windowMilliseconds: 60 * 60 * 1000,
  maximumActiveCorpora: 128,
  replayItems: 8,
  locateItems: 100,
  locateQueryCharacters: 200,
  // Shared fixed content-policy window; all locate attempts that pass input
  // validation count, including repeated queries and queries with no matches.
  locateMinimumQueryCharacters: 3,
  locateQueriesPerWindow: 60,
  locateWindowMilliseconds: 60 * 60 * 1000
})

export const OUTPUT_WITHHELD =
  'Output withheld by the local application output policy.'

export class OutputPolicyError extends Error {
  constructor(
    public readonly code:
      | 'locate-quota-exhausted'
      | 'budget-exhausted'
      | 'capacity-exhausted'
      | 'invalid-input',
    message: string,
    public readonly retryAfterSeconds = 0
  ) {
    super(message)
    this.name = 'OutputPolicyError'
  }
}

export interface PublicResearchPage
  extends Omit<
    ResearchPage,
    'text' | 'fulltextUrl' | 'imageUrl' | 'imageWidth' | 'imageHeight'
  > {
  textCharacters: number
}
export interface PublicEvidenceSpan
  extends Omit<EvidenceSpan, 'text' | 'annotationId' | 'region'> {
  textCharacters: number
}
export interface DatasetOutputPolicy {
  id: string
  scope: string
  fullCorpusReleased: false
  originalTextInBrowser: false
  budgetCharacters: number
  windowSeconds: number
}
export interface PublicResearchDataset
  extends Omit<
    ResearchDataset,
    'pages' | 'spans' | 'manifestUrl' | 'provenance'
  > {
  traceId?: string
  pages: PublicResearchPage[]
  spans: PublicEvidenceSpan[]
  outputPolicy: DatasetOutputPolicy
}
export interface ReleasedEvidence extends EvidenceSpan {
  sourceSpanId: string
  textCharacters: number
  truncated: boolean
}
export interface ReleasedOutputPolicy {
  id: string
  scope: string
  releasedCharacters: number
  remainingCharacters: number
  windowExpiresAt: string
  characterUnit: 'UTF-16 code units in answers, quotes and label explanations/targets'
}
export interface ReleasedResult {
  answer?: string
  insufficientEvidence?: boolean
  evidence?: ReleasedEvidence[]
  labels?: BlockLabel[]
  candidateCount: number
  corpusVersion: string
  generatedAt: string
  model: string
  sessionCleared?: boolean
  outputPolicy: ReleasedOutputPolicy
}

interface Budget {
  used: number
  locateUsed?: number
  locateExpires?: number
  expires: number
}
interface SourceText {
  normalized: string
}

// Symbol.for also shares the budget across module reloads in this Node process.
const budgetKey = Symbol.for('cliox.europeana.output-budget.2026-10-07-v1')
const processState = globalThis as unknown as Record<symbol, unknown>
const budgets = (processState[budgetKey] || new Map<string, Budget>()) as Map<
  string,
  Budget
>
processState[budgetKey] = budgets

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

// Truncate by JS offsets, but never expose a dangling half of a surrogate pair.
function clip(value: string, limit: number): string {
  let end = Math.min(value.length, Math.max(0, limit))
  if (
    end > 0 &&
    end < value.length &&
    /[\uD800-\uDBFF]/.test(value[end - 1]) &&
    /[\uDC00-\uDFFF]/.test(value[end])
  )
    end--
  return value.slice(0, end)
}

function text(value: unknown, limit: number): string {
  return typeof value === 'string' ? clip(value, limit) : ''
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim()
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function validateDataset(dataset: ResearchDataset): void {
  if (
    !dataset ||
    !Array.isArray(dataset.pages) ||
    !dataset.pages.length ||
    dataset.pages.length > 10 ||
    !Array.isArray(dataset.spans) ||
    dataset.pages.some(
      (page) =>
        !page ||
        typeof page.id !== 'string' ||
        !page.id ||
        page.id.length > 1000 ||
        typeof page.text !== 'string' ||
        page.text.length > 150000
    ) ||
    dataset.pages.reduce((sum, page) => sum + page.text.length, 0) > 600000
  )
    throw new OutputPolicyError('invalid-input', 'Invalid server-owned corpus.')
}

function contentFingerprint(dataset: ResearchDataset): string {
  // Never trust the browser handle, version, or an asserted textSha256 field.
  // Page IDs, order and identical repeated entries do not create another budget.
  const pages = [
    ...new Set(dataset.pages.map((page) => hash(page.text)))
  ].sort()
  return hash(JSON.stringify(pages))
}

function publicSource(page: ResearchPage): string {
  const id = text(page.recordId, 500)
  return /^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(id)
    ? `https://www.europeana.eu/item${id}`
    : ''
}

function validSpan(dataset: ResearchDataset, value: unknown) {
  if (typeof value !== 'string') return undefined
  const span = dataset.spans.find((item) => item.id === value)
  const page = span && dataset.pages.find((item) => item.id === span.pageId)
  if (
    !span ||
    !page ||
    !Number.isSafeInteger(span.start) ||
    !Number.isSafeInteger(span.end) ||
    span.start < 0 ||
    span.end <= span.start ||
    span.end > page.text.length ||
    !['layout-block', 'text-window'].includes(span.kind)
  )
    return undefined
  return { span, page }
}

// A quote must also be a fraction of a short page, never its entire body.
function quoteLimit(length: number): number {
  return Math.min(
    OUTPUT_POLICY.evidenceCharacters,
    Math.floor(length / OUTPUT_POLICY.evidencePageDivisor)
  )
}

// Exact rolling hashes find shared normalized runs in linear time; hash hits
// are verified against the strings, so a collision cannot bypass the check.
function sharesRun(first: string, second: string, length: number): boolean {
  if (length < 1 || first.length < length || second.length < length)
    return false
  const small = first.length <= second.length ? first : second
  const large = first.length <= second.length ? second : first
  let power = 1
  for (let i = 1; i < length; i++) power = Math.imul(power, 31)
  const firstHash = (value: string) => {
    let result = 0
    for (let i = 0; i < length; i++)
      result = (Math.imul(result, 31) + value.charCodeAt(i)) | 0
    return result
  }
  const advance = (value: string, previous: number, index: number) =>
    (Math.imul(previous - Math.imul(value.charCodeAt(index - 1), power), 31) +
      value.charCodeAt(index + length - 1)) |
    0
  const positions = new Map<number, number[]>()
  let rolling = firstHash(small)
  for (let index = 0; index <= small.length - length; index++) {
    if (index) rolling = advance(small, rolling, index)
    const previous = positions.get(rolling)
    if (previous) previous.push(index)
    else positions.set(rolling, [index])
  }
  rolling = firstHash(large)
  for (let index = 0; index <= large.length - length; index++) {
    if (index) rolling = advance(large, rolling, index)
    const matches = positions.get(rolling)
    if (
      matches?.some(
        (other) =>
          small.slice(other, other + length) ===
          large.slice(index, index + length)
      )
    )
      return true
  }
  return false
}

function modelText(
  value: unknown,
  maximum: number,
  sources: SourceText[]
): string {
  if (typeof value !== 'string') return ''
  // Do not truncate before inspection: a copied tail must not escape detection.
  if (value.length > OUTPUT_POLICY.modelInputCharacters) return OUTPUT_WITHHELD
  const normalized = normalize(value)
  if (
    sources.some(
      (source) =>
        source.normalized.length > 0 &&
        sharesRun(
          normalized,
          source.normalized,
          Math.min(OUTPUT_POLICY.copyRunCharacters, source.normalized.length)
        )
    )
  )
    return OUTPUT_WITHHELD
  return clip(value, maximum)
}

// For server-owned descriptive metadata only, never for model responses.
export function publicMetadata(
  dataset: ResearchDataset,
  value: unknown,
  maximum: number
): string {
  return modelText(
    value,
    maximum,
    dataset.pages.map((page) => ({ normalized: normalize(page.text) }))
  )
}

export function publicDataset(dataset: ResearchDataset): PublicResearchDataset {
  validateDataset(dataset)
  const sources = dataset.pages.map((page) => ({
    normalized: normalize(page.text)
  }))
  const metadata = (value: unknown, limit: number) =>
    modelText(value, limit, sources)
  return {
    corpusId: metadata(dataset.corpusId, 100),
    expiresAt: metadata(dataset.expiresAt, 40),
    origin: dataset.origin || 'snapshot',
    version: metadata(dataset.version, 128),
    retrievedAt: metadata(dataset.retrievedAt, 40),
    totalSourcePages: Number.isSafeInteger(dataset.totalSourcePages)
      ? Math.max(0, dataset.totalSourcePages)
      : dataset.pages.length,
    // Raw importer errors and manifest URLs are not public response fields.
    warnings: dataset.warnings?.length
      ? [`${dataset.warnings.length} source acquisition warning(s).`]
      : [],
    pages: dataset.pages.map((page) => ({
      id: metadata(page.id, 1000),
      recordId: metadata(page.recordId, 500),
      title: metadata(page.title, 200),
      date: metadata(page.date, 40),
      language: metadata(page.language, 40),
      page: metadata(page.page, 80),
      source: metadata(publicSource(page), 550),
      rights: metadata(page.rights, 200),
      attribution: metadata(page.attribution, 400),
      textCharacters: page.text.length,
      retrievedAt: metadata(page.retrievedAt, 40),
      textSha256: hash(page.text)
    })),
    spans: dataset.spans.flatMap((item) => {
      const resolved = validSpan(dataset, item.id)
      if (!resolved) return []
      const { span, page } = resolved
      return [
        {
          id: metadata(span.id, 1100),
          pageId: metadata(page.id, 1000),
          pageLabel: metadata(page.page, 80),
          start: span.start,
          end: span.end,
          textCharacters: span.end - span.start,
          kind: span.kind
        }
      ]
    }),
    outputPolicy: {
      id: OUTPUT_POLICY.id,
      scope: OUTPUT_POLICY.scope,
      fullCorpusReleased: false,
      originalTextInBrowser: false,
      budgetCharacters: OUTPUT_POLICY.budgetCharacters,
      windowSeconds: OUTPUT_POLICY.windowMilliseconds / 1000
    }
  }
}

// Long provider chunks: release the window that shares the most terms with the
// question and answer, not the chunk's opening characters. Focus text only
// ranks windows inside the cited span; it is never released.
function focusTerms(focus?: string): Set<string> {
  return new Set(
    normalize(focus || '')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length >= 4)
  )
}

function focusOffset(value: string, limit: number, terms: Set<string>): number {
  if (!terms.size || value.length <= limit) return 0
  let first = 0
  let last = 0
  let bestScore = 0
  for (let start = 0; start < value.length - limit + 20; start += 20) {
    const offset = Math.min(start, value.length - limit)
    const words = normalize(value.slice(offset, offset + limit)).split(
      /[^\p{L}\p{N}]+/u
    )
    const score = new Set(words.filter((word) => terms.has(word))).size
    if (score > bestScore) {
      bestScore = score
      first = last = offset
    } else if (score === bestScore && score > 0 && offset === last + 20) {
      last = offset
    }
  }
  // Centre the matched terms rather than leaving them at the window's edge.
  let best = first + Math.floor((last - first) / 40) * 20
  // Start on a word boundary when one is close, and never on a low surrogate.
  const space = best > 0 ? value.lastIndexOf(' ', best) : -1
  if (space >= 0 && best - space <= 30) best = space + 1
  if (/[\uDC00-\uDFFF]/.test(value[best] || '')) best++
  return best
}

function releaseEvidence(
  dataset: ResearchDataset,
  input: unknown,
  focus?: string
): ReleasedEvidence[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const released: ReleasedEvidence[] = []
  const terms = focusTerms(focus)
  for (const value of input) {
    if (released.length >= OUTPUT_POLICY.evidenceItems) break
    const resolved = validSpan(dataset, record(value)?.id)
    if (!resolved || seen.has(resolved.span.id)) continue
    const { span, page } = resolved
    seen.add(span.id)
    // Evidence text is reconstructed exclusively from the server-owned page.
    const spanText = page.text.slice(span.start, span.end)
    const limit = quoteLimit(page.text.length)
    const offset = focusOffset(spanText, limit, terms)
    const quote = clip(spanText.slice(offset), limit)
    if (!quote) continue
    const start = span.start + offset
    const end = start + quote.length
    released.push({
      id: `${publicMetadata(dataset, page.id, 1000)}#char=${start},${end}`,
      sourceSpanId: publicMetadata(dataset, span.id, 1100),
      pageId: publicMetadata(dataset, page.id, 1000),
      pageLabel: publicMetadata(dataset, page.page, 80),
      start,
      end,
      text: quote,
      textCharacters: quote.length,
      truncated: start !== span.start || end !== span.end,
      kind: span.kind
    })
  }
  return released
}

function sourceCharacters(result: ReleasedResult): number {
  // Boilerplate and the fixed withholding message disclose no source content.
  const count = (value = '') => (value === OUTPUT_WITHHELD ? 0 : value.length)
  return (
    count(result.answer) +
    (result.evidence || []).reduce((sum, item) => sum + item.text.length, 0) +
    (result.labels || []).reduce(
      (sum, item) => sum + count(item.explanation) + count(item.toneTarget),
      0
    )
  )
}

function budgetFor(dataset: ResearchDataset) {
  const now = Date.now()
  for (const [key, budget] of budgets)
    if (budget.expires <= now) budgets.delete(key)
  const fingerprint = contentFingerprint(dataset)
  let budget = budgets.get(fingerprint)
  if (!budget && budgets.size >= OUTPUT_POLICY.maximumActiveCorpora) {
    const earliest = Math.min(
      ...Array.from(budgets.values(), (entry) => entry.expires)
    )
    throw new OutputPolicyError(
      'capacity-exhausted',
      'Output capacity is exhausted. Retry after the current policy window.',
      Math.max(1, Math.ceil((earliest - now) / 1000))
    )
  }
  if (!budget)
    budget = { used: 0, expires: now + OUTPUT_POLICY.windowMilliseconds }
  return { fingerprint, budget, now }
}

function checkBudget(budget: Budget, now: number, charge: number) {
  if (
    budget.used >= OUTPUT_POLICY.budgetCharacters ||
    budget.used + charge > OUTPUT_POLICY.budgetCharacters
  )
    throw new OutputPolicyError(
      'budget-exhausted',
      'The output allowance for this source has been reached. Retry after the current policy window.',
      Math.max(1, Math.ceil((budget.expires - now) / 1000))
    )
}

// Cheap preflight before upload/inference. No reservation: simultaneous requests
// can pass this check; the final synchronous check+charge remains authoritative.
export function assertOutputAvailable(dataset: ResearchDataset): void {
  validateDataset(dataset)
  const { budget, now } = budgetFor(dataset)
  checkBudget(budget, now, 0)
}

export function releaseResult(
  dataset: ResearchDataset,
  result: unknown,
  focus?: string
): ReleasedResult {
  validateDataset(dataset)
  const input = record(result)
  if (
    !input ||
    (typeof input.answer !== 'string' && !Array.isArray(input.labels))
  )
    throw new OutputPolicyError(
      'invalid-input',
      'No releasable result was supplied.'
    )
  const sources = dataset.pages.map((page) => ({
    normalized: normalize(page.text)
  }))
  const released: ReleasedResult = {
    candidateCount:
      typeof input.candidateCount === 'number' &&
      Number.isSafeInteger(input.candidateCount)
        ? Math.max(0, Math.min(8, input.candidateCount))
        : 0,
    corpusVersion: publicMetadata(dataset, dataset.version, 128),
    generatedAt: new Date().toISOString(),
    // A free-form backend model name is another unbudgeted output channel.
    model:
      input.model === 'No model call'
        ? 'No model call'
        : 'Configured ClioX service',
    outputPolicy: {
      id: OUTPUT_POLICY.id,
      scope: OUTPUT_POLICY.scope,
      releasedCharacters: 0,
      remainingCharacters: 0,
      windowExpiresAt: '',
      characterUnit:
        'UTF-16 code units in answers, quotes and label explanations/targets'
    }
  }
  if (typeof input.sessionCleared === 'boolean')
    released.sessionCleared = input.sessionCleared
  if (typeof input.answer === 'string') {
    released.answer = modelText(
      input.answer,
      OUTPUT_POLICY.answerCharacters,
      sources
    )
    released.insufficientEvidence = input.insufficientEvidence === true
    released.evidence = released.insufficientEvidence
      ? []
      : releaseEvidence(
          dataset,
          input.evidence,
          [
            focus,
            released.answer === OUTPUT_WITHHELD ? '' : released.answer
          ].join(' ')
        )
  } else {
    const labels: BlockLabel[] = []
    const seen = new Set<string>()
    for (const item of input.labels as unknown[]) {
      if (labels.length >= OUTPUT_POLICY.labelItems) break
      const row = record(item)
      const resolved = validSpan(dataset, row?.spanId)
      if (!row || !resolved || seen.has(resolved.span.id)) continue
      seen.add(resolved.span.id)
      const label = [
        'positive',
        'negative',
        'neutral',
        'mixed',
        'uncertain'
      ].includes(String(row.label))
        ? (row.label as BlockLabel['label'])
        : 'uncertain'
      labels.push({
        spanId: publicMetadata(dataset, resolved.span.id, 1100),
        label,
        explanation: modelText(
          row.explanation,
          OUTPUT_POLICY.explanationCharacters,
          sources
        ),
        toneTarget: modelText(
          row.toneTarget,
          OUTPUT_POLICY.toneTargetCharacters,
          sources
        ),
        humanReviewed: false,
        origin: 'model'
      })
    }
    released.labels = labels
  }

  const { fingerprint, budget, now } = budgetFor(dataset)
  released.outputPolicy.windowExpiresAt = new Date(budget.expires).toISOString()
  const charge = sourceCharacters(released)
  checkBudget(budget, now, charge)
  // Entire check and charge are synchronous and occur before the result escapes.
  // Caller/network failures do not refund an attempted release.
  budget.used += charge
  budgets.set(fingerprint, budget)
  released.outputPolicy.releasedCharacters = charge
  released.outputPolicy.remainingCharacters =
    OUTPUT_POLICY.budgetCharacters - budget.used
  return released
}

export interface LocateResult {
  matches: Array<
    Pick<
      PublicEvidenceSpan,
      'id' | 'pageId' | 'start' | 'end' | 'textCharacters'
    >
  >
  matchCount: number
  truncated: boolean
  outputPolicy: { id: string }
}

export function locateSpans(
  dataset: ResearchDataset,
  query: unknown,
  pageIds: string[]
): LocateResult {
  if (
    typeof query !== 'string' ||
    normalize(query).length < OUTPUT_POLICY.locateMinimumQueryCharacters ||
    query.length > OUTPUT_POLICY.locateQueryCharacters
  )
    throw new OutputPolicyError(
      'invalid-input',
      'Enter a locate query of 3–200 characters, with at least 3 after normalization.'
    )
  validateDataset(dataset)
  // Synchronous pre-check and charge BEFORE scanning. Shared by content, not
  // trace, handle, page selection, user or agent. In-process only; restart clears
  // it and multiple workers do not share it. Uses the shared fixed content
  // policy window (at most one hour). Bounds the oracle, not inference.
  const { fingerprint, budget, now } = budgetFor(dataset)
  if (!budget.locateExpires || budget.locateExpires <= now) {
    budget.locateUsed = 0
    budget.locateExpires = Math.min(
      budget.expires,
      now + OUTPUT_POLICY.locateWindowMilliseconds
    )
  }
  if (budget.locateUsed >= OUTPUT_POLICY.locateQueriesPerWindow)
    throw new OutputPolicyError(
      'locate-quota-exhausted',
      'The locate allowance for this source has been reached.',
      Math.max(1, Math.ceil((budget.locateExpires - now) / 1000))
    )
  budget.locateUsed++
  budgets.set(fingerprint, budget)
  const needle = normalize(query)
  const metadata = publicDataset(dataset)
  const matches = metadata.spans.filter((span) => {
    if (!pageIds.includes(span.pageId)) return false
    const page = dataset.pages.find((item) => item.id === span.pageId)
    return (
      page && normalize(page.text.slice(span.start, span.end)).includes(needle)
    )
  })
  return {
    matches: matches
      .slice(0, OUTPUT_POLICY.locateItems)
      .map(({ id, pageId, start, end, textCharacters }) => ({
        id,
        pageId,
        start,
        end,
        textCharacters
      })),
    matchCount: matches.length,
    truncated: matches.length > OUTPUT_POLICY.locateItems,
    outputPolicy: { id: OUTPUT_POLICY.id }
  }
}
