import { readFile } from 'node:fs/promises'
import path from 'path'
import { createHash } from 'crypto'
import { cwd } from 'node:process'
import {
  textWindows,
  EvidenceSpan,
  ResearchDataset,
  ResearchPage
} from './research'

interface Snapshot {
  retrievedAt: string
  pages: ResearchPage[]
  manifest: {
    items: Array<{
      width: number
      height: number
      items: Array<{ items: Array<{ body: { id: string } }> }>
    }>
  }
  annotationInspection: {
    blocks: Array<{
      id: string
      start: number
      end: number
      imageRegionTargets: string[]
    }>
  }
}

export async function loadResearchDataset(): Promise<ResearchDataset> {
  const raw = await readFile(
    path.join(cwd(), 'content/europeana/full-issue-snapshot.json'),
    'utf8'
  )
  const snapshot: Snapshot = JSON.parse(raw)
  const pages = snapshot.pages.map((page, index) => ({
    ...page,
    source: `https://www.europeana.eu/item${page.recordId}`,
    retrievedAt: snapshot.retrievedAt,
    imageUrl: snapshot.manifest.items[index].items[0].items[0].body.id,
    imageWidth: snapshot.manifest.items[index].width,
    imageHeight: snapshot.manifest.items[index].height
  }))
  const first = pages[0]
  const blocks: EvidenceSpan[] = snapshot.annotationInspection.blocks.flatMap(
    (block) => {
      if (
        block.start < 0 ||
        block.end > first.text.length ||
        block.end <= block.start
      )
        return []
      const rect = block.imageRegionTargets[0]?.match(
        /#xywh=(\d+),(\d+),(\d+),(\d+)$/
      )
      const region = rect
        ? { x: +rect[1], y: +rect[2], width: +rect[3], height: +rect[4] }
        : undefined
      const validRegion =
        region &&
        region.x + region.width <= first.imageWidth &&
        region.y + region.height <= first.imageHeight
      return [
        {
          id: `${first.id}#char=${block.start},${block.end}`,
          pageId: first.id,
          pageLabel: first.page,
          start: block.start,
          end: block.end,
          text: first.text.slice(block.start, block.end),
          kind: 'layout-block' as const,
          annotationId: block.id,
          ...(validRegion ? { region } : {})
        }
      ]
    }
  )
  return {
    origin: 'snapshot',
    version: createHash('sha256').update(raw).digest('hex').slice(0, 16),
    retrievedAt: snapshot.retrievedAt,
    pages,
    spans: [...blocks, ...pages.slice(1).flatMap(textWindows)]
  }
}
