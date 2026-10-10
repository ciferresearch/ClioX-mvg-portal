/** @jest-environment node */
import handler from '../../pages/api/europeana/research'
import searchHandler from '../../pages/api/europeana/search'
import { backendRequest } from './backend'
import { loadResearchDataset } from './research-server'
import { fetchLiveCorpus } from './live-server'
import { searchNewspapers } from './search-server'
import { sha256 } from './activity-server'

jest.mock('./backend', () => ({
  backendRequest: jest.fn(),
  backendTransport: () => 'direct-service',
  uploadPayload: (id: string, chunks: unknown[]) => ({
    session_id: id,
    knowledge_chunks: chunks
  }),
  chatPayload: (id: string, message: string, maxTokens: number) => ({
    session_id: id,
    message,
    config: { temperature: 0.1, max_tokens: maxTokens }
  })
}))
jest.mock('./research-server', () => ({ loadResearchDataset: jest.fn() }))
jest.mock('./live-server', () => ({
  fetchLiveCorpus: jest.fn(),
  retainCorpus: (data: unknown) => data,
  getLiveCorpus: jest.fn()
}))
jest.mock('./search-server', () => ({
  searchNewspapers: jest.fn(),
  SearchError: class extends Error {
    status = 502
  }
}))
const text = 'Ostende and Dover are named in this report.'
const page = {
  id: 'p1',
  recordId: '/123/Test',
  page: 'p. 1',
  title: 'Newspaper',
  text,
  fulltextUrl: 'https://api.europeana.eu/fulltext/123/Test/p1',
  rights: 'http://creativecommons.org/publicdomain/mark/1.0/',
  retrievedAt: '2026-09-29T00:00:00Z'
}
const span = {
  id: 'p1#char=0,41',
  pageId: 'p1',
  pageLabel: 'p. 1',
  start: 0,
  end: text.length,
  text,
  kind: 'text-window'
}
const dataset = { version: 'v1', pages: [page], spans: [span] }
const backend = backendRequest as jest.Mock
const load = loadResearchDataset as jest.Mock
const live = fetchLiveCorpus as jest.Mock
const search = searchNewspapers as jest.Mock
async function invoke(
  body?: object,
  mode?: string,
  endpoint = handler,
  query?: object
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
  let json: any
  const res: any = {
    setHeader: jest.fn(),
    status: (code: number) => {
      status = code
      return res
    },
    json: (value: any) => {
      json = value
      return res
    }
  }
  await endpoint(
    {
      method: body ? 'POST' : 'GET',
      body,
      headers: {},
      query: query || { mode }
    } as any,
    res
  )
  return { status, data: json }
}
const ask = {
  action: 'ask',
  pageIds: ['p1'],
  corpusVersion: 'v1',
  question: 'Which ports Ostende?'
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(globalThis as any)[
    Symbol.for('cliox.europeana.output-budget.2026-10-07-v1')
  ]?.clear()
  load.mockResolvedValue(dataset)
  backend.mockImplementation(async (action) =>
    action === 'chat'
      ? {
          response: JSON.stringify({
            answer: 'Ostende and Dover.',
            insufficientEvidence: false,
            evidenceIds: ['e1']
          }),
          metadata: { model_used: 'fixture-model' }
        }
      : { success: true }
  )
})
it('records real selected inputs, service-reported model and requested settings without claiming C2D or erasure', async () => {
  const { data, status } = await invoke(ask)
  expect(status).toBe(200)
  expect(data.activity.status).toBe('completed')
  expect(data.activity.inputs[0]).toMatchObject({
    id: span.id,
    textSha256: sha256(text)
  })
  expect(data.activity.configuration.requested).toEqual({
    temperature: 0.1,
    max_tokens: 1200
  })
  expect(data.activity.configuration.effective).toBe('not-reported')
  expect(data.activity.model).toEqual({
    state: 'reported',
    nameSha256: sha256('fixture-model')
  })
  expect(data.activity.cleanup).toBe('acknowledged')
  expect(data.activity.infrastructure).toMatchObject({
    providerJob: 'not-connected',
    deletionVerified: false,
    resourceLifecycle: 'not-observed'
  })
  expect(JSON.stringify(data.activity)).not.toContain(text)
  expect(JSON.stringify(data.activity)).not.toContain(ask.question)
  expect(backend.mock.calls.map((call) => call[0])).toEqual([
    'upload',
    'chat',
    'clear'
  ])
  const chat = backend.mock.calls.find((call) => call[0] === 'chat')[2]
  expect(data.activity.configuration.promptSha256).toBe(sha256(chat.message))
  expect(chat.message).toContain(text)
})
it('does not manufacture a model run or a deleted session when retrieval finds no evidence', async () => {
  const { data } = await invoke({ ...ask, question: 'zzzzxxxxxqqq' })
  expect(data.activity.model.state).toBe('not-called')
  expect(data.activity.cleanup).toBe('not-needed')
  expect(data.activity.inputs).toEqual([])
  expect(backend).not.toHaveBeenCalled()
})
it('preserves the failure and cleanup outcome when model evidence validation fails', async () => {
  backend.mockImplementation(async (action) =>
    action === 'chat'
      ? {
          response: JSON.stringify({
            answer: 'Unsupported.',
            insufficientEvidence: false,
            evidenceIds: ['invented']
          })
        }
      : { success: true }
  )
  const { data, status } = await invoke(ask)
  expect(status).toBe(502)
  expect(data.activity.status).toBe('failed')
  expect(data.activity.cleanup).toBe('acknowledged')
  expect(
    data.activity.events.some((e: any) => e.stage === 'model-response')
  ).toBe(true)
  expect(data.answer).toBeUndefined()
})
it('keeps a successful answer but makes failed deletion explicit', async () => {
  const implementation = backend.getMockImplementation()
  backend.mockImplementation((action) =>
    action === 'clear'
      ? Promise.reject(new Error('HTTP 503'))
      : implementation(action)
  )
  const { data, status } = await invoke(ask)
  expect(status).toBe(200)
  expect(data.sessionCleared).toBe(false)
  expect(data.activity.cleanup).toBe('failed')
  expect(data.activity.infrastructure.deletionVerified).toBe(false)
})
it('attempts cleanup after upload failure, retains that failure and never calls the model', async () => {
  backend.mockImplementation((action) =>
    action === 'upload'
      ? Promise.reject(new Error('sensitive upstream text'))
      : Promise.resolve({ success: true })
  )
  const { data, status } = await invoke(ask)
  expect(status).toBe(502)
  expect(backend.mock.calls.map((call) => call[0])).toEqual(['upload', 'clear'])
  expect(data.activity.model.state).toBe('not-called')
  expect(data.activity.cleanup).toBe('acknowledged')
  expect(JSON.stringify(data)).not.toContain('sensitive upstream text')
})
it('distinguishes recorded examples and saved sources from live acquisition', async () => {
  const source = await invoke()
  expect(source.data.activity.sourceOrigin).toBe('snapshot')
  expect(source.data.pages[0]).not.toHaveProperty('text')
  expect(source.data.spans[0]).not.toHaveProperty('text')
  expect(source.data.activity.sources[0].source).toBe(
    'https://www.europeana.eu/item/123/Test'
  )
  expect(source.data.activity.events[0].stage).toBe('saved-source')
  load.mockResolvedValue(
    await jest.requireActual('./research-server').loadResearchDataset()
  )
  const replay = await invoke(undefined, 'replay')
  expect(replay.status).toBe(200)
  expect(replay.data.activity.action).toBe('replay')
  expect(replay.data.activity.model.state).toBe('not-called')
  expect(backend).not.toHaveBeenCalled()
})
it('returns a failed source-fetch record without substituting a snapshot', async () => {
  live.mockRejectedValue(new Error('Europeana returned HTTP 503.'))
  const { data, status } = await invoke({
    action: 'import',
    record: '/123/Test',
    maxPages: 1
  })
  expect(status).toBe(502)
  expect(data.activity.action).toBe('load-source')
  expect(data.activity.status).toBe('failed')
  expect(load).not.toHaveBeenCalled()
})
it('records classification independently with the right token budget', async () => {
  backend.mockImplementation(async (action) =>
    action === 'chat'
      ? {
          response: JSON.stringify([
            {
              spanId: 'e1',
              label: 'neutral',
              explanation: 'A report.',
              toneTarget: 'ports'
            }
          ])
        }
      : { success: true }
  )
  const { data } = await invoke({
    ...ask,
    action: 'analyze',
    spanIds: [span.id]
  })
  expect(data.labels[0].spanId).toBe(span.id)
  expect(data.activity.action).toBe('analyze')
  expect(data.activity.configuration.requested.max_tokens).toBe(2400)
  expect(data.activity.model.state).toBe('not-reported')
})
it('records search metadata without logging the query or any credentials', async () => {
  search.mockResolvedValue({ items: [{ id: '/123/Test' }], total: 1 })
  const { data } = await invoke(undefined, undefined, searchHandler, {
    q: 'private query',
    page: '1'
  })
  expect(data.activity.action).toBe('search')
  expect(data.activity.request.querySha256).toBe(sha256('private query'))
  expect(data.activity.model.state).toBe('not-called')
  expect(JSON.stringify(data.activity)).not.toContain('private query')
})

