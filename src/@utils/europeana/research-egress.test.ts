/** @jest-environment node */
import handler from '../../pages/api/europeana/research'
import { backendRequest } from './backend'
import { loadResearchDataset } from './research-server'
import { fetchLiveCorpus, getLiveCorpus } from './live-server'
import { readFile } from 'node:fs/promises'
import {
  OUTPUT_POLICY as P,
  OUTPUT_WITHHELD,
  releaseResult
} from './output-policy'
import { recordedActivity, recordedTrace } from './activity-journal'
import { randomUUID } from 'crypto'
import { sha256 } from './activity-server'
import type { ResearchDataset } from './research'

jest.mock('./backend', () => ({
  backendRequest: jest.fn(),
  backendTransport: () => 'direct-service',
  uploadPayload: (id: string, chunks: unknown[]) => ({
    session_id: id,
    knowledge_chunks: chunks
  }),
  chatPayload: (id: string, message: string) => ({ session_id: id, message })
}))
jest.mock('./research-server', () => ({ loadResearchDataset: jest.fn() }))
jest.mock('./live-server', () => ({
  fetchLiveCorpus: jest.fn(),
  retainCorpus: (data: unknown) => data,
  getLiveCorpus: jest.fn()
}))
jest.mock('node:fs/promises', () => ({
  ...jest.requireActual('node:fs/promises'),
  readFile: jest.fn()
}))
const backend = backendRequest as jest.Mock
const load = loadResearchDataset as jest.Mock
const live = fetchLiveCorpus as jest.Mock
const getLive = getLiveCorpus as jest.Mock
const read = readFile as jest.Mock
const source = Array.from(
  { length: 120 },
  (_, i) =>
    `Ostende archive entry ${i}: Café ﬃ ＡＢＣ harbour report describes vessels crossing the open sea. `
).join('')
function corpus(): ResearchDataset {
  const page = {
    id: 'p1',
    recordId: '/123/Test',
    page: 'p. 1',
    title: 'Archive',
    date: '1918',
    language: 'de',
    source: 'https://private/source',
    fulltextUrl: 'https://private/fulltext',
    imageUrl: 'https://private/image',
    imageWidth: 1,
    imageHeight: 1,
    text: source,
    textSha256: 'untrusted',
    rights: 'Public domain',
    attribution: 'Library',
    retrievedAt: '2026-10-07'
  }
  return {
    corpusId: 'handle',
    expiresAt: '2026-10-07T01:00:00Z',
    version: 'v1',
    retrievedAt: page.retrievedAt,
    pages: [page],
    spans: Array.from({ length: 8 }, (_, i) => {
      const start = i * 800
      const end = start + 700
      return {
        id: `p1#char=${start},${end}`,
        pageId: page.id,
        pageLabel: page.page,
        start,
        end,
        text: source.slice(start, end),
        kind: 'text-window' as const
      }
    })
  }
}
let data: ResearchDataset
const ask = {
  action: 'ask',
  pageIds: ['p1'],
  corpusVersion: 'v1',
  question: 'What happened at Ostende?'
}
async function invoke(
  body?: unknown,
  mode?: string,
  options: { method?: string; headers?: object } = {}
) {
  if (
    body &&
    (body as any).action !== 'import' &&
    (body as any).traceId === undefined
  ) {
    const source = await invoke()
    body = { ...(body as object), traceId: source.data.traceId }
  }
  let status = 200
  let value: any
  const headers: Record<string, string> = {}
  const res: any = {
    setHeader: (name: string, value: string) => {
      headers[name] = value
    },
    status: (code: number) => {
      status = code
      return res
    },
    json: (json: unknown) => {
      value = json
      return res
    }
  }
  await handler(
    {
      method: body ? 'POST' : 'GET',
      body,
      headers: {},
      query: { mode },
      ...options
    } as any,
    res
  )
  expect(headers['Cache-Control']).toBe('no-store')
  expect(headers['X-Output-Policy']).toBe(P.id)
  return { status, data: value, headers }
}
// Search serialized responses for source substrings, including escaped whitespace.
// Only validated ReleasedEvidence.text may exceed the copy-run threshold.
function expectNoCorpus(value: unknown, dataset = data) {
  const json = JSON.stringify(value)
  const withoutQuotes = JSON.stringify(value, function (key, item) {
    return key === 'text' &&
      typeof this.sourceSpanId === 'string' &&
      typeof this.truncated === 'boolean'
      ? ''
      : item
  })
  function hasSharedRun(output: string, length: number) {
    const windows = new Set<string>()
    for (let i = 0; i <= output.length - length; i++)
      windows.add(output.slice(i, i + length))
    return dataset.pages.some((page) => {
      const encoded = JSON.stringify(page.text).slice(1, -1)
      for (let i = 0; i <= encoded.length - length; i++)
        if (windows.has(encoded.slice(i, i + length))) return true
      return false
    })
  }
  expect(hasSharedRun(json, P.evidenceCharacters + 1)).toBe(false)
  expect(hasSharedRun(withoutQuotes, P.copyRunCharacters + 1)).toBe(false)
  for (const page of dataset.pages) {
    expect(json).not.toContain(JSON.stringify(page.text).slice(1, -1))
    expect(json).not.toContain(page.fulltextUrl)
    expect(json).not.toContain(page.imageUrl)
  }
  for (const span of dataset.spans.filter(
    (span) => span.text.length > P.evidenceCharacters
  ))
    expect(json).not.toContain(JSON.stringify(span.text).slice(1, -1))
  expect(json).not.toContain('fulltextUrl')
  expect(json).not.toContain('imageUrl')
}
function model(result: unknown, modelName = source) {
  backend.mockImplementation(async (action) =>
    action === 'chat'
      ? {
          response: JSON.stringify(result),
          metadata: { model_used: modelName, nested: { text: source } },
          raw: source
        }
      : { success: true, text: source }
  )
}
function exhaust(dataset = data) {
  for (let i = 0; i < 20; i++)
    releaseResult(dataset, { answer: 'z'.repeat(800) })
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(globalThis as any)[
    Symbol.for('cliox.europeana.output-budget.2026-10-07-v1')
  ].clear()
  ;(globalThis as any)[
    Symbol.for('cliox.europeana.activity-journal.v2')
  ].clear()
  data = corpus()
  load.mockResolvedValue(data)
  live.mockResolvedValue(data)
  getLive.mockImplementation(() => data)
  read.mockImplementation(jest.requireActual('node:fs/promises').readFile)
  model({
    answer: 'A bounded summary.',
    insufficientEvidence: false,
    evidenceIds: ['e1', 'e2', 'e3'],
    nested: { text: source }
  })
  jest
    .spyOn(global, 'fetch')
    .mockRejectedValue(new Error('Network is forbidden in egress tests'))
})
afterEach(() => jest.restoreAllMocks())

