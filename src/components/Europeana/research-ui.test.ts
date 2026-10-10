/** @jest-environment jsdom */
import React from 'react'
import '@testing-library/jest-dom'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  cleanup
} from '@testing-library/react'
import EuropeanaResearch from './index'
import { downloadJson } from './download'

jest.mock('@utils/europeana/c2d-browser', () => ({}))
jest.mock('next/head', () => ({ __esModule: true, default: () => null }))
jest.mock('./SearchSources', () => ({ __esModule: true, default: () => null }))
jest.mock('./download', () => ({ downloadJson: jest.fn() }))
const spans = [
  {
    id: 'p1#char=0,700',
    pageId: 'p1',
    pageLabel: 'p. 1',
    start: 0,
    end: 700,
    textCharacters: 700,
    kind: 'text-window'
  },
  {
    id: 'p1#char=800,1500',
    pageId: 'p1',
    pageLabel: 'p. 1',
    start: 800,
    end: 1500,
    textCharacters: 700,
    kind: 'text-window'
  }
]
const traceId = '11111111-1111-4111-8111-111111111111'
const askRunId = '22222222-2222-4222-8222-222222222222'
const reviewRunId = '33333333-3333-4333-8333-333333333333'
const metadata = {
  traceId,
  version: 'v1',
  origin: 'snapshot',
  retrievedAt: '2026-10-07',
  pages: [
    {
      id: 'p1',
      page: 'p. 1',
      title: 'Archive',
      date: '1918',
      language: 'de',
      source: 'https://www.europeana.eu/item/123/Test',
      textCharacters: 2000,
      textSha256: 'abc123',
      attribution: 'Library',
      rights: 'Public domain'
    }
  ],
  spans,
  outputPolicy: { id: 'draft-policy', originalTextInBrowser: false }
}
const released = {
  activity: {
    traceId,
    runId: askRunId,
    action: 'ask',
    startedAt: '2026-10-07',
    request: {},
    model: { state: 'not-called' },
    events: []
  },
  answer: 'A bounded answer.',
  evidence: [
    {
      ...spans[1],
      id: 'p1#char=800,1120',
      end: 1120,
      text: 'Released quote only.',
      textCharacters: 20,
      sourceSpanId: spans[1].id,
      truncated: true
    }
  ],
  insufficientEvidence: false,
  candidateCount: 2,
  generatedAt: '2026-10-07',
  model: 'Configured ClioX service',
  outputPolicy: { id: 'draft-policy' },
  sessionCleared: true
}
const serverExport = {
  traceId,
  dataset: metadata,
  releasedResults: [{ runId: askRunId, result: released }],
  activityRecords: [],
  reviews: [],
  serverOnlyMarker: 'journal snapshot'
}
const fetchMock = jest.fn()
beforeEach(() => {
  process.env.NEXT_PUBLIC_EUROPEANA_EXPLORATION = 'true'
  jest.clearAllMocks()
  global.fetch = fetchMock
  fetchMock.mockImplementation(async (url, options) => {
    const body = options.body ? JSON.parse(options.body) : undefined
    const data = url.includes('status')
      ? { connected: true }
      : body?.action === 'locate'
      ? { matches: [spans[1]], matchCount: 1, truncated: false }
      : body?.action === 'export'
      ? { exportBody: serverExport }
      : body?.action === 'review'
      ? { runId: reviewRunId }
      : body?.action === 'analyze'
      ? {
          activity: { ...released.activity, action: 'analyze' },
          labels: [
            {
              spanId: spans[0].id,
              label: 'neutral',
              explanation: 'Model reason',
              toneTarget: 'ports',
              humanReviewed: false
            }
          ],
          generatedAt: '2026-10-07',
          sessionCleared: true
        }
      : body?.action === 'ask'
      ? released
      : metadata
    return { ok: true, json: async () => data }
  })
})
afterEach(cleanup)

it('labels opt-in exploration and shows C2D configuration only in step 01', async () => {
  render(React.createElement(EuropeanaResearch))
  await screen.findByText('2,000 OCR characters')
  expect(screen.getByText('Exploration and Compute-to-Data')).toBeVisible()
  expect(screen.getByText('SAVED SAMPLE — not freshly fetched')).toBeVisible()
  const placeholder = screen.getByRole('heading', {
    name: 'Compute-to-Data (Europeana)'
  })
  expect(placeholder).toBeVisible()
  expect(screen.getByRole('button', { name: 'Run C2D job' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: /02 Read the evidence/ }))
  expect(placeholder).not.toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: /01 Select a corpus/ }))
  expect(placeholder).toBeVisible()
})

