// Single stage → pipeline-step mapping. The five numbered steps follow Zhou,
// Li & Lemieux, IEEE CAS 2025, §II.A; access and governance frame those steps.
export const STAGE_PIPELINE_STEP = {
  'source-fetch': 'access',
  'c2d-access': 'access',
  'c2d-ingestion': 'ingestion',
  'saved-source': 'access',
  'local-cache': 'access',
  // Search discovers source metadata before OCR acquisition, not RAG retrieval.
  search: 'access',
  chunking: 'ingestion',
  'knowledge-upload': 'indexing',
  selection: 'retrieval',
  retrieval: 'retrieval',
  locate: 'retrieval',
  ranking: 'ranking',
  'model-request': 'generation',
  'model-response': 'generation',
  // Existing no-candidate fallback records a skipped model operation.
  model: 'generation',
  'output-validation': 'governance',
  'output-policy': 'governance',
  'output-release': 'governance',
  'session-cleanup': 'governance',
  'human-review': 'governance',
  export: 'governance',
  replay: 'governance',
  // These existing catch-all failures describe run validation/status, not an
  // observed embedding or model failure (which may not have been reached).
  processing: 'governance',
  request: 'governance'
} as const
export type ActivityStage = keyof typeof STAGE_PIPELINE_STEP
export type PipelineStep = (typeof STAGE_PIPELINE_STEP)[ActivityStage]
export const PIPELINE_STEPS: ReadonlyArray<{
  id: PipelineStep
  label: string
}> = [
  { id: 'access', label: 'Access' },
  { id: 'ingestion', label: '1 Ingestion' },
  { id: 'indexing', label: '2 Indexing' },
  { id: 'retrieval', label: '3 Retrieval' },
  { id: 'ranking', label: '4 Ranking' },
  { id: 'generation', label: '5 Generation' },
  { id: 'governance', label: 'Governance' }
]
export const INDEXING_SCOPE =
  'Embedding model, vector store and index internals are not observed by the demo; they live in the configured ClioX service. Optional backend reports are not independently verified.'

// Optional service-reported hook. No arbitrary strings, text, prompts, notes,
// URLs or nested backend objects may pass through the server sanitizer.
export interface BackendObservability {
  stored_chunks?: number
  embedding_model?: string
  index_sha256?: string
  retrieval?: Array<{ chunk_id: string; score: number; rank: number }>
  model_used?: string
}
export interface ActivityEventMetadata {
  providerLog?: {
    filename: 'configure.log' | 'algorithm.log' | 'pipeline.jsonl'
    sha256: string
    lineSha256: string
    hashScope: 'sanitized-UTF8'
    provenance: 'client-supplied-provider-log'
  }
  chunking?: {
    chunkers: Array<{ id: 'layout-block' | 'text-window'; version: 'v1' }>
    spanCounts: { 'layout-block': number; 'text-window': number }
    totalCharacters: number
    spanCharacters: number
    spanTableSha256: string
  }
  ranking?: {
    method: 'lexical-substring-idf' | 'explicit-user-selection'
    version: 'v1'
    candidateLimit: number
    candidates: Array<{ id: string; rank: number; score?: number }>
  }
  indexing?: {
    uploadAcknowledged: boolean
    chunkCount: number
    payloadSha256: string
    embeddingModel: 'not-observed'
    vectorStore: 'not-observed'
    indexInternals: 'not-observed'
  }
  generation?: {
    promptTemplate: string
    promptSha256: string
    requested: { temperature: number; max_tokens: number }
    effective: 'not-reported'
  }
  observability?: BackendObservability
}

// Serializable application observations, not Provider/operator attestations.
export type ActivityAction =
  | 'search'
  | 'load-source'
  | 'ask'
  | 'analyze'
  | 'locate'
  | 'replay'
  | 'review'
  | 'export'
export interface ActivityEvent {
  at: string
  stage: ActivityStage
  pipelineStep: PipelineStep
  metadata?: ActivityEventMetadata
  outcome: 'started' | 'succeeded' | 'failed' | 'skipped'
  detail: string
}
export interface ActivityRecord {
  schemaVersion: 1
  traceId: string
  parentRunId?: string
  runId: string
  action: ActivityAction
  startedAt: string
  finishedAt?: string
  status: 'running' | 'completed' | 'failed'
  observationScope: 'demo-server'
  pipelineVersion: string
  corpusVersion?: string
  sourceOrigin?: string
  request: Record<string, string | number | boolean | string[]>
  sources: Array<{
    pageId: string
    source: string
    textSha256: string
    rights: string
    retrievedAt: string
  }>
  inputs: Array<{
    id: string
    pageId: string
    start: number
    end: number
    textSha256: string
  }>
  configuration?: {
    retrieval: string
    candidateLimit: number
    promptTemplate: string
    promptSha256?: string
    uploadPayloadSha256?: string
    requested: { temperature: number; max_tokens: number }
    effective: 'not-reported'
    transport: 'portal-proxy' | 'direct-service' | 'unconfigured'
  }
  model: {
    state: 'not-called' | 'requested' | 'reported' | 'not-reported'
    name?: string
    nameSha256?: string
  }
  responseSha256?: string
  outputSha256?: string
  cleanup: 'not-needed' | 'not-attempted' | 'acknowledged' | 'failed'
  infrastructure: {
    mode: 'service-api' | 'c2d'
    providerJob: 'not-connected' | 'client-reported'
    resourceLifecycle: 'not-observed'
    deletionVerified: false
  }
  events: ActivityEvent[]
}

export const ACTIVITY_LABELS: Record<ActivityAction, string> = {
  search: 'Search Europeana',
  'load-source': 'Load source text',
  ask: 'Ask a question',
  analyze: 'Classify selected text',
  locate: 'Locate source units',
  replay: 'Load a recorded example',
  review: 'Record a human review assertion',
  export: 'Prepare an allowed result export'
}