it.each(['saved', 'live'])(
  '%s dataset responses strip raw and nested source payloads',
  async (kind) => {
    Object.assign(data, {
      extra: { source },
      warnings: [source],
      manifestUrl: source
    })
    Object.assign(data.pages[0], {
      nested: { source },
      title: source,
      attribution: source,
      rights: source
    })
    Object.assign(data.spans[0], { nested: { source }, annotationId: source })
    const out = await invoke(
      kind === 'live'
        ? { action: 'import', record: '/123/Test', maxPages: 1 }
        : undefined
    )
    expect(out.status).toBe(200)
    expectNoCorpus(out.data)
    expect(out.data.pages[0]).not.toHaveProperty('text')
    expect(out.data.spans[0]).not.toHaveProperty('text')
    expect(out.data.pages[0].textCharacters).toBe(source.length)
    expect(out.data.pages[0].textSha256).toBe(sha256(source))
    expect(out.data.activity.sources[0].source).toBe(
      'https://www.europeana.eu/item/123/Test'
    )
    expect(backend).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  }
)
it('ask releases only bounded reconstructed quotes and hashes the untrusted model identity', async () => {
  const out = await invoke(ask)
  expect(out.status).toBe(200)
  expect(out.data.evidence).toHaveLength(2)
  // The question may move the 320-character window inside the cited span.
  const quote = out.data.evidence[0]
  expect(quote).toMatchObject({
    sourceSpanId: data.spans[0].id,
    id: `p1#char=${quote.start},${quote.end}`,
    textCharacters: 320,
    truncated: true
  })
  expect(quote.start).toBeGreaterThanOrEqual(data.spans[0].start)
  expect(quote.end).toBeLessThanOrEqual(data.spans[0].end)
  expect(out.data.activity.model).toEqual({
    state: 'reported',
    nameSha256: sha256(source)
  })
  expect(out.data.outputPolicy.releasedCharacters).toBe(
    'A bounded summary.'.length + 640
  )
  expectNoCorpus(out.data)
  expect(backend.mock.calls.map((call) => call[0])).toEqual([
    'upload',
    'chat',
    'clear'
  ])
})
it.each(['answer', 'labels'])(
  'checks copied tails before %s parser clipping, including normalized Unicode',
  async (kind) => {
    const copied = source
      .slice(0, 220)
      .normalize('NFKC')
      .toUpperCase()
      .replace(/ /g, '\n\t ')
    model(
      kind === 'answer'
        ? {
            answer: 'x'.repeat(6000) + copied,
            insufficientEvidence: false,
            evidenceIds: ['e1']
          }
        : [
            {
              spanId: 'e1',
              label: 'neutral',
              explanation: 'x'.repeat(700) + copied,
              toneTarget: 'y'.repeat(300) + copied
            }
          ]
    )
    const out = await invoke(
      kind === 'answer'
        ? ask
        : { ...ask, action: 'analyze', spanIds: [data.spans[0].id] }
    )
    expect(out.status).toBe(200)
    if (kind === 'answer') expect(out.data.answer).toBe(OUTPUT_WITHHELD)
    else
      expect(out.data.labels[0]).toMatchObject({
        explanation: OUTPUT_WITHHELD,
        toneTarget: OUTPUT_WITHHELD
      })
    expect(out.data.activity.events).toContainEqual(
      expect.objectContaining({ stage: 'output-policy', outcome: 'failed' })
    )
    expectNoCorpus(out.data)
  }
)
it('analyze limits label content and strips arbitrary nested model output', async () => {
  model(
    data.spans.map((_, i) => ({
      spanId: `e${i + 1}`,
      label: 'neutral',
      explanation: 'x'.repeat(1000),
      toneTarget: 'y'.repeat(500),
      nested: { source }
    }))
  )
  const out = await invoke({
    ...ask,
    action: 'analyze',
    spanIds: data.spans.map((span) => span.id)
  })
  expect(out.status).toBe(200)
  expect(out.data.labels).toHaveLength(8)
  expect(
    out.data.labels.every(
      (row: any) =>
        row.explanation.length === 160 && row.toneTarget.length === 80
    )
  ).toBe(true)
  expectNoCorpus(out.data)
})
it('routes no-candidate answers through release without a backend call', async () => {
  const out = await invoke({ ...ask, question: 'zzzzzzunknown' })
  expect(out.status).toBe(200)
  expect(out.data.outputPolicy.id).toBe(P.id)
  expect(out.data.outputPolicy.releasedCharacters).toBe(out.data.answer.length)
  expect(out.data.activity.cleanup).toBe('not-needed')
  expectNoCorpus(out.data)
  expect(backend).not.toHaveBeenCalled()
})
it('releases the real 1,716-character recorded evidence against the saved dataset', async () => {
  const savedData = await jest
    .requireActual('./research-server')
    .loadResearchDataset()
  load.mockResolvedValue(savedData)
  const out = await invoke(undefined, 'replay')
  expect(out.status).toBe(200)
  expect(out.data.questions.length).toBeGreaterThan(0)
  expect(out.data.questions[0].result.evidence[0]).toMatchObject({
    textCharacters: 320,
    truncated: true
  })
  expect(
    out.data.questions.every((row: any) => row.result.outputPolicy.id === P.id)
  ).toBe(true)
  expect(out.data.analysis.result.outputPolicy.id).toBe(P.id)
  expectNoCorpus(out.data, savedData)
  expect(backend).not.toHaveBeenCalled()
})
it('replay strips nested/raw recorded fields, applies copy checks and charges every released result', async () => {
  read.mockResolvedValue(
    JSON.stringify({
      corpusVersion: 'v1',
      recordedAt: source,
      pageIds: ['p1', source],
      extra: source,
      activity: { text: source },
      questions: [
        {
          question: source,
          result: { answer: source, evidence: data.spans, nested: source }
        }
      ],
      analysis: {
        spanIds: [source],
        result: {
          labels: [
            {
              spanId: data.spans[0].id,
              label: 'neutral',
              explanation: source,
              toneTarget: source
            }
          ]
        }
      }
    })
  )
  const out = await invoke(undefined, 'replay')
  expect(out.status).toBe(200)
  expect(out.data.questions[0].result.answer).toBe(OUTPUT_WITHHELD)
  expect(out.data.questions[0].question).toBe(OUTPUT_WITHHELD)
  expect(out.data.analysis.result.outputPolicy.remainingCharacters).toBe(
    16000 - 640
  )
  expectNoCorpus(out.data)
})
it('locate caps results and exposes only identifiers, offsets, lengths, match count and a text-free activity', async () => {
  data.spans = Array.from({ length: 110 }, (_, i) => ({
    ...data.spans[0],
    id: `p1#char=${i},${i + 700}`,
    start: i,
    end: i + 700,
    text: source.slice(i, i + 700)
  }))
  const out = await invoke({
    ...ask,
    action: 'locate',
    query: 'ＯＳＴＥＮＤＥ'
  })
  expect(out.status).toBe(200)
  expect(out.data.matches).toHaveLength(P.locateItems)
  expect(out.data.matchCount).toBe(110)
  expect(out.data.truncated).toBe(true)
  expect(Object.keys(out.data.matches[0]).sort()).toEqual([
    'end',
    'id',
    'pageId',
    'start',
    'textCharacters'
  ])
  expect(out.data.activity.action).toBe('locate')
  expect(out.data.activity.request.querySha256).toBe(sha256('ＯＳＴＥＮＤＥ'))
  expectNoCorpus(out.data)
  expect(backend).not.toHaveBeenCalled()
})
it.each(['', ' ', 'x'.repeat(201), null])(
  'rejects invalid locate query %p with an output-policy activity',
  async (query) => {
    const out = await invoke({ ...ask, action: 'locate', query })
    expect(out.status).toBe(400)
    expect(out.data.code).toBe('invalid-input')
    expect(out.data.activity.status).toBe('failed')
    expect(out.data.activity.events).toContainEqual(
      expect.objectContaining({ stage: 'output-policy', outcome: 'failed' })
    )
    expectNoCorpus(out.data)
  }
)
it.each([
  [{ corpusVersion: 'stale' }, {}, 409],
  [{ pageIds: ['unknown'] }, {}, 400],
  [
    {},
    { headers: { origin: 'https://elsewhere.test', host: 'localhost' } },
    403
  ],
  [{}, { method: 'DELETE' }, 405]
])(
  'locate enforces origin, method, version and page membership',
  async (body, options, status) => {
    const out = await invoke(
      { ...ask, action: 'locate', query: 'Ostende', ...body },
      undefined,
      options
    )
    expect(out.status).toBe(status)
    expectNoCorpus(out.data)
    expect(backend).not.toHaveBeenCalled()
  }
)
it.each(['ask', 'analyze', 'no-candidates', 'replay'])(
  'exhausted budget fails %s before any backend call',
  async (action) => {
    exhaust()
    const out =
      action === 'replay'
        ? await invoke(undefined, 'replay')
        : await invoke({
            ...ask,
            action: action === 'analyze' ? action : 'ask',
            spanIds: [data.spans[0].id],
            question: action === 'no-candidates' ? 'zzzzxx' : ask.question
          })
    expect(out.status).toBe(429)
    expect(out.data.code).toBe('budget-exhausted')
    expect(Number(out.headers['Retry-After'])).toBeGreaterThan(0)
    expect(out.data.activity.status).toBe('failed')
    expect(out.data.activity.cleanup).toBe('not-needed')
    expectNoCorpus(out.data)
    expect(backend).not.toHaveBeenCalled()
  }
)
it('capacity exhaustion fails before upload and supplies Retry-After', async () => {
  for (let i = 0; i < P.maximumActiveCorpora; i++)
    releaseResult(
      { ...data, pages: [{ ...data.pages[0], text: source + i }] },
      { answer: 'x' }
    )
  const out = await invoke(ask)
  expect(out.status).toBe(429)
  expect(out.data.code).toBe('capacity-exhausted')
  expect(Number(out.headers['Retry-After'])).toBeGreaterThan(0)
  expect(backend).not.toHaveBeenCalled()
  expectNoCorpus(out.data)
})
it.each([false, true])(
  'a final budget failure still attempts cleanup (DELETE failure: %s)',
  async (deleteFails) => {
    const impl = backend.getMockImplementation()
    backend.mockImplementation(async (action, ...args) => {
      if (action === 'chat') exhaust()
      if (action === 'clear' && deleteFails) throw new Error(source)
      return impl(action, ...args)
    })
    const out = await invoke(ask)
    expect(out.status).toBe(429)
    expect(out.data.activity.cleanup).toBe(
      deleteFails ? 'failed' : 'acknowledged'
    )
    expect(out.data.activity.infrastructure.deletionVerified).toBe(false)
    expect(out.data.activity.events).toContainEqual(
      expect.objectContaining({
        stage: 'session-cleanup',
        outcome: deleteFails ? 'failed' : 'succeeded'
      })
    )
    expect(backend.mock.calls.map((call) => call[0])).toEqual([
      'upload',
      'chat',
      'clear'
    ])
    expectNoCorpus(out.data)
  }
)
it.each(['import', 'load', 'upload', 'chat', 'clear', 'status', 'replay'])(
  'does not echo source-bearing %s error bodies',
  async (failure) => {
    const impl = backend.getMockImplementation()
    if (failure === 'import') live.mockRejectedValue(new Error(source))
    else if (failure === 'load') load.mockRejectedValue(new Error(source))
    else if (failure === 'replay') read.mockRejectedValue(new Error(source))
    else
      backend.mockImplementation((action, ...args) =>
        action === (failure === 'status' ? 'health' : failure)
          ? Promise.reject(new Error(source))
          : impl(action, ...args)
      )
    const out = await invoke(
      failure === 'import'
        ? { action: 'import', record: '/123/Test' }
        : ['status', 'replay', 'load'].includes(failure)
        ? undefined
        : ask,
      ['status', 'replay'].includes(failure) ? failure : undefined
    )
    expect(out.status).toBe(
      failure === 'clear'
        ? 200
        : failure === 'status'
        ? 503
        : failure === 'replay'
        ? 404
        : failure === 'load'
        ? 410
        : 502
    )
    if (failure === 'clear') {
      expect(out.data.sessionCleared).toBe(false)
      expect(out.data.activity.cleanup).toBe('failed')
    }
    expectNoCorpus(out.data)
  }
)
it('status never forwards raw backend model arrays or nested fields', async () => {
  backend.mockResolvedValue({
    available_models: [source, { text: source }],
    llm_connected: true,
    nested: source
  })
  const out = await invoke(undefined, 'status')
  expect(out.data.modelCount).toBe(2)
  expectNoCorpus(out.data)
})
it('rejects malformed model responses while cleaning up without echoing them', async () => {
  backend.mockImplementation(async (action) =>
    action === 'chat'
      ? { response: source, metadata: { model_used: source } }
      : {}
  )
  const out = await invoke(ask)
  expect(out.status).toBe(502)
  expect(out.data.activity.cleanup).toBe('acknowledged')
  expectNoCorpus(out.data)
})
it('locate searches only the selected pages and reports zero matches without snippets', async () => {
  data.pages.push({
    ...data.pages[0],
    id: 'p2',
    text: 'Different archive body. '.repeat(100)
  })
  data.spans.push({
    ...data.spans[0],
    id: 'p2#char=0,700',
    pageId: 'p2',
    text: data.pages[1].text.slice(0, 700)
  })
  const out = await invoke({
    ...ask,
    action: 'locate',
    query: 'Ostende',
    pageIds: ['p2']
  })
  expect(out.status).toBe(200)
  expect(out.data).toMatchObject({
    matches: [],
    matchCount: 0,
    truncated: false
  })
  expect(out.data.activity.sources.map((page: any) => page.pageId)).toEqual([
    'p2'
  ])
  expectNoCorpus(out.data)
})
it('maps invalid server corpus to a safe 400 output-policy failure', async () => {
  data.pages[0].text = 'x'.repeat(150001)
  const out = await invoke()
  expect(out.status).toBe(400)
  expect(out.data.code).toBe('invalid-input')
  expect(out.data.activity.events).toContainEqual(
    expect.objectContaining({ stage: 'output-policy', outcome: 'failed' })
  )
  expect(JSON.stringify(out.data)).not.toContain('x'.repeat(121))
  expect(backend).not.toHaveBeenCalled()
})
it('rejects stale replay versions and never selects a live corpus from a GET body', async () => {
  read.mockResolvedValue(
    JSON.stringify({ corpusVersion: 'stale', text: source })
  )
  const out = await invoke({ corpusId: 'live-handle' }, 'replay', {
    method: 'GET'
  })
  expect(out.status).toBe(400)
  expect(out.data.code).toBe('invalid-input')
  expect(getLive).not.toHaveBeenCalled()
  expectNoCorpus(out.data)
})

