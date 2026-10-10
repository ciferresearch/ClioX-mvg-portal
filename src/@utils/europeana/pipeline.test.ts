/** @jest-environment node */
import fs from 'fs'
import path from 'path'
import ts from 'typescript'
import { STAGE_PIPELINE_STEP, ActivityStage } from './activity'
import {
  beginActivity,
  observe,
  recordChunking,
  sha256
} from './activity-server'
import { rankEvidence, selectEvidence, ResearchDataset } from './research'
import { sanitizeObservability } from './observability-server'
import { renderInteractionLog } from './interaction-log-server'

const text =
  'Private archival prose contains sensitive sentences that must stay on the server, including harbour records and vessel descriptions.'
const spans = ['p1#char=0,60', 'p1#char=60,120'].map((id, i) => ({
  id,
  pageId: 'p1',
  pageLabel: 'p. 1',
  start: i * 60,
  end: (i + 1) * 60,
  text: text.slice(i * 60, (i + 1) * 60),
  kind: 'text-window' as const
}))
const dataset = { pages: [{ id: 'p1', text }], spans } as ResearchDataset

it('maps every stage used in production code and emits its required pipelineStep', () => {
  const seen = new Set<string>()
  function walk(dir: string) {
    for (const name of fs.readdirSync(dir)) {
      const file = path.join(dir, name)
      if (fs.statSync(file).isDirectory()) {
        walk(file)
        continue
      }
      if (!/\.tsx?$/.test(name) || name.endsWith('.test.ts')) continue
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true
      )
      const literals = (node: ts.Node) => {
        if (ts.isStringLiteral(node)) seen.add(node.text)
        else ts.forEachChild(node, literals)
      }
      const visit = (node: ts.Node) => {
        if (
          ts.isCallExpression(node) &&
          node.expression.getText(source) === 'observe'
        )
          literals(node.arguments[1])
        if (
          ts.isPropertyAssignment(node) &&
          node.name.getText(source) === 'stage'
        )
          literals(node.initializer)
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
  }
  for (const directory of [
    'src/@utils/europeana',
    'src/components/Europeana',
    'src/pages/api/europeana'
  ])
    walk(path.join(process.cwd(), directory))
  expect([...seen].sort()).toEqual(Object.keys(STAGE_PIPELINE_STEP).sort())
  const record = beginActivity('ask')
  for (const stage of seen)
    observe(
      record,
      stage as ActivityStage,
      'succeeded',
      'Fixed server description.'
    )
  expect(
    record.events.every(
      (event) => event.pipelineStep === STAGE_PIPELINE_STEP[event.stage]
    )
  ).toBe(true)
})

it('hashes only ordered span IDs and offsets and counts source versus overlapping span characters', () => {
  const mixed = {
    ...dataset,
    spans: [...spans, { ...spans[0], kind: 'layout-block' as const }]
  }
  const record = beginActivity('load-source')
  recordChunking(record, mixed)
  const { chunking } = record.events[0].metadata
  expect(chunking).toEqual({
    chunkers: [
      { id: 'layout-block', version: 'v1' },
      { id: 'text-window', version: 'v1' }
    ],
    spanCounts: { 'layout-block': 1, 'text-window': 2 },
    totalCharacters: text.length,
    spanCharacters: 180,
    spanTableSha256: sha256(
      JSON.stringify(
        mixed.spans.map(({ id, start, end }) => ({ id, start, end }))
      )
    )
  })
  expect(JSON.stringify(record)).not.toContain(text.slice(0, 60))
  const changed = beginActivity('load-source')
  recordChunking(changed, {
    ...mixed,
    spans: mixed.spans.map((span) => ({ ...span, text: 'different text' }))
  })
  expect(changed.events[0].metadata.chunking.spanTableSha256).toBe(
    chunking.spanTableSha256
  )
})

it('exposes unchanged lexical scoring, positive top-k scores, stable ties and empty retrieval', () => {
  const inputs = [
    { ...spans[0], text: 'harbour vessels' },
    { ...spans[1], text: 'harbour' },
    { ...spans[0], id: 'third', text: 'harbour vessels' }
  ]
  const ranked = rankEvidence('harbour vessels', inputs, 2)
  expect(ranked.map((row) => row.span.id)).toEqual([inputs[0].id, 'third'])
  expect(ranked.map((row) => row.rank)).toEqual([1, 2])
  expect(ranked[0].score).toBeCloseTo(Math.log(1 + 3 / 4) + Math.log(1 + 3 / 3))
  expect(selectEvidence('harbour vessels', inputs, 2)).toEqual(
    ranked.map((row) => row.span)
  )
  expect(rankEvidence('no-match', inputs)).toEqual([])
})

it('allowlists optional service scalars and known candidate score/ID arrays, discarding all text fields', () => {
  expect(
    sanitizeObservability(
      {
        stored_chunks: 2,
        embedding_model: 'vendor/embed-v1',
        index_sha256: 'a'.repeat(64),
        model_used: 'model-v2',
        text,
        prompt: text,
        notes: text,
        url: 'https://example.test/?secret=token',
        retrieval: [
          {
            chunk_id: spans[0].id,
            score: 0.7,
            rank: 1,
            text,
            content_preview: text,
            metadata: { text }
          }
        ]
      },
      dataset,
      spans
    )
  ).toEqual({
    stored_chunks: 2,
    embedding_model: 'vendor/embed-v1',
    index_sha256: 'a'.repeat(64),
    model_used: 'model-v2',
    retrieval: [{ chunk_id: spans[0].id, score: 0.7, rank: 1 }]
  })
})

it('rejects prose, URLs, long or copied model IDs, nested scalars and invalid retrieval values', () => {
  for (const token of [
    text,
    'https://service/?secret=abc',
    'private archival prose',
    'Private',
    'a'.repeat(60),
    { text },
    ['model']
  ]) {
    expect(
      sanitizeObservability(
        { embedding_model: token, model_used: token },
        dataset,
        spans
      )
    ).toBeUndefined()
  }
  expect(
    sanitizeObservability(
      {
        stored_chunks: -1,
        index_sha256: text,
        note: text,
        retrieval: [
          { chunk_id: text, score: 1, rank: 1 },
          { chunk_id: spans[0].id, score: Infinity, rank: 1 },
          { chunk_id: spans[0].id, score: '1', rank: 1 },
          { chunk_id: spans[0].id, score: 1, rank: 0 },
          { chunk_id: spans[0].id, score: 1, rank: 1.5 }
        ]
      },
      dataset,
      spans
    )
  ).toEqual({ retrieval: [] })
  expect(sanitizeObservability(undefined, dataset, spans)).toBeUndefined()
})

it('renders the six-line fixture, sorts event times across runs and excludes non-event journal text', () => {
  const record = beginActivity('ask', '11111111-1111-4111-8111-111111111111')
  record.runId = '22222222-2222-4222-8222-222222222222'
  const fixture: Array<[ActivityStage, string]> = [
    ['saved-source', 'Saved sample loaded; OCR retained on server.'],
    ['chunking', 'text-window/v1; 2 spans; IDs and offsets hashed.'],
    [
      'knowledge-upload',
      'Upload acknowledged; 2 chunks; index internals not observed.'
    ],
    ['retrieval', '2 candidate units; offsets and SHA-256 recorded.'],
    [
      'ranking',
      'lexical-substring-idf/v1; candidateLimit=8; 2 candidates ranked.'
    ],
    [
      'model-response',
      'Service response received; model identity is service-reported.'
    ]
  ]
  fixture.forEach(([stage, detail], index) => {
    observe(record, stage, 'succeeded', detail)
    record.events[index].at = `2026-10-07T09:36:5${index}.590Z`
  })
  record.request.note = 'PRIVATE REVIEW NOTE'
  record.sources = [{ source: 'https://private.test/?token=SECRET' }] as any
  record.events.reverse()
  const view = renderInteractionLog([record])
  expect(view).toBe(
    fs
      .readFileSync(
        path.join(
          process.cwd(),
          '.jest/fixtures/europeana/interaction-log-fixture.txt'
        ),
        'utf8'
      )
      .trimEnd()
  )
  expect(view.split('\n')).toHaveLength(6)
  expect(view).not.toMatch(/PRIVATE REVIEW NOTE|SECRET|private\.test/)
  const later = { ...record, events: [record.events[0]] }
  expect(
    renderInteractionLog([
      later,
      { ...record, events: [record.events[5]] }
    ]).split('\n')[0]
  ).toContain('saved-source')
})