it('records text-free chunking on both saved-sample and live source loads', async () => {
  live.mockResolvedValue({ ...dataset, origin: 'live' })
  for (const result of [
    await invoke(),
    await invoke({ action: 'import', record: '/123/Test', maxPages: 1 })
  ]) {
    expect(result.status).toBe(200)
    const event = result.data.activity.events.find(
      (event: any) => event.stage === 'chunking'
    )
    expect(event).toMatchObject({
      pipelineStep: 'ingestion',
      outcome: 'succeeded',
      metadata: {
        chunking: {
          chunkers: [{ id: 'text-window', version: 'v1' }],
          spanCounts: { 'layout-block': 0, 'text-window': 1 },
          totalCharacters: text.length,
          spanTableSha256: sha256(
            JSON.stringify([{ id: span.id, start: span.start, end: span.end }])
          )
        }
      }
    })
    expect(JSON.stringify(event)).not.toContain(text)
    expect(
      result.data.activity.events.every((event: any) => event.pipelineStep)
    ).toBe(true)
  }
})

it('records actual ranked inputs, upload acknowledgement and sanitized optional backend reports', async () => {
  const implementation = backend.getMockImplementation()
  backend.mockImplementation(async (action) => ({
    ...(await implementation(action)),
    observability:
      action === 'upload'
        ? {
            stored_chunks: 1,
            embedding_model: 'embed-v1',
            index_sha256: 'a'.repeat(64),
            text
          }
        : {
            model_used: 'chat-v1',
            retrieval: [{ chunk_id: span.id, score: 0.9, rank: 1, text }],
            prompt: text
          }
  }))
  const { data, status } = await invoke(ask)
  expect(status).toBe(200)
  const rank = data.activity.events.find(
    (event: any) => event.stage === 'ranking'
  )
  expect(rank).toMatchObject({
    pipelineStep: 'ranking',
    metadata: {
      ranking: {
        method: 'lexical-substring-idf',
        version: 'v1',
        candidateLimit: 8,
        candidates: [{ id: span.id, rank: 1, score: Math.log(1.5) }]
      }
    }
  })
  const upload = data.activity.events.find(
    (event: any) =>
      event.stage === 'knowledge-upload' && event.outcome === 'succeeded'
  )
  expect(upload.metadata).toEqual({
    indexing: {
      uploadAcknowledged: true,
      chunkCount: 1,
      payloadSha256: data.activity.configuration.uploadPayloadSha256,
      embeddingModel: 'not-observed',
      vectorStore: 'not-observed',
      indexInternals: 'not-observed'
    },
    observability: {
      stored_chunks: 1,
      embedding_model: 'embed-v1',
      index_sha256: 'a'.repeat(64)
    }
  })
  const response = data.activity.events.find(
    (event: any) => event.stage === 'model-response'
  )
  expect(response.metadata.observability).toEqual({
    model_used: 'chat-v1',
    retrieval: [{ chunk_id: span.id, score: 0.9, rank: 1 }]
  })
  expect(JSON.stringify([rank, upload, response])).not.toContain(text)
})

