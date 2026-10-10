/** @jest-environment node */
import { beginActivity, finishActivity } from './activity-server'
import {
  JOURNAL_LIMIT,
  JOURNAL_TTL,
  recordedActivity,
  recordedTrace,
  rememberReleasedResult
} from './activity-journal'

beforeEach(() => {
  ;(globalThis as any)[
    Symbol.for('cliox.europeana.activity-journal.v2')
  ].clear()
  jest.useFakeTimers().setSystemTime(new Date('2026-10-07T00:00:00Z'))
})
afterEach(() => jest.useRealTimers())
it('bounds journal capacity to 1000 entries and expires at one hour', () => {
  const first = finishActivity(beginActivity('load-source'))
  for (let i = 0; i < JOURNAL_LIMIT; i++)
    finishActivity(beginActivity('locate', first.traceId))
  expect(recordedActivity(first.runId)).toBeUndefined()
  expect(recordedTrace(first.traceId)).toHaveLength(JOURNAL_LIMIT)
  jest.advanceTimersByTime(JOURNAL_TTL)
  expect(recordedTrace(first.traceId)).toEqual([])
})
it('preserves released results when finishing a record and returns defensive copies ordered by start time', () => {
  const first = beginActivity('ask')
  jest.advanceTimersByTime(10)
  const second = finishActivity(
    beginActivity('locate', first.traceId, first.runId)
  )
  finishActivity(first)
  const result = { answer: 'Released', outputPolicy: { id: 'policy' } } as any
  rememberReleasedResult(first.runId, result)
  finishActivity(first)
  result.answer = 'Changed'
  const entries = recordedTrace(first.traceId)
  expect(entries.map((entry) => entry.record.runId)).toEqual([
    first.runId,
    second.runId
  ])
  entries[0].results[0].answer = 'Mutated'
  expect(recordedActivity(first.runId).results[0].answer).toBe('Released')
})
