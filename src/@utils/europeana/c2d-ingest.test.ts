/** @jest-environment node */
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '../../pages/api/europeana/c2d-ingest'
import research from '../../pages/api/europeana/research'
import { fixture, hash } from '../../../.jest/fixtures/europeana-c2d'
import { backendRequest } from './backend'
import { recordedTrace, exportRecordedTrace } from './activity-journal'
import type { C2DIngestResult } from './c2d-types'
import type { ReleasedResult } from './output-policy'
import { getLiveCorpus } from './live-server'
import { redactProviderLog } from './c2d-server'
import algorithmAggregates from '../../../.jest/fixtures/europeana-algorithm-aggregates.json'

jest.mock('./backend', () => ({
  backendRequest: jest.fn(),
  backendTransport: () => 'direct-service',
  uploadPayload: (id: string, chunks: unknown[]) => ({
    session_id: id,
    knowledge_chunks: chunks
  }),
  chatPayload: (id: string, message: string) => ({ session_id: id, message })
}))
const backend = backendRequest as jest.Mock
let f: ReturnType<typeof fixture>
beforeEach(() => {
  f = fixture()
  process.env.EUROPEANA_INGEST_PRIVATE_KEY_B64 = f.privateB64
  delete process.env.NEXT_PUBLIC_EUROPEANA_DATASET_DID
  delete process.env.NEXT_PUBLIC_EUROPEANA_ALGORITHM_DID
  backend.mockReset().mockResolvedValue({})
})
afterEach(() => {
  delete process.env.EUROPEANA_INGEST_PRIVATE_KEY_B64
})
async function invoke(
  route: typeof handler,
  body: unknown,
  options: Partial<NextApiRequest> = {}
) {
  let status = 200
  type TestResponse = C2DIngestResult &
    ReleasedResult & { exportBody: ReturnType<typeof exportRecordedTrace> }
  let data: TestResponse
  const headers = {}
  const res = {
    setHeader: (key: string, value: string) => {
      headers[key] = value
    },
    status: (code: number) => {
      status = code
      return res
    },
    json: (value: unknown) => {
      data = value as TestResponse
      return res
    }
  }
  await route(
    {
      method: 'POST',
      headers: {
        host: 'portal.example',
        origin: 'https://portal.example',
        'content-type': 'application/json'
      },
      body,
      query: {},
      ...options
    } as NextApiRequest,
    res as unknown as NextApiResponse
  )
  return { status, data, headers }
}
function noPlaintext(value: unknown) {
  const serialized = JSON.stringify(value)
  expect(serialized).not.toContain(f.text)
  expect(serialized).not.toContain(f.text.slice(0, 180))
  expect(serialized).not.toContain('secretSig')
  expect(serialized).not.toContain('secretNonce')
  expect(serialized).not.toContain('secretBearer')
}
it('returns only metadata, allowlisted aggregates and redacted C2D trace; retains plaintext server-side', async () => {
  const response = await invoke(handler, {
    ...f.body,
    sealed: JSON.stringify(f.envelope),
    summary: JSON.stringify(f.body.summary),
    aggregates: {
      ...f.body.aggregates,
      chunks: [f.text],
      nested: { text: f.text }
    },
    configureLog: f.body.configureLog + '\n' + f.text
  })
  expect(response.status).toBe(200)
  expect(response.headers['Cache-Control']).toBe('no-store')
  noPlaintext(response.data)
  expect(response.data.publicDataset.origin).toBe('c2d')
  expect(response.data.aggregates).toEqual(f.body.aggregates)
  const corpus = getLiveCorpus(response.data.publicDataset.corpusId)
  expect(corpus.spans[0].text).toBe(f.text)
  expect(corpus.provenance.jobId).toBe(f.body.jobId)
  const trace = recordedTrace(response.data.traceId)
  noPlaintext(trace)
  const events = trace[0].record.events.filter(
    (event) => event.metadata?.providerLog
  )
  expect(events.some((e) => e.pipelineStep === 'access')).toBe(true)
  expect(events.some((e) => e.pipelineStep === 'ingestion')).toBe(true)
  expect(
    events.every((e) => e.metadata.providerLog.lineSha256 === hash(e.detail))
  ).toBe(true)
})
it('redacts query parameters, encoded separators, JSON credentials and bearer tokens', () => {
  const result = redactProviderLog(
    'url?signature=abc&nonce=xyz&x=ok Bearer token123 "nonce":"jsonSecret" signature%3Dencoded https://user:password@example.test'
  )
  for (const secret of [
    'abc',
    'xyz',
    'token123',
    'jsonSecret',
    'encoded',
    'password'
  ])
    expect(result).not.toContain(secret)
  expect(result).toContain('x=ok')
})
it.each([
  'cross-origin',
  'bad-origin',
  'cross-site',
  'form',
  'method',
  'oversize',
  'no-key'
])('rejects %s requests', async (mode) => {
  const options: Partial<NextApiRequest> = {}
  if (mode === 'cross-origin')
    options.headers = {
      origin: 'https://attacker.test',
      host: 'portal.example'
    }
  if (mode === 'bad-origin')
    options.headers = { origin: 'bad url', host: 'portal.example' }
  if (mode === 'cross-site')
    options.headers = { 'sec-fetch-site': 'cross-site' }
  if (mode === 'form') options.headers = { 'content-type': 'text/plain' }
  if (mode === 'method') options.method = 'GET'
  if (mode === 'no-key') delete process.env.EUROPEANA_INGEST_PRIVATE_KEY_B64
  const response = await invoke(
    handler,
    mode === 'oversize' ? { text: 'x'.repeat(4 * 1024 * 1024) } : f.body,
    options
  )
  expect(response.status).toBeGreaterThanOrEqual(400)
  noPlaintext(response.data)
})
it.each([
  'plaintext-log',
  'count',
  'term',
  'page',
  'summary',
  'pair',
  'url',
  'seal'
])('bounds and validates %s without reflecting input', async (mode) => {
  const body = JSON.parse(JSON.stringify(f.body))
  if (mode === 'plaintext-log') body.algorithmLog = f.text.repeat(20)
  if (mode === 'count') body.aggregates.topTerms[0].count = 100000
  if (mode === 'term') body.aggregates.topTerms[0].term = f.text
  if (mode === 'page') body.aggregates.pages[0].page = 'unknown'
  if (mode === 'summary') body.summary.runId = 'wrong'
  if (mode === 'pair')
    process.env.NEXT_PUBLIC_EUROPEANA_DATASET_DID = 'did:op:other'
  if (mode === 'url')
    body.providerUrl = 'https://provider.example?signature=secretSig'
  if (mode === 'seal') body.sealed.nonce = 'AAAA'
  const response = await invoke(handler, body)
  expect(response.status).toBe(400)
  noPlaintext(response.data)
})
it('supports ask, analyze, locate, review and export on a real decrypted C2D corpus with mocked inference', async () => {
  const ingested = await invoke(handler, f.body)
  expect(ingested.status).toBe(200)
  const d = ingested.data.publicDataset
  const context = {
    corpusId: d.corpusId,
    corpusVersion: d.version,
    traceId: d.traceId,
    pageIds: d.pages.map((p) => p.id)
  }
  backend.mockImplementation(
    async (
      operation: string,
      _session: string,
      payload: { message?: string }
    ) =>
      operation === 'chat'
        ? {
            response: JSON.stringify(
              payload.message.startsWith('Label')
                ? [
                    {
                      spanId: 'e1',
                      label: 'neutral',
                      toneTarget: 'news report',
                      explanation: 'Descriptive account.'
                    }
                  ]
                : {
                    answer: 'The report describes maritime activity.',
                    insufficientEvidence: false,
                    evidenceIds: ['e1']
                  }
            )
          }
        : {}
  )
  const ask = await invoke(research, {
    ...context,
    action: 'ask',
    question: 'What happens at Ostende?'
  })
  expect(ask.status).toBe(200)
  expect(ask.data.evidence[0].text.length).toBeLessThanOrEqual(320)
  const analyze = await invoke(research, {
    ...context,
    action: 'analyze',
    spanIds: [d.spans[0].id]
  })
  expect(analyze.status).toBe(200)
  expect(analyze.data.labels[0].label).toBe('neutral')
  const locate = await invoke(research, {
    ...context,
    action: 'locate',
    query: 'Ostende'
  })
  expect(locate.status).toBe(200)
  noPlaintext(locate.data)
  const review = await invoke(research, {
    ...context,
    action: 'review',
    runId: analyze.data.activity.runId,
    target: { spanId: d.spans[0].id },
    decision: 'accepted',
    reviewer: 'Test reviewer'
  })
  expect(review.status).toBe(200)
  const exported = await invoke(research, { ...context, action: 'export' })
  expect(exported.status).toBe(200)
  expect(exported.data.exportBody.executionMode).toBe('c2d')
  expect(exported.data.exportBody.reviews).toHaveLength(1)
  expect(exported.data.exportBody.aggregates).toEqual(f.body.aggregates)
  expect(JSON.stringify(exported.data)).not.toContain(f.text)
  expect(
    backend.mock.calls.filter(([operation]) => operation === 'clear')
  ).toHaveLength(2)
})

