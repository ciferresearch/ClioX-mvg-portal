/** @jest-environment node */
import { createHash } from 'crypto'
import {
  OUTPUT_POLICY as P,
  OUTPUT_WITHHELD,
  OutputPolicyError,
  publicDataset,
  releaseResult,
  assertOutputAvailable,
  locateSpans
} from './output-policy'
import type { ResearchDataset } from './research'

const budgetKey = Symbol.for('cliox.europeana.output-budget.2026-10-07-v1')
const source = Array.from(
  { length: 160 },
  (_, i) =>
    `Archive entry ${i}: Café ﬃ ＡＢＣ harbour report; ships crossed the sea. `
).join('')
function corpus(body = source): ResearchDataset {
  const page = {
    id: 'p1',
    recordId: '/123/Test',
    page: 'p. 1',
    title: 'Archive',
    date: '1918',
    language: 'de',
    source: 'untrusted',
    fulltextUrl: 'https://private/fulltext',
    imageUrl: 'https://private/image',
    imageWidth: 1,
    imageHeight: 1,
    text: body,
    textSha256: 'untrusted',
    rights: 'Public domain',
    attribution: 'Library',
    retrievedAt: '2026-10-07'
  }
  return {
    corpusId: 'handle',
    version: 'v1',
    retrievedAt: page.retrievedAt,
    pages: [page],
    spans: Array.from({ length: 10 }, (_, i) => {
      const start = Math.min(i * 700, body.length - 1)
      const end = Math.min(start + 600, body.length)
      return {
        id: `p1#char=${start},${end}`,
        pageId: 'p1',
        pageLabel: page.page,
        start,
        end,
        text: body.slice(start, end),
        kind: 'text-window' as const
      }
    })
  }
}
const answer = (text = 'A bounded interpretation.') => ({
  answer: text,
  insufficientEvidence: false,
  evidence: [],
  candidateCount: 100,
  model: 'arbitrary model metadata',
  generatedAt: source,
  corpusVersion: source
})
const label = (spanId: string) => ({
  spanId,
  label: 'neutral',
  explanation: 'x'.repeat(600),
  toneTarget: 'y'.repeat(200),
  nested: source
})
beforeEach(() => {
  ;(globalThis as any)[budgetKey].clear()
  jest.useFakeTimers().setSystemTime(new Date('2026-10-07T00:00:00Z'))
})
afterEach(() => jest.useRealTimers())

