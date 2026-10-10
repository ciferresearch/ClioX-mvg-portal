import { createHash, randomUUID } from 'crypto'
import { STAGE_PIPELINE_STEP } from './activity'
import type {
  ActivityAction,
  ActivityRecord,
  ActivityEvent,
  ActivityStage,
  ActivityEventMetadata
} from './activity'
import type { ResearchDataset, EvidenceSpan } from './research'
import { publicDataset, publicMetadata } from './output-policy'
import { rememberActivity } from './activity-journal'

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function beginActivity(
  action: ActivityAction,
  traceId = randomUUID(),
  parentRunId?: string
): ActivityRecord {
  return {
    schemaVersion: 1,
    traceId,
    ...(parentRunId ? { parentRunId } : {}),
    runId: randomUUID(),
    action,
    startedAt: new Date().toISOString(),
    status: 'running',
    observationScope: 'demo-server',
    pipelineVersion: 'europeana-evidence-desk/2026-10-07',
    request: {},
    sources: [],
    inputs: [],
    model: { state: 'not-called' },
    cleanup: 'not-needed',
    infrastructure: {
      mode: 'service-api',
      providerJob: 'not-connected',
      resourceLifecycle: 'not-observed',
      deletionVerified: false
    },
    events: []
  }
}

export function observe(
  record: ActivityRecord,
  stage: ActivityStage,
  outcome: ActivityEvent['outcome'],
  detail: string,
  metadata?: ActivityEventMetadata
) {
  record.events.push({
    at: new Date().toISOString(),
    stage,
    pipelineStep: STAGE_PIPELINE_STEP[stage],
    outcome,
    detail,
    ...(metadata ? { metadata } : {})
  })
}

export function finishActivity(record: ActivityRecord, failed = false) {
  record.status = failed ? 'failed' : 'completed'
  record.finishedAt = new Date().toISOString()
  rememberActivity(record)
  return record
}

export function recordSources(
  record: ActivityRecord,
  dataset: ResearchDataset,
  pageIds?: string[]
) {
  const metadata = publicDataset(dataset)
  record.corpusVersion = metadata.version
  record.sourceOrigin = dataset.origin || 'snapshot'
  record.sources = metadata.pages
    .filter((page) => !pageIds || pageIds.includes(page.id))
    .map((page) => ({
      pageId: page.id,
      source: page.source || page.recordId,
      textSha256: page.textSha256,
      rights: page.rights,
      retrievedAt: page.retrievedAt
    }))
}

export function recordInputs(
  record: ActivityRecord,
  candidates: EvidenceSpan[],
  dataset?: ResearchDataset
) {
  record.inputs = candidates.map((span) => ({
    id: dataset ? publicMetadata(dataset, span.id, 1100) : span.id,
    pageId: dataset ? publicMetadata(dataset, span.pageId, 1000) : span.pageId,
    start: span.start,
    end: span.end,
    textSha256: sha256(span.text)
  }))
}

// Hash the ordered raw span table with only IDs and UTF-16 character offsets.
// Total characters counts source pages once; spanCharacters includes overlap.
export function recordChunking(
  record: ActivityRecord,
  dataset: ResearchDataset
) {
  const spanCounts = { 'layout-block': 0, 'text-window': 0 }
  for (const span of dataset.spans) spanCounts[span.kind]++
  observe(
    record,
    'chunking',
    'succeeded',
    'Source parsed into evidence spans; IDs and offsets hashed. No source text recorded.',
    {
      chunking: {
        chunkers: (['layout-block', 'text-window'] as const)
          .filter((id) => spanCounts[id] > 0)
          .map((id) => ({ id, version: 'v1' })),
        spanCounts,
        totalCharacters: dataset.pages.reduce(
          (sum, page) => sum + page.text.length,
          0
        ),
        spanCharacters: dataset.spans.reduce(
          (sum, span) => sum + span.end - span.start,
          0
        ),
        spanTableSha256: sha256(
          JSON.stringify(
            dataset.spans.map(({ id, start, end }) => ({ id, start, end }))
          )
        )
      }
    }
  )
}
