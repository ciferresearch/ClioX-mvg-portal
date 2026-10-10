export type CorpusOrigin = 'snapshot' | 'live' | 'c2d'

// Server-held C2D provenance. Job/log assertions are client-supplied; sealed
// integrity is verified separately. These fields are not public output fields.
export interface CorpusProvenance {
  jobId?: string
  datasetDid?: string
  algorithmDid?: string
  providerUrl?: string
  sealedSha256?: string
  configureLogSha256?: string
  algorithmLogSha256?: string
}

export type CorpusSourceRequest =
  | { origin: 'snapshot' }
  | { origin: 'live'; record: unknown; maxPages?: unknown }
  | { origin: 'c2d'; provenance: CorpusProvenance }
