/** @jest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import { useAccount, useSigner } from 'wagmi'
import C2DFlow from './C2DFlow'
import EuropeanaResearch from './index'
import ActivityPanel from './ActivityPanel'
import {
  ingestC2DJob,
  listC2DJobs,
  loadC2DContext,
  startC2DJob
} from '@utils/europeana/c2d-browser'
import type { ActivityRecord } from '@utils/europeana/activity'

jest.mock('wagmi', () => ({ useAccount: jest.fn(), useSigner: jest.fn() }))
jest.mock('@utils/europeana/c2d-browser', () => ({
  loadC2DContext: jest.fn(),
  listC2DJobs: jest.fn(),
  startC2DJob: jest.fn(),
  ingestC2DJob: jest.fn(),
  parsePages: () => ['p1'],
  c2dStage: () => 'Compute complete',
  hasC2DResults: (job) => Boolean(job.dateFinished)
}))
jest.mock('./SearchSources', () => ({
  __esModule: true,
  default: () => <p>Exploration search</p>
}))
jest.mock('./HistoricalEvidence', () => ({
  __esModule: true,
  default: () => null
}))
const finished = { jobId: 'job1', dateFinished: '123', results: [] }
const loadedResult = {
  publicDataset: {
    traceId: 'trace1',
    origin: 'c2d',
    version: 'v1',
    retrievedAt: '2026-10-07',
    expiresAt: '2026-10-08',
    pages: [
      { id: 'p1', page: 'page1', title: 'Archive', textCharacters: 1000 }
    ],
    spans: []
  },
  aggregates: {
    schemaVersion: 1,
    runId: 'run1',
    pages: [
      { recordId: '/123/Archive', page: 'page1', wordCount: 100, metadata: {} }
    ],
    topTerms: [{ term: 'harbour', count: 8 }]
  },
  activity: {
    runId: 'run1',
    traceId: 'trace1',
    sourceOrigin: 'c2d',
    events: []
  }
}
beforeEach(() => {
  jest.clearAllMocks()
  delete process.env.NEXT_PUBLIC_EUROPEANA_DATASET_DID
  delete process.env.NEXT_PUBLIC_EUROPEANA_ALGORITHM_DID
  delete process.env.NEXT_PUBLIC_EUROPEANA_EXPLORATION
  ;(useAccount as jest.Mock).mockReturnValue({ address: '0xowner' })
  ;(useSigner as jest.Mock).mockReturnValue({ data: {} })
  ;(loadC2DContext as jest.Mock).mockResolvedValue({
    dataset: { metadata: { license: 'CC0' } },
    algorithm: { metadata: { license: 'MIT' } }
  })
  ;(listC2DJobs as jest.Mock).mockResolvedValue([])
  ;(startC2DJob as jest.Mock).mockResolvedValue({ jobId: 'job1' })
  ;(ingestC2DJob as jest.Mock).mockResolvedValue(loadedResult)
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ connected: true })
  })) as unknown as typeof fetch
})
afterEach(cleanup)
function configured() {
  process.env.NEXT_PUBLIC_EUROPEANA_DATASET_DID = 'did:op:dataset'
  process.env.NEXT_PUBLIC_EUROPEANA_ALGORITHM_DID = 'did:op:algorithm'
}
it('shows a disabled explanatory state without DIDs and hides direct exploration by default', async () => {
  render(<EuropeanaResearch />)
  expect(screen.getByRole('button', { name: 'Run C2D job' })).toBeDisabled()
  expect(screen.getByText(/Portal operator must configure/)).toBeVisible()
  expect(screen.queryByText('Exploration search')).not.toBeInTheDocument()
  await screen.findByText('ClioX connected')
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/europeana/research?mode=status',
    expect.any(Object)
  )
  expect(loadC2DContext).not.toHaveBeenCalled()
})
it('automatically loads a newly finished job and passes page selections to compute', async () => {
  configured()
  const onLoaded = jest.fn()
  ;(listC2DJobs as jest.Mock).mockResolvedValue([finished])
  render(<C2DFlow onLoaded={onLoaded} />)
  await screen.findByText('Dataset licence: CC0 · Algorithm licence: MIT')
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Run C2D job' }))
  await waitFor(() => expect(onLoaded).toHaveBeenCalledWith(loadedResult))
  expect(startC2DJob).toHaveBeenCalledWith(
    expect.any(Object),
    expect.any(Object),
    ['p1'],
    3,
    expect.any(Function),
    expect.any(AbortSignal)
  )
  expect(ingestC2DJob).toHaveBeenCalledTimes(1)
})
it('re-ingests a previous finished job and renders distant reading in the Desk', async () => {
  configured()
  ;(listC2DJobs as jest.Mock).mockResolvedValue([finished])
  render(<EuropeanaResearch />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Load sealed results again' })
  )
  await screen.findByRole('region', { name: 'Distant reading' })
  expect(screen.getByText('harbour · 8')).toBeVisible()
  expect(screen.getByText('Page page1 · 100 words')).toBeVisible()
  expect(screen.getByText(/C2D corpus ready/)).toBeVisible()
})
it('groups sanitized provider logs under the trace by Access and Ingestion', () => {
  const records = [
    {
      traceId: 'trace1',
      runId: 'run1',
      action: 'load-source',
      sourceOrigin: 'c2d',
      startedAt: '2026-10-07',
      status: 'completed',
      request: {},
      sources: [],
      inputs: [],
      model: { state: 'not-called' },
      events: ['access', 'ingestion'].map((pipelineStep) => ({
        at: '2026-10-07',
        stage: `c2d-${pipelineStep}`,
        pipelineStep,
        outcome: 'succeeded',
        detail:
          pipelineStep === 'access'
            ? 'signature=[REDACTED]'
            : 'chunking complete',
        metadata: {
          providerLog: {
            filename:
              pipelineStep === 'access' ? 'configure.log' : 'algorithm.log',
            sha256: 'hash'
          }
        }
      }))
    }
  ] as ActivityRecord[]
  render(<ActivityPanel records={records} getExport={jest.fn()} />)
  expect(
    screen.getByRole('region', { name: 'Provider logs (Compute-to-Data)' })
  ).toBeVisible()
  expect(
    screen.getByRole('heading', { name: 'Access · configure / fetch' })
  ).toBeVisible()
  expect(
    screen.getByRole('heading', { name: 'Ingestion · algorithm stages' })
  ).toBeVisible()
})