it('stops a 104-request locate loop at 60 even when a new trace is issued', async () => {
  let { traceId } = (await invoke()).data
  for (let i = 0; i < 104; i++) {
    if (i === 60) ({ traceId } = (await invoke()).data)
    const out = await invoke({
      ...ask,
      traceId,
      action: 'locate',
      query: `Ostende${i}`
    })
    expect(out.status).toBe(i < P.locateQueriesPerWindow ? 200 : 429)
    if (out.status === 429) {
      expect(Number(out.headers['Retry-After'])).toBeGreaterThan(0)
      expect(out.data.code).toBe('locate-quota-exhausted')
      expect(out.data.activity.events).toContainEqual(
        expect.objectContaining({ stage: 'output-policy', outcome: 'failed' })
      )
    }
    expect(out.data.activity.traceId).toBe(traceId)
    expectNoCorpus(out.data)
  }
  expect(backend).not.toHaveBeenCalled()
})
it.each([null, '', 'not-a-uuid', randomUUID()])(
  'rejects absent, malformed or unissued trace %p',
  async (traceId) => {
    const out = await invoke({ ...ask, traceId })
    expect(out.status).toBe(400)
    expect(backend).not.toHaveBeenCalled()
  }
)
it('links source, locate, ask, review and export, retaining only note/name hashes', async () => {
  const source = (await invoke()).data
  const { traceId } = source
  const located = await invoke({
    ...ask,
    traceId,
    action: 'locate',
    query: 'Ostende'
  })
  const answered = await invoke({ ...ask, traceId })
  const note = data.pages[0].text.slice(0, 1400)
  const review = await invoke({
    ...ask,
    traceId,
    action: 'review',
    runId: answered.data.activity.runId,
    target: { sourceSpanId: answered.data.evidence[0].sourceSpanId },
    decision: 'accepted',
    reviewer: 'Reviewer Example',
    note
  })
  expect(review.status).toBe(200)
  expect(review.data.activity.parentRunId).toBe(answered.data.activity.runId)
  expect(review.data.review).toMatchObject({
    noteSha256: sha256(note),
    noteCharacters: note.length,
    reviewer: {
      identity: 'self-reported',
      nameSha256: sha256('Reviewer Example')
    }
  })
  const out = await invoke({
    ...ask,
    traceId,
    action: 'export',
    answer: source,
    pages: data.pages,
    note,
    reviewer: 'injected'
  })
  expect(out.status).toBe(200)
  expect(out.data.exportBody.releasedResults).toEqual([
    {
      runId: answered.data.activity.runId,
      result: recordedActivity(answered.data.activity.runId).results[0]
    }
  ])
  expect(out.data.exportBody.activityRecords.map((r: any) => r.runId)).toEqual([
    source.activity.runId,
    located.data.activity.runId,
    answered.data.activity.runId,
    review.data.runId
  ])
  expect(out.data.activity.outputSha256).toBe(
    sha256(JSON.stringify(out.data.exportBody, null, 2))
  )
  expect(recordedTrace(traceId).map((entry) => entry.record.action)).toEqual([
    'load-source',
    'locate',
    'ask',
    'review',
    'export'
  ])
  expect(out.data.exportBody.reviews).toHaveLength(1)
  expect(out.data.exportBody.dataset.traceId).toBe(traceId)
  expect(JSON.stringify(out.data)).not.toContain(note)
  expect(JSON.stringify(out.data)).not.toContain('Reviewer Example')
  expect(JSON.stringify(out.data)).not.toContain('injected')
  expectNoCorpus(out.data)
  expect(backend.mock.calls.map((call) => call[0])).toEqual([
    'upload',
    'chat',
    'clear'
  ])
})
it('validates label changes and export subsets against journal results', async () => {
  const { traceId } = (await invoke()).data
  model([{ spanId: 'e1', label: 'neutral', explanation: 'Brief reason.' }])
  const analyzed = await invoke({
    ...ask,
    traceId,
    action: 'analyze',
    spanIds: [data.spans[0].id]
  })
  const base = {
    ...ask,
    traceId,
    action: 'review',
    runId: analyzed.data.activity.runId,
    target: { spanId: data.spans[0].id },
    decision: 'label-changed',
    newLabel: 'mixed',
    reviewer: 'Self reported'
  }
  const reviewed = await invoke(base)
  expect(reviewed.status).toBe(200)
  expect(reviewed.data.review.newLabel).toBe('mixed')
  for (const change of [
    { newLabel: 'made-up' },
    { target: { spanId: data.spans[1].id } },
    { runId: randomUUID() },
    { note: {} },
    { decision: 'accepted' }
  ]) {
    const out = await invoke({ ...base, ...change })
    expect(out.status).toBe(400)
    expectNoCorpus(out.data)
  }
  const exported = await invoke({
    ...ask,
    traceId,
    action: 'export',
    runIds: [reviewed.data.runId]
  })
  expect(exported.data.exportBody.releasedResults).toEqual([])
  expect(exported.data.exportBody.reviews).toHaveLength(1)
  expect(exported.data.exportBody.activityRecords.length).toBeGreaterThan(2)
  const other = (await invoke()).data.traceId
  expect((await invoke({ ...base, traceId: other })).status).toBe(400)
  expect(
    (
      await invoke({
        ...ask,
        traceId: other,
        action: 'export',
        runIds: [analyzed.data.activity.runId]
      })
    ).status
  ).toBe(400)
  const stale = {
    ...recordedActivity(analyzed.data.activity.runId).record,
    corpusVersion: 'different'
  }
  const { rememberActivity } = jest.requireActual('./activity-journal')
  rememberActivity(stale)
  expect((await invoke(base)).status).toBe(400)
})
it('journals every bounded replay release and exports them without recorded payload passthrough', async () => {
  read.mockResolvedValue(
    JSON.stringify({
      corpusVersion: 'v1',
      questions: [
        {
          question: 'Example',
          result: { answer: 'Short answer', evidence: data.spans }
        }
      ],
      analysis: {
        result: { labels: [{ spanId: data.spans[0].id, label: 'neutral' }] }
      }
    })
  )
  const replay = await invoke(undefined, 'replay')
  const { traceId } = replay.data.activity
  const out = await invoke({ ...ask, traceId, action: 'export' })
  expect(out.status).toBe(200)
  expect(out.data.exportBody.releasedResults.map((r: any) => r.result)).toEqual(
    [replay.data.questions[0].result, replay.data.analysis.result]
  )
  expect(out.data.exportBody.dataset.traceId).toBe(traceId)
  expectNoCorpus(out.data)
  expect(backend).not.toHaveBeenCalled()
})
it('exports the no-candidate release and rejects expired trace/run IDs', async () => {
  const { traceId } = (await invoke()).data
  const out = await invoke({ ...ask, traceId, question: 'zzzzzzunknown' })
  expect(recordedActivity(out.data.activity.runId).results).toHaveLength(1)
  const now = Date.now()
  jest.spyOn(Date, 'now').mockReturnValue(now + 60 * 60 * 1000 + 1)
  const expired = await invoke({ ...ask, traceId, action: 'export' })
  expect(expired.status).toBe(400)
  expect(backend).not.toHaveBeenCalled()
})