it('preserves explicit user order for analyze without inventing scores', async () => {
  const second = {
    ...span,
    id: 'p1#char=8,20',
    start: 8,
    end: 20,
    text: text.slice(8, 20)
  }
  load.mockResolvedValue({ ...dataset, spans: [span, second] })
  backend.mockImplementation(async (action) =>
    action === 'chat'
      ? {
          response: JSON.stringify([
            { spanId: 'e1', label: 'neutral' },
            { spanId: 'e2', label: 'neutral' }
          ])
        }
      : { success: true }
  )
  const { data, status } = await invoke({
    ...ask,
    action: 'analyze',
    spanIds: [second.id, span.id]
  })
  expect(status).toBe(200)
  const ranking = data.activity.events.find(
    (event: any) => event.stage === 'ranking'
  )
  expect(ranking.metadata.ranking).toEqual({
    method: 'explicit-user-selection',
    version: 'v1',
    candidateLimit: 8,
    candidates: [
      { id: second.id, rank: 1 },
      { id: span.id, rank: 2 }
    ]
  })
  expect(data.activity.inputs.map((input: any) => input.id)).toEqual([
    second.id,
    span.id
  ])
  expect(
    backend.mock.calls
      .find((call) => call[0] === 'upload')[2]
      .knowledge_chunks.map((chunk: any) => chunk.id)
  ).toEqual([second.id, span.id])
  expect(JSON.stringify(ranking)).not.toContain(text)
})

it('records an empty ranking when ask has no candidates', async () => {
  const { data } = await invoke({ ...ask, question: 'zzzzxxxxxqqq' })
  expect(
    data.activity.events.find((event: any) => event.stage === 'ranking')
      .metadata.ranking.candidates
  ).toEqual([])
  expect(backend).not.toHaveBeenCalled()
})
