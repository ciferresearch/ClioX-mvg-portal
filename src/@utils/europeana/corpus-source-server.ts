import type { CorpusOrigin, CorpusSourceRequest } from './corpus-source'
import type { ResearchDataset } from './research'
import { loadResearchDataset } from './research-server'
import { fetchLiveCorpus } from './live-server'

export type CorpusSourceAdapters = {
  [Origin in CorpusOrigin]?: (
    request: Extract<CorpusSourceRequest, { origin: Origin }>
  ) => Promise<ResearchDataset>
}

const explorationSources: CorpusSourceAdapters = {
  snapshot: () => loadResearchDataset(),
  live: ({ record, maxPages }) => fetchLiveCorpus(record, maxPages)
}

// Server-owned adapters only. No client-supplied loader, provider URL or sealed
// output is executed here. Verified C2D output enters via /c2d-ingest.
export async function loadCorpusSource(
  request: CorpusSourceRequest,
  adapters: CorpusSourceAdapters = explorationSources
): Promise<ResearchDataset> {
  let dataset: ResearchDataset
  switch (request.origin) {
    case 'snapshot':
      if (!adapters.snapshot) throw new Error('Snapshot source is unavailable.')
      dataset = await adapters.snapshot(request)
      break
    case 'live':
      if (!adapters.live) throw new Error('Live source is unavailable.')
      dataset = await adapters.live(request)
      break
    case 'c2d':
      if (!adapters.c2d)
        throw new Error(
          'Load verified sealed output through the C2D ingestion route.'
        )
      dataset = await adapters.c2d(request)
      break
    default:
      throw new Error('Unsupported corpus source.')
  }
  return { ...dataset, origin: request.origin }
}
