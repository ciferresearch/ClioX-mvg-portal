import type { ActivityRecord } from './activity'
import type { PublicResearchDataset } from './output-policy'

// Public aggregates contract. Unlisted fields are discarded by the server.
export interface C2DAggregates {
  schemaVersion: 1
  runId: string
  pages: Array<{
    recordId: string
    page: string
    wordCount: number
    metadata: {
      title: string
      date: string
      language: string
      rights: string
      attribution: string
    }
  }>
  topTerms: Array<{ term: string; count: number }>
}
export interface C2DIngestResult {
  publicDataset: PublicResearchDataset
  aggregates: C2DAggregates
  traceId: string
  activity: ActivityRecord
}