it('publicDataset omits all text and acquisition URLs, whitelists nested fields and computes hashes', () => {
  const data = corpus()
  Object.assign(data, {
    nested: { secret: source },
    manifestUrl: source,
    warnings: [source]
  })
  Object.assign(data.pages[0], {
    extra: { text: source },
    title: source,
    attribution: source
  })
  Object.assign(data.spans[0], {
    extra: source,
    annotationId: source,
    region: { text: source }
  })
  const output = publicDataset(data)
  expect(output.pages[0]).toMatchObject({
    textCharacters: source.length,
    source: 'https://www.europeana.eu/item/123/Test',
    textSha256: createHash('sha256').update(source).digest('hex'),
    title: OUTPUT_WITHHELD
  })
  for (const page of output.pages) {
    for (const key of ['text', 'fulltextUrl', 'imageUrl', 'extra'])
      expect(page).not.toHaveProperty(key)
  }
  for (const span of output.spans)
    for (const key of ['text', 'region', 'annotationId', 'extra'])
      expect(span).not.toHaveProperty(key)
  expect(output).not.toHaveProperty('manifestUrl')
  expect(JSON.stringify(output)).not.toContain(source.slice(0, 121))
  expect(output.outputPolicy.id).toBe(P.id)
})
it('limits answers and evidence and charges source-derived fields only', () => {
  const data = corpus()
  const out = releaseResult(data, {
    ...answer('z'.repeat(1000)),
    evidence: data.spans
  })
  expect(out.answer).toHaveLength(P.answerCharacters)
  expect(out.evidence).toHaveLength(P.evidenceItems)
  expect(out.evidence.every((item) => item.text.length <= 320)).toBe(true)
  expect(out.outputPolicy.releasedCharacters).toBe(800 + 2 * 320)
  expect(out.outputPolicy.remainingCharacters).toBe(16000 - 1440)
  expect(out.candidateCount).toBe(8)
  expect(out.corpusVersion).toBe('v1')
  expect(out.model).toBe('Configured ClioX service')
})
it('limits labels, explanations and targets, and ignores unknown/duplicate IDs', () => {
  const data = corpus()
  const out = releaseResult(data, {
    labels: [
      label('unknown'),
      label(data.spans[0].id),
      label(data.spans[0].id),
      ...data.spans.slice(1).map((span) => label(span.id))
    ]
  })
  expect(out.labels).toHaveLength(8)
  expect(new Set(out.labels.map((row) => row.spanId)).size).toBe(8)
  expect(
    out.labels.every(
      (row) => row.explanation.length === 160 && row.toneTarget.length === 80
    )
  ).toBe(true)
  expect(out.outputPolicy.releasedCharacters).toBe(8 * (160 + 80))
  expect(JSON.stringify(out)).not.toContain('nested')
})
it('ignores unknown and duplicate evidence IDs and reconstructs quote provenance from server text', () => {
  const data = corpus()
  const span = data.spans[0]
  const out = releaseResult(data, {
    ...answer(),
    evidence: [
      { id: 'unknown', text: source },
      { ...span, text: 'forged', end: 123 },
      span,
      data.spans[1]
    ]
  })
  expect(out.evidence).toHaveLength(2)
  expect(out.evidence[0]).toEqual({
    id: 'p1#char=0,320',
    sourceSpanId: span.id,
    pageId: 'p1',
    pageLabel: 'p. 1',
    start: 0,
    end: 320,
    text: source.slice(0, 320),
    textCharacters: 320,
    truncated: true,
    kind: 'text-window'
  })
  expect(out.evidence[0].id).not.toBe(span.id)
})
it('releases the window of a long span that matches the question, with exact offsets', () => {
  const filler = 'Anzeigen und Nachrichten aus der Stadt Hamburg. '.repeat(30)
  const body =
    filler.slice(0, 300) +
    'Kreuzer stießen bei Ostende und Zeebrügge vor. ' +
    filler.slice(300)
  const data = corpus(body)
  const span = data.spans[0]
  const plain = releaseResult(data, { ...answer(), evidence: [span] })
  expect(plain.evidence[0]).toMatchObject({ start: 0, end: 320 })
  ;(globalThis as any)[budgetKey].clear()
  const out = releaseResult(
    data,
    { ...answer('Ostende and Zeebrügge.'), evidence: [span] },
    'Which two ports are named in the naval report about Ostende?'
  )
  const quote = out.evidence[0]
  expect(quote.text).toContain('Ostende und Zeebrügge')
  expect(quote.start).toBeGreaterThan(span.start)
  expect(quote.end).toBeLessThanOrEqual(span.end)
  expect(quote.text).toBe(body.slice(quote.start, quote.end))
  expect(quote.id).toBe(`p1#char=${quote.start},${quote.end}`)
  expect(quote).toMatchObject({ textCharacters: 320, truncated: true })
  expect(body[quote.start - 1]).toBe(' ')
  const at = quote.text.indexOf('Ostende')
  expect(at).toBeGreaterThan(80)
  expect(at).toBeLessThan(240)
})
it('keeps id/end/sourceSpanId consistent for an untruncated quote', () => {
  const data = corpus()
  data.spans[0] = {
    ...data.spans[0],
    id: 'p1#char=0,100',
    end: 100,
    text: source.slice(0, 100)
  }
  const quote = releaseResult(data, { ...answer(), evidence: [data.spans[0]] })
    .evidence[0]
  expect(quote).toMatchObject({
    id: data.spans[0].id,
    sourceSpanId: data.spans[0].id,
    end: 100,
    textCharacters: 100,
    truncated: false
  })
})
it.each([3, 100, 1279])(
  'quotes at most a quarter of a %i-character page',
  (length) => {
    const data = corpus(source.slice(0, length))
    const quotes = releaseResult(data, {
      ...answer(),
      evidence: [data.spans[0]]
    }).evidence
    expect(quotes.reduce((n, quote) => n + quote.text.length, 0)).toBe(
      Math.min(Math.floor(length / 4), data.spans[0].end)
    )
  }
)
it('does not split surrogate pairs or misreport quote offsets', () => {
  const data = corpus('a'.repeat(319) + '😀' + source)
  const out = releaseResult(data, {
    ...answer('z'.repeat(799) + '😀'),
    evidence: data.spans
  })
  expect(out.answer).toHaveLength(799)
  expect(out.evidence[0]).toMatchObject({
    end: 319,
    textCharacters: 319,
    truncated: true
  })
})
it.each([
  ['verbatim', (s: string) => s],
  ['NFKC', (s: string) => s.normalize('NFKC')],
  ['case', (s: string) => s.toUpperCase()],
  ['whitespace', (s: string) => s.replace(/ /g, '\n\t  ')],
  [
    'combined',
    (s: string) => s.normalize('NFKC').toUpperCase().replace(/ /g, '\n\t  ')
  ]
])('withholds %s copying independently of quote length', (_, transform) => {
  const copied = transform(source.slice(20, 200))
  const data = corpus()
  const out = releaseResult(data, {
    ...answer(copied),
    evidence: [data.spans[0]]
  })
  expect(out.answer).toBe(OUTPUT_WITHHELD)
  expect(out.outputPolicy.releasedCharacters).toBe(320)
  const labels = releaseResult(data, {
    labels: [
      { ...label(data.spans[0].id), explanation: copied, toneTarget: copied }
    ]
  })
  expect(labels.labels[0]).toMatchObject({
    explanation: OUTPUT_WITHHELD,
    toneTarget: OUTPUT_WITHHELD
  })
  expect(labels.outputPolicy.releasedCharacters).toBe(0)
})
it('uses a 120 normalized character run, not the evidence quote limit', () => {
  const data = corpus('abcdefghijklmnopqrstuvwxyz'.repeat(200))
  expect(
    releaseResult(
      data,
      answer(data.pages[0].text.slice(0, P.copyRunCharacters - 1))
    ).answer
  ).not.toBe(OUTPUT_WITHHELD)
  expect(
    releaseResult(
      data,
      answer(data.pages[0].text.slice(0, P.copyRunCharacters))
    ).answer
  ).toBe(OUTPUT_WITHHELD)
})
it('inspects copied tails beyond every output clip length before truncating', () => {
  const data = corpus()
  expect(
    releaseResult(data, answer('x'.repeat(6000) + source.slice(0, 200))).answer
  ).toBe(OUTPUT_WITHHELD)
  const out = releaseResult(data, {
    labels: [
      {
        ...label(data.spans[0].id),
        explanation: 'x'.repeat(700) + source,
        toneTarget: 'y'.repeat(300) + source
      }
    ]
  })
  expect(out.labels[0]).toMatchObject({
    explanation: OUTPUT_WITHHELD,
    toneTarget: OUTPUT_WITHHELD
  })
})
it('withholds whole short pages and oversized model strings', () => {
  const data = corpus('A short source body.')
  expect(releaseResult(data, answer(data.pages[0].text)).answer).toBe(
    OUTPUT_WITHHELD
  )
  expect(
    releaseResult(corpus(), answer('x'.repeat(P.modelInputCharacters + 1)))
      .answer
  ).toBe(OUTPUT_WITHHELD)
})
it('omits evidence for insufficient answers and rejects malformed results/corpora', () => {
  const data = corpus()
  expect(
    releaseResult(data, {
      ...answer(),
      insufficientEvidence: true,
      evidence: data.spans
    }).evidence
  ).toEqual([])
  expect(() => releaseResult(data, { nested: source })).toThrow(
    OutputPolicyError
  )
  expect(() => publicDataset({ ...data, pages: [] })).toThrow(OutputPolicyError)
  data.spans[0].end = source.length + 1
  expect(publicDataset(data).spans).toHaveLength(9)
})
it('fails preflight and final release on an exhausted budget with retry timing', () => {
  const data = corpus()
  for (let i = 0; i < 20; i++) releaseResult(data, answer('z'.repeat(800)))
  for (const work of [
    () => assertOutputAvailable(data),
    () => releaseResult(data, answer('x'))
  ]) {
    try {
      work()
      throw new Error('Expected refusal')
    } catch (error) {
      expect(error).toMatchObject({
        code: 'budget-exhausted',
        retryAfterSeconds: 3600
      })
    }
  }
})
it('does not charge rejected over-budget releases and does not reserve preflight budget', () => {
  const data = corpus()
  for (let i = 0; i < 19; i++) releaseResult(data, answer('z'.repeat(800)))
  releaseResult(data, answer('z'.repeat(790)))
  assertOutputAvailable(data)
  expect(() => releaseResult(data, answer('too many characters'))).toThrow(
    OutputPolicyError
  )
  const out = releaseResult(data, answer('1234567890'))
  expect(out.outputPolicy.remainingCharacters).toBe(0)
})
it('shares budget across changed corpus handles, versions, page IDs, order and duplicates', () => {
  const data = corpus()
  for (let i = 0; i < 20; i++) releaseResult(data, answer('z'.repeat(800)))
  const reimport = {
    ...data,
    corpusId: 'different',
    version: 'different',
    pages: [{ ...data.pages[0], id: 'different' }, data.pages[0]]
  }
  expect(() => assertOutputAvailable(reimport)).toThrow(
    expect.objectContaining({ code: 'budget-exhausted' })
  )
})
it('refuses new corpus capacity in preflight and release but permits existing corpora', () => {
  for (let i = 0; i < P.maximumActiveCorpora; i++)
    releaseResult(corpus(`${source} unique ${i}`), answer('x'))
  const data = corpus('another body ' + source)
  for (const work of [
    () => assertOutputAvailable(data),
    () => releaseResult(data, answer())
  ]) {
    expect(work).toThrow(
      expect.objectContaining({
        code: 'capacity-exhausted',
        retryAfterSeconds: 3600
      })
    )
  }
  expect(() =>
    assertOutputAvailable(corpus(`${source} unique 0`))
  ).not.toThrow()
})
it('window expiry resets budget and frees capacity with rounded retry seconds', () => {
  const data = corpus()
  for (let i = 0; i < 20; i++) releaseResult(data, answer('z'.repeat(800)))
  jest.advanceTimersByTime(P.windowMilliseconds - 1)
  expect(() => assertOutputAvailable(data)).toThrow(
    expect.objectContaining({ retryAfterSeconds: 1 })
  )
  jest.advanceTimersByTime(1)
  assertOutputAvailable(data)
  expect(
    releaseResult(data, answer('x')).outputPolicy.remainingCharacters
  ).toBe(P.budgetCharacters - 1)
  expect((globalThis as any)[budgetKey].size).toBe(1)
})
it('capacity is released when all corpus windows expire', () => {
  for (let i = 0; i < P.maximumActiveCorpora; i++)
    releaseResult(corpus(source + i), answer('x'))
  const other = corpus(source + 'another')
  expect(() => assertOutputAvailable(other)).toThrow(
    expect.objectContaining({ code: 'capacity-exhausted' })
  )
  jest.advanceTimersByTime(P.windowMilliseconds)
  assertOutputAvailable(other)
  expect(
    releaseResult(other, answer('x')).outputPolicy.remainingCharacters
  ).toBe(P.budgetCharacters - 1)
  expect((globalThis as any)[budgetKey].size).toBe(1)
})