it('accepts the real Python aggregates schema and releases only the public allowlist', async () => {
  const response = await invoke(handler, {
    ...f.body,
    aggregates: algorithmAggregates
  })
  expect(response.status).toBe(200)
  const { aggregates } = response.data
  expect(Object.keys(aggregates).sort()).toEqual([
    'pages',
    'runId',
    'schemaVersion',
    'topTerms'
  ])
  expect(aggregates.runId).toBe(f.runId)
  expect(aggregates.pages[0].metadata.title).toBe('Archive')
  expect(aggregates.topTerms).toEqual(algorithmAggregates.topTerms)
  noPlaintext(response.data)
})

it('withholds copied metadata and short complete chunks echoed in provider logs', async () => {
  const short = 'Private miniature source sentence.'
  const chunk = {
    ...f.chunk,
    text: short,
    charCount: short.length,
    wordCount: 4,
    sha256: hash(short)
  }
  const envelope = f.seal({ ...f.plaintext, chunks: [chunk] })
  const response = await invoke(handler, {
    ...f.body,
    sealed: envelope,
    summary: { ...f.body.summary, plaintextSha256: envelope.plaintextSha256 },
    aggregates: {
      ...f.body.aggregates,
      pages: [
        {
          ...f.body.aggregates.pages[0],
          wordCount: 4,
          metadata: { title: short, extra: short }
        }
      ],
      topTerms: []
    },
    configureLog: 'configuration ' + short,
    algorithmLog: short
  })
  expect(response.status).toBe(200)
  expect(JSON.stringify(response.data)).not.toContain(short)
  expect(JSON.stringify(recordedTrace(response.data.traceId))).not.toContain(
    short
  )
})
