import type { C2DAggregates } from './c2d-types'
import type { ActivityRecord } from './activity'
import { renderInteractionLog } from './interaction-log-server'
import type { BlockLabel } from './research'
import { OUTPUT_POLICY, OutputPolicyError } from './output-policy'
import type { PublicResearchDataset, ReleasedResult } from './output-policy'

// In-memory, unsigned, process-local; NOT a tamper-evident audit log.
// Restart, expiry and capacity eviction lose records. No authorization is
// conferred by knowing a trace/run ID; these are correlation identifiers only.
const key = Symbol.for('cliox.europeana.activity-journal.v2')
export const JOURNAL_TTL = 60 * 60 * 1000
export const JOURNAL_LIMIT = 1000
export const JOURNAL_SCOPE =
  'In-memory, unsigned, process-local observations; not a tamper-evident audit log. One-hour expiry, maximum 1000 runs.'
export interface ReviewRecord {
  target: { sourceSpanId: string } | { spanId: string }
  decision: 'accepted' | 'rejected' | 'label-changed'
  newLabel?: BlockLabel['label']
  reviewer: {
    identity: 'self-reported'
    nameSha256: string
    nameCharacters: number
  }
  noteSha256?: string
  noteCharacters?: number
}
export interface JournalEntry {
  record: ActivityRecord
  results?: ReleasedResult[]
  dataset?: PublicResearchDataset
  aggregates?: C2DAggregates
  review?: ReviewRecord
  expires: number
}
const journal: Map<string, JournalEntry> =
  (globalThis as any)[key] || ((globalThis as any)[key] = new Map())
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
export function validId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      value
    )
  )
}
function invalid(message: string): never {
  throw new OutputPolicyError('invalid-input', message)
}
function prune() {
  for (const [id, entry] of journal)
    if (entry.expires <= Date.now()) journal.delete(id)
}
export function rememberActivity(record: ActivityRecord) {
  prune()
  const previous = journal.get(record.runId)
  if (!previous && journal.size >= JOURNAL_LIMIT)
    journal.delete(journal.keys().next().value)
  journal.set(record.runId, {
    ...previous,
    record: clone(record),
    expires: previous?.expires ?? Date.now() + JOURNAL_TTL
  })
}
export function rememberReleasedResult(runId: string, result: ReleasedResult) {
  prune()
  const entry = journal.get(runId)
  if (entry) (entry.results ||= []).push(clone(result))
}
export function rememberDataset(
  runId: string,
  dataset: PublicResearchDataset,
  aggregates?: C2DAggregates
) {
  const entry = journal.get(runId)
  if (entry) {
    entry.dataset = clone(dataset)
    if (aggregates) entry.aggregates = clone(aggregates)
  }
}
export function rememberReview(runId: string, review: ReviewRecord) {
  const entry = journal.get(runId)
  if (entry) entry.review = clone(review)
}
export function recordedActivity(runId: string): JournalEntry | undefined {
  prune()
  const entry = journal.get(runId)
  return entry && clone(entry)
}
export function recordedTrace(traceId: string): JournalEntry[] {
  prune()
  return [...journal.values()]
    .filter((entry) => entry.record.traceId === traceId)
    .sort((a, b) => a.record.startedAt.localeCompare(b.record.startedAt))
    .map(clone)
}
export function requireTrace(traceId: unknown, corpusVersion?: string) {
  if (!validId(traceId)) invalid('A valid server-issued trace ID is required.')
  const source = recordedTrace(traceId).find((entry) => entry.dataset)
  if (!source) invalid('The trace is unavailable. Load the source again.')
  if (corpusVersion !== undefined && source.dataset.version !== corpusVersion)
    invalid('The trace belongs to another corpus version.')
  return source
}
export function exportRecordedTrace(
  traceId: string,
  runIds: unknown,
  corpusVersion: string
) {
  const source = requireTrace(traceId, corpusVersion)
  const entries = recordedTrace(traceId)
  if (
    runIds !== undefined &&
    (!Array.isArray(runIds) ||
      runIds.length > 100 ||
      runIds.some((id) => !validId(id)))
  )
    invalid('Choose at most 100 known operation IDs to export.')
  const ids = runIds as string[] | undefined
  const selected =
    ids === undefined
      ? entries
      : entries.filter((entry) => ids.includes(entry.record.runId))
  if (ids !== undefined && new Set(ids).size !== selected.length)
    invalid('An operation is unavailable or belongs to another trace.')
  if (
    selected.some(
      (entry) =>
        entry.record.corpusVersion &&
        entry.record.corpusVersion !== corpusVersion
    )
  )
    invalid('An operation belongs to another corpus version.')
  return {
    schemaVersion: 4,
    traceId,
    exportedAt: new Date().toISOString(),
    journalScope: JOURNAL_SCOPE,
    policyId: OUTPUT_POLICY.id,
    executionMode: source.dataset.origin === 'c2d' ? 'c2d' : 'service-api',
    c2dStatus:
      source.dataset.origin === 'c2d'
        ? 'sealed-output-verified'
        : 'not-connected',
    dataset: source.dataset,
    ...(source.aggregates ? { aggregates: source.aggregates } : {}),
    // Keep the entire trace for context, even when results/reviews are a subset.
    activityRecords: entries.map((entry) => entry.record),
    interactionLog: renderInteractionLog(entries.map((entry) => entry.record)),
    releasedResults: selected.flatMap((entry) =>
      (entry.results || []).map((result) => ({
        runId: entry.record.runId,
        result
      }))
    ),
    reviews: selected.flatMap((entry) =>
      entry.review
        ? [
            {
              runId: entry.record.runId,
              parentRunId: entry.record.parentRunId,
              ...entry.review
            }
          ]
        : []
    )
  }
}