it('charges locate before scanning, shares fingerprints across handles and resets at expiry', () => {
  const data = corpus()
  for (let i = 0; i < P.locateQueriesPerWindow; i++)
    locateSpans(
      { ...data, corpusId: `handle-${i}`, version: `version-${i}` },
      'archive',
      ['p1']
    )
  const scan = jest.spyOn(data.spans, 'flatMap')
  expect(() =>
    locateSpans({ ...data, pages: [...data.pages, ...data.pages] }, 'archive', [
      'p1'
    ])
  ).toThrow('locate allowance')
  expect(scan).not.toHaveBeenCalled()
  scan.mockRestore()
  jest.advanceTimersByTime(P.locateWindowMilliseconds)
  expect(locateSpans(data, 'archive', ['p1']).matchCount).toBeGreaterThan(0)
})
it.each(['x', ' Ａ  ', 'a b'.slice(0, 2)])(
  'rejects a short normalized locate query %p without charging',
  (query) => {
    expect(() => locateSpans(corpus(), query, ['p1'])).toThrow('3–200')
    expect((globalThis as any)[budgetKey].size).toBe(0)
  }
)
it('an exhausted locate quota does not consume the released-character budget', () => {
  const data = corpus()
  for (let i = 0; i < P.locateQueriesPerWindow; i++)
    locateSpans(data, 'absent', ['p1'])
  expect(() => locateSpans(data, 'archive', ['p1'])).toThrow('locate allowance')
  expect(releaseResult(data, answer()).outputPolicy.remainingCharacters).toBe(
    P.budgetCharacters - answer().answer.length
  )
})