it('uses server locate results to select units using text-free metadata', async () => {
  render(React.createElement(EuropeanaResearch))
  await screen.findByText('2,000 OCR characters')
  fireEvent.click(screen.getByRole('button', { name: /02 Read the evidence/ }))
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Open Europeana item ↗' })
  ).toHaveAttribute('href', metadata.pages[0].source)
  fireEvent.change(
    screen.getByLabelText('Locate text on this page (server search)'),
    { target: { value: 'Ostende' } }
  )
  fireEvent.click(screen.getByRole('button', { name: 'Locate matching units' }))
  await screen.findByText(/1 matching units/)
  const units = within(
    screen.getByRole('complementary', { name: 'Evidence units' })
  ).getAllByRole('button')
  expect(units).toHaveLength(1)
  expect(units[0]).toHaveTextContent('800–1500')
  expect(
    fetchMock.mock.calls.some(
      ([, options]) =>
        options.body &&
        JSON.parse(options.body).action === 'locate' &&
        JSON.parse(options.body).query === 'Ostende'
    )
  ).toBe(true)
  fireEvent.click(units[0])
  fireEvent.click(
    screen.getByRole('button', { name: 'Add this unit to analysis' })
  )
  expect(
    screen.getByRole('button', { name: /Analysis basket · 2\/8/ })
  ).toBeInTheDocument()
})
it('renders released quotes, navigates via sourceSpanId and exports the exact server object asynchronously', async () => {
  render(React.createElement(EuropeanaResearch))
  await screen.findByText('2,000 OCR characters')
  fireEvent.click(screen.getByRole('button', { name: /03 Ask a question/ }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Ask the live ClioX service' })
  )
  await screen.findByText('Released quote only.')
  expect(screen.getByText(/Released quote \(truncated\)/)).toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Inspect source metadata →' })
  )
  expect(screen.getByText(/Characters 800–1500/)).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Add this unit to analysis' })
  ).toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Export evidence + activity' })
  )
  await waitFor(() => expect(downloadJson).toHaveBeenCalledTimes(1))
  const output = (downloadJson as jest.Mock).mock.calls[0][1]
  expect(output).toEqual(serverExport)
  expect(output.releasedResults[0].result.evidence[0].text).toBe(
    'Released quote only.'
  )
  expect(output.dataset.pages[0].textCharacters).toBe(2000)
  expect(output.dataset.pages[0].textSha256).toBe('abc123')
  for (const item of [...output.dataset.pages, ...output.dataset.spans]) {
    expect(item).not.toHaveProperty('text')
    expect(item).not.toHaveProperty('fulltextUrl')
    expect(item).not.toHaveProperty('imageUrl')
  }
  expect(output.activityRecords).toEqual([])
  expect(
    screen.getByLabelText('Export preview: europeana-research-session.json')
  ).toHaveValue(JSON.stringify(output, null, 2))
})
it('submits evidence review to the server and shows the review run ID', async () => {
  render(React.createElement(EuropeanaResearch))
  await screen.findByText('2,000 OCR characters')
  fireEvent.click(screen.getByRole('button', { name: /03 Ask a question/ }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Ask the live ClioX service' })
  )
  await screen.findByText('Released quote only.')
  fireEvent.change(
    screen.getByLabelText('Reviewer name (self-reported; hash retained)'),
    { target: { value: 'A reviewer' } }
  )
  fireEvent.change(
    screen.getByLabelText(
      'Evidence review note (only hash and length retained)'
    ),
    { target: { value: 'Private review note' } }
  )
  fireEvent.click(screen.getByRole('button', { name: 'Accept evidence' }))
  await screen.findByText(`Review run ID: ${reviewRunId}`)
  const request = fetchMock.mock.calls
    .map(([, options]) => options.body && JSON.parse(options.body))
    .find((body) => body?.action === 'review')
  expect(request).toMatchObject({
    traceId,
    runId: askRunId,
    target: { sourceSpanId: spans[1].id },
    decision: 'accepted',
    reviewer: 'A reviewer',
    note: 'Private review note'
  })
})
it('submits label corrections and the existing review checkbox as journal actions', async () => {
  render(React.createElement(EuropeanaResearch))
  await screen.findByText('2,000 OCR characters')
  fireEvent.click(screen.getByRole('button', { name: /04 Review patterns/ }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Analyze selected units' })
  )
  await screen.findByText('Model explanation: Model reason')
  fireEvent.change(
    screen.getByLabelText('Reviewer name (self-reported; only hash exported)'),
    { target: { value: 'Reviewer' } }
  )
  fireEvent.change(screen.getByLabelText('Expressed tone'), {
    target: { value: 'mixed' }
  })
  await screen.findByText(`Review run ID: ${reviewRunId}`)
  expect(screen.getByLabelText('Expressed tone')).toHaveValue('mixed')
  let requests = fetchMock.mock.calls
    .map(([, options]) => options.body && JSON.parse(options.body))
    .filter((body) => body?.action === 'review')
  expect(requests[0]).toMatchObject({
    traceId,
    runId: askRunId,
    target: { spanId: spans[0].id },
    decision: 'label-changed',
    newLabel: 'mixed'
  })
  fireEvent.click(
    screen.getByRole('checkbox', {
      name: /I checked the source and this label/
    })
  )
  await waitFor(() => {
    requests = fetchMock.mock.calls
      .map(([, options]) => options.body && JSON.parse(options.body))
      .filter((body) => body?.action === 'review')
    expect(requests).toHaveLength(2)
  })
  expect(requests[1].decision).toBe('rejected')
})
it('mounts separate historical evidence in step 05 with accessible heading and table semantics', async () => {
  render(React.createElement(EuropeanaResearch))
  await screen.findByText('2,000 OCR characters')
  fireEvent.click(
    screen.getByRole('button', { name: /05 Data flow & activity/ })
  )
  const historical = screen.getByRole('region', {
    name: 'Historical Compute-to-Data run (UdL budget PDFs, not Europeana)'
  })
  expect(
    within(historical).getByRole('heading', { level: 2 })
  ).toHaveTextContent('not Europeana')
  fireEvent.click(
    within(historical).getByText(
      'Output inspection: where the duplicates came from'
    )
  )
  const table = within(historical).getByRole('table', {
    name: 'PDF years identified through the algorithm log'
  })
  expect(within(table).getAllByRole('columnheader')).toHaveLength(4)
  expect(within(table).getAllByRole('rowheader').length).toBeGreaterThan(0)
  expect(
    screen.getByText(/Exploration does not execute a provider job/)
  ).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Local output-policy gate' })
  ).toBeInTheDocument()
  expect(
    screen.getByText(/in-memory, unsigned and process-local/)
  ).toBeInTheDocument()
})
