import type { BackendObservability } from './activity'
import type { EvidenceSpan, ResearchDataset } from './research'
import { publicMetadata } from './output-policy'

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const integer = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0
const normalize = (value: string) =>
  value.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim()

// Service data is untrusted. Construct a fresh allowlisted object; never spread
// the response. Model identifiers must be short tokens, not prose or URLs.
// Retrieval IDs must resolve to the actual uploaded candidates. Unknown fields,
// invalid values, text/previews and arbitrary backend chunk IDs are discarded.
export function sanitizeObservability(
  value: unknown,
  dataset: ResearchDataset,
  candidates: EvidenceSpan[]
): BackendObservability | undefined {
  if (!object(value)) return undefined
  const result: BackendObservability = {}
  if (integer(value.stored_chunks)) result.stored_chunks = value.stored_chunks
  for (const field of ['embedding_model', 'model_used'] as const) {
    const token = value[field]
    if (
      typeof token === 'string' &&
      /^[A-Za-z0-9][A-Za-z0-9._/-]{0,58}$/.test(token) &&
      !dataset.pages.some((page) =>
        normalize(page.text).includes(normalize(token))
      )
    )
      result[field] = token
  }
  if (
    typeof value.index_sha256 === 'string' &&
    /^[a-fA-F0-9]{64}$/.test(value.index_sha256)
  )
    result.index_sha256 = value.index_sha256.toLowerCase()
  if (Array.isArray(value.retrieval)) {
    result.retrieval = value.retrieval.slice(0, 8).flatMap((row) => {
      if (
        !object(row) ||
        typeof row.chunk_id !== 'string' ||
        typeof row.score !== 'number' ||
        !Number.isFinite(row.score) ||
        !integer(row.rank) ||
        row.rank < 1 ||
        row.rank > 8
      )
        return []
      const span = candidates.find((span) => span.id === row.chunk_id)
      if (!span) return []
      const id = publicMetadata(dataset, span.id, 1100)
      // Source IDs may contain paths and #char offsets, never URL queries.
      if (!/^[A-Za-z0-9_./#=,-]+$/.test(id)) return []
      return [{ chunk_id: id, score: row.score, rank: row.rank }]
    })
  }
  return Object.keys(result).length ? result : undefined
}
