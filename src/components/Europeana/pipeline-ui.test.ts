/** @jest-environment jsdom */
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, within, cleanup } from '@testing-library/react'
import ActivityPanel from './ActivityPanel'
import {
  ActivityRecord,
  ActivityStage,
  PIPELINE_STEPS,
  STAGE_PIPELINE_STEP
} from '@utils/europeana/activity'

jest.mock('./HistoricalEvidence', () => ({
  __esModule: true,
  default: () => null
}))
afterEach(cleanup)
function record(
  traceId: string,
  runId: string,
  stage: ActivityStage,
  at = '2026-10-07T09:00:00Z'
): ActivityRecord {
  return {
    traceId,
    runId,
    action: 'ask',
    status: 'completed',
    startedAt: at,
    request: {},
    inputs: [],
    model: { state: 'not-called' },
    cleanup: 'not-needed',
    events: [
      {
        stage,
        pipelineStep: STAGE_PIPELINE_STEP[stage],
        at,
        outcome: 'succeeded',
        detail: `Observed ${runId}`
      }
    ]
  } as ActivityRecord
}
it('groups every trace in paper-step order, preserves event chronology and shows indexing observation limits', () => {
  const records = [
    record('first-trace', 'late-rank', 'ranking', '2026-10-07T10:00:00Z'),
    record('first-trace', 'early-rank', 'ranking'),
    record('second-trace', 'second-only', 'source-fetch')
  ]
  const stages: ActivityStage[] = [
    'human-review',
    'model-response',
    'retrieval',
    'knowledge-upload',
    'chunking',
    'saved-source'
  ]
  records.push(...stages.map((stage) => record('first-trace', stage, stage)))
  render(React.createElement(ActivityPanel, { records, getExport: jest.fn() }))
  for (const id of ['first-trace', 'second-trace']) {
    const trace = screen.getByRole('region', { name: `Trace ${id}` })
    expect(
      [...trace.querySelectorAll('[data-pipeline-step]')].map((element) =>
        element.getAttribute('data-pipeline-step')
      )
    ).toEqual(PIPELINE_STEPS.map((step) => step.id))
    expect(
      within(trace).getByRole('region', { name: '2 Indexing' })
    ).toHaveTextContent(
      'Embedding model, vector store and index internals are not observed'
    )
  }
  const first = screen.getByRole('region', { name: 'Trace first-trace' })
  const ranking = within(first).getByRole('region', { name: '4 Ranking' })
  expect(
    within(ranking)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
  ).toEqual([
    expect.stringContaining('Observed early-rank'),
    expect.stringContaining('Observed late-rank')
  ])
  expect(first).not.toHaveTextContent('Observed second-only')
  expect(
    within(first).getByRole('region', { name: '5 Generation' })
  ).toHaveTextContent('Observed model-response')
  expect(screen.getByText(/Steps follow the RAG pipeline/)).toHaveTextContent(
    'IEEE CAS 2025, Section II.A'
  )
})
