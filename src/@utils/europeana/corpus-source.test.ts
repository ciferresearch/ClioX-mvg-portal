/** @jest-environment node */
import { loadCorpusSource } from './corpus-source-server'
import { publicDataset } from './output-policy'
import { retainCorpus, getLiveCorpus } from './live-server'
import type { ResearchDataset } from './research'
import type { CorpusProvenance } from './corpus-source'
import {
  backendRequest,
  backendTransport,
  chatPayload,
  uploadPayload
} from './backend'

beforeEach(() => {
  jest
    .spyOn(global, 'fetch')
    .mockRejectedValue(new Error('Unexpected network request'))
})
afterEach(() => jest.restoreAllMocks())

it('loads the ten-page saved corpus offline and releases metadata without OCR or reserved provenance', async () => {
  const corpus = await loadCorpusSource({ origin: 'snapshot' })
  expect(corpus.origin).toBe('snapshot')
  expect(corpus.pages).toHaveLength(10)
  expect(corpus.spans.length).toBeGreaterThan(0)
  const metadata = publicDataset({
    ...corpus,
    provenance: { providerUrl: 'https://private.test/?secret=value' }
  })
  expect(metadata.origin).toBe('snapshot')
  expect(
    metadata.pages.every((page) => /^[a-f0-9]{64}$/.test(page.textSha256))
  ).toBe(true)
  expect(metadata.pages.every((page) => !('text' in page))).toBe(true)
  expect(metadata.spans.every((span) => !('text' in span))).toBe(true)
  expect(metadata).not.toHaveProperty('provenance')
  expect(fetch).not.toHaveBeenCalled()
})

it('dispatches a live request to the server-owned adapter with its bounded page selection', async () => {
  const dataset: ResearchDataset = {
    version: 'v1',
    retrievedAt: '2026-10-07',
    pages: [],
    spans: []
  }
  const live = jest.fn().mockResolvedValue(dataset)
  const request = { origin: 'live' as const, record: '/123/Test', maxPages: 3 }
  expect(await loadCorpusSource(request, { live })).toEqual({
    ...dataset,
    origin: 'live'
  })
  expect(live).toHaveBeenCalledWith(request)
  expect(fetch).not.toHaveBeenCalled()
})

it('reserves C2D provenance without implementing a default C2D loader', async () => {
  const provenance: CorpusProvenance = {
    jobId: 'job-id',
    datasetDid: 'did:op:dataset',
    algorithmDid: 'did:op:algorithm',
    providerUrl: 'https://provider.test',
    sealedSha256: 'a'.repeat(64),
    configureLogSha256: 'b'.repeat(64),
    algorithmLogSha256: 'c'.repeat(64)
  }
  await expect(loadCorpusSource({ origin: 'c2d', provenance })).rejects.toThrow(
    'C2D ingestion route'
  )
  expect(fetch).not.toHaveBeenCalled()
})

it('preserves a server adapter provenance and origin through corpus retention', async () => {
  const dataset: ResearchDataset = {
    origin: 'c2d',
    version: 'v1',
    retrievedAt: '2026-10-07',
    pages: [],
    spans: [],
    provenance: { jobId: 'fixture-job', sealedSha256: 'a'.repeat(64) }
  }
  const result = await loadCorpusSource(
    { origin: 'c2d', provenance: dataset.provenance },
    { c2d: async () => dataset }
  )
  const retained = retainCorpus(result)
  expect(getLiveCorpus(retained.corpusId)).toMatchObject(dataset)
  expect(fetch).not.toHaveBeenCalled()
})

it('fails closed when an adapter is unavailable instead of substituting saved data', async () => {
  await expect(
    loadCorpusSource({ origin: 'live', record: '/123/Test' }, {})
  ).rejects.toThrow('unavailable')
  await expect(loadCorpusSource({ origin: 'snapshot' }, {})).rejects.toThrow(
    'unavailable'
  )
  expect(fetch).not.toHaveBeenCalled()
})

it('uses the existing direct service protocol and only the API-supplied backend URL', async () => {
  jest.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))
  const upload = uploadPayload('session-id', [{ id: 'chunk-1' }])
  await backendRequest('upload', 'session-id', upload, 'https://service.test/')
  expect(fetch).toHaveBeenCalledWith(
    'https://service.test/api/v1/session/knowledge/upload',
    expect.objectContaining({
      method: 'POST',
      redirect: 'error',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': 'session-id'
      },
      body: JSON.stringify({
        session_id: 'session-id',
        knowledge_chunks: [{ id: 'chunk-1' }],
        domains: ['europeana-newspapers']
      })
    })
  )
  expect(chatPayload('session-id', 'question', 1200)).toEqual({
    session_id: 'session-id',
    message: 'question',
    config: { temperature: 0.1, max_tokens: 1200 }
  })
  expect(backendTransport('https://service.test')).toBe('direct-service')
})

it('uses the Portal proxy field names when only the proxy is configured', async () => {
  process.env.EUROPEANA_CHATBOT_PORTAL_URL = 'https://portal.test/'
  try {
    jest.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))
    const upload = uploadPayload('session-id', [{ id: 'chunk-1' }])
    expect(upload).toEqual({
      sessionId: 'session-id',
      knowledgeChunks: [{ id: 'chunk-1' }],
      domains: ['europeana-newspapers']
    })
    await backendRequest('upload', 'session-id', upload)
    expect(fetch).toHaveBeenCalledWith(
      'https://portal.test/api/chatbot/upload',
      expect.objectContaining({ method: 'POST' })
    )
    expect(chatPayload('session-id', 'question', 1200)).toEqual({
      sessionId: 'session-id',
      message: 'question',
      config: { temperature: 0.1, max_tokens: 1200 }
    })
    expect(
      uploadPayload('session-id', [], 'https://service.test')
    ).toHaveProperty('session_id', 'session-id')
  } finally {
    delete process.env.EUROPEANA_CHATBOT_PORTAL_URL
  }
})

it('reports an unconfigured backend without attempting a network call', async () => {
  expect(backendTransport()).toBe('unconfigured')
  await expect(backendRequest('health')).rejects.toThrow(
    'Configure CHATBOT_API_URL'
  )
  expect(fetch).not.toHaveBeenCalled()
})