it('exports and reviews using only journal trace/run IDs even when source loading is unavailable', async () => {
  const { traceId } = (await invoke()).data
  const answer = await invoke({ ...ask, traceId })
  load.mockRejectedValue(new Error('Source is no longer available'))
  getLive.mockImplementation(() => {
    throw new Error('Cache expired')
  })
  const review = await invoke({
    action: 'review',
    traceId,
    runId: answer.data.activity.runId,
    target: { sourceSpanId: answer.data.evidence[0].sourceSpanId },
    decision: 'rejected',
    reviewer: 'Reviewer'
  })
  expect(review.status).toBe(200)
  const exported = await invoke({ action: 'export', traceId })
  expect(exported.status).toBe(200)
  expect(exported.data.exportBody.reviews[0].decision).toBe('rejected')
  expectNoCorpus(exported.data)
})

it('renders only journal events into interaction.log with no 60-character normalized source runs, review notes or secret URLs', async () => {
  const loaded = await invoke()
  const { traceId } = loaded.data
  const implementation = backend.getMockImplementation()
  backend.mockImplementation(async (action: string, ...args: unknown[]) => ({
    ...(await implementation(action, ...args)),
    observability: {
      stored_chunks: 8,
      embedding_model: data.pages[0].text,
      model_used: 'https://example.test/?token=SECRET_TOKEN',
      text: source,
      note: source,
      retrieval: [
        { chunk_id: data.spans[0].id, score: 1, rank: 1, text: source }
      ]
    }
  }))
  const answer = await invoke({ ...ask, traceId })
  expect(answer.status).toBe(200)
  const note =
    'PRIVATE REVIEW NOTE with a secret URL https://example.test/?token=SECRET_TOKEN'
  const review = await invoke({
    ...ask,
    action: 'review',
    traceId,
    runId: answer.data.activity.runId,
    target: { sourceSpanId: answer.data.evidence[0].sourceSpanId },
    decision: 'accepted',
    reviewer: 'PRIVATE REVIEWER',
    note
  })
  expect(review.status).toBe(200)
  const out = await invoke({
    ...ask,
    action: 'export',
    traceId,
    note,
    interactionLog: source
  })
  expect(out.status).toBe(200)
  const body = out.data.exportBody
  const log = body.interactionLog
  expect(typeof log).toBe('string')
  expect(log.split('\n')).toHaveLength(
    body.activityRecords.reduce(
      (sum: number, record: any) => sum + record.events.length,
      0
    )
  )
  expect(log).not.toMatch(
    /PRIVATE REVIEW NOTE|PRIVATE REVIEWER|SECRET_TOKEN|https?:\/\//
  )
  const normalize = (value: string) =>
    value.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim()
  const normalized = normalize(log)
  const windows = new Set(
    Array.from({ length: Math.max(0, normalized.length - 59) }, (_, i) =>
      normalized.slice(i, i + 60)
    )
  )
  for (const page of data.pages) {
    const source = normalize(page.text)
    for (let i = 0; i <= source.length - 60; i++)
      expect(windows.has(source.slice(i, i + 60))).toBe(false)
  }
  expectNoCorpus(out.data)
  expect(out.data.activity.events).toContainEqual(
    expect.objectContaining({ stage: 'export', pipelineStep: 'governance' })
  )
  expect(out.data.activity.outputSha256).toBe(
    sha256(JSON.stringify(body, null, 2))
  )
  // The current export stays outside its own snapshot; it appears on the next export.
  const next = await invoke({ ...ask, action: 'export', traceId })
  expect(next.data.exportBody.interactionLog).toContain(
    `[run ${out.data.activity.runId}] [governance] export succeeded`
  )
})
