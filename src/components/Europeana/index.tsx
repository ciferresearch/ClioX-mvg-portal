import { useCallback, useEffect, useMemo, useState } from 'react'
import SearchSources from './SearchSources'
import C2DFlow from './C2DFlow'
import DistantReading from './DistantReading'
import type { C2DAggregates } from '@utils/europeana/c2d-types'
import JsonExport from './JsonExport'
import ActivityPanel from './ActivityPanel'
import type { ActivityRecord } from '@utils/europeana/activity'
import { BlockLabel, coveredCharacters } from '@utils/europeana/research'
import type {
  PublicResearchDataset,
  PublicEvidenceSpan,
  ReleasedEvidence,
  ReleasedResult,
  LocateResult
} from '@utils/europeana/output-policy'
import styles from './research.module.css'

const STEPS = [
  'Select a corpus',
  'Read the evidence',
  'Ask a question',
  'Review patterns',
  'Data flow & activity'
]
const LIVE_INFERENCE_AVAILABLE = true
const SAMPLE_RECORD =
  'https://www.europeana.eu/item/9200338/BibliographicResource_3000094647100'
const QUESTIONS = [
  'Which two ports are named in the naval report about Ostende?',
  'Does the newspaper report that Freiherr von Richthofen survived or was killed?',
  'What was the exact Apple stock price in September 2026?'
]
const LABELS: BlockLabel['label'][] = [
  'positive',
  'neutral',
  'negative',
  'mixed',
  'uncertain'
]

async function requestApi(body?: unknown, mode = '') {
  const response = await fetch(
    `/api/europeana/research${mode ? `?mode=${mode}` : ''}`,
    {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    }
  )
  const result = await response.json()
  if (!response.ok)
    throw Object.assign(new Error(result.error || 'Request failed.'), {
      activity: result.activity
    })
  return result
}

export default function EuropeanaResearch() {
  const exploration = process.env.NEXT_PUBLIC_EUROPEANA_EXPLORATION === 'true'
  const [aggregates, setAggregates] = useState<C2DAggregates | null>(null)
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const addActivity = useCallback((record: ActivityRecord) => {
    setActivities((previous) =>
      previous.some((item) => item.runId === record.runId)
        ? previous
        : [...previous, record]
    )
  }, [])
  const api = useCallback(
    async (body?: unknown, mode = '') => {
      try {
        const result = await requestApi(body, mode)
        if (result.activity) addActivity(result.activity)
        return result
      } catch (error) {
        if (error.activity) addActivity(error.activity)
        throw error
      }
    },
    [addActivity]
  )
  const [dataset, setDataset] = useState<PublicResearchDataset | null>(null)
  const [step, setStep] = useState(0)
  const [pageIds, setPageIds] = useState<string[]>([])
  const [readerPage, setReaderPage] = useState('')
  const [spanId, setSpanId] = useState('')
  const [analysisIds, setAnalysisIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [question, setQuestion] = useState(QUESTIONS[0])
  const [answer, setAnswer] = useState<ReleasedResult | null>(null)
  const [answerMode, setAnswerMode] = useState('')
  const [answeredQuestion, setAnsweredQuestion] = useState('')
  const [labels, setLabels] = useState<BlockLabel[]>([])
  const [analysisMode, setAnalysisMode] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [located, setLocated] = useState<{
    query: string
    pageId: string
    version: string
    result: LocateResult
  } | null>(null)
  const [answerRunId, setAnswerRunId] = useState('')
  const [labelRunIds, setLabelRunIds] = useState<Record<string, string>>({})
  const [reviewRunIds, setReviewRunIds] = useState<Record<string, string>>({})
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [reviewer, setReviewer] = useState('')

  const [record, setRecord] = useState(SAMPLE_RECORD)
  const [maxPages, setMaxPages] = useState(3)
  const [health, setHealth] = useState('Checking ClioX service…')

  function acceptDataset(data: PublicResearchDataset) {
    setDataset(data)
    setAggregates(null)
    setLocated(null)
    setAnswerRunId('')
    setLabelRunIds({})
    setReviewRunIds({})
    setReviewNotes({})
    setPageIds(data.pages.map((page) => page.id))
    setReaderPage(data.pages[0].id)
    const first = data.spans[0]
    setSpanId(first?.id || '')
    setAnalysisIds(first ? [first.id] : [])
    setAnswer(null)
    setAnswerMode('')
    setAnsweredQuestion('')
    setLabels([])
    setAnalysisMode('')
    setReviewer('')
    setQuery('')
  }

  async function run(message: string, work: () => Promise<void>) {
    if (busy) return
    setBusy(message)
    setError('')
    try {
      await work()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.')
    } finally {
      setBusy('')
    }
  }
  async function importSource(selectedRecord = record) {
    setRecord(selectedRecord)
    await run('Fetching original text from Europeana now…', async () => {
      const data = await api({
        action: 'import',
        record: selectedRecord,
        maxPages
      })
      acceptDataset(data)
      setStep(0)
    })
  }

  useEffect(() => {
    api(undefined, 'status')
      .then((data) =>
        setHealth(
          data.connected ? 'ClioX connected' : 'ClioX service is offline'
        )
      )
      .catch((err) => setHealth(err.message))
    if (exploration)
      api()
        .then(acceptDataset)
        .catch((err) => setError(err.message))
  }, [api, exploration])

  const pages = dataset?.pages.filter((page) => pageIds.includes(page.id)) || []
  const spans =
    dataset?.spans.filter((span) => pageIds.includes(span.pageId)) || []
  const reader = dataset?.pages.find((page) => page.id === readerPage)
  const current = dataset?.spans.find(
    (span) => span.id === spanId && span.pageId === readerPage
  )
  const matching =
    located?.query === query &&
    located.pageId === readerPage &&
    located.version === dataset?.version
      ? located.result
      : null
  const readerSpans = spans.filter(
    (span) =>
      span.pageId === readerPage &&
      (!matching || matching.matches.some((match) => match.id === span.id))
  )
  const totalCharacters = pages.reduce(
    (sum, page) => sum + page.textCharacters,
    0
  )
  const allCharacters =
    dataset?.pages.reduce((sum, page) => sum + page.textCharacters, 0) || 1
  const activeLabels = labels.filter((label) =>
    spans.some((span) => span.id === label.spanId)
  )
  const analyzedSpans = spans.filter((span) =>
    activeLabels.some((label) => label.spanId === span.id)
  )
  const analyzedCharacters = coveredCharacters(analyzedSpans)
  const counts = useMemo(
    () =>
      LABELS.map((label) => ({
        label,
        count: activeLabels.filter((row) => row.label === label).length
      })),
    [activeLabels]
  )
  const percent = (part: number, total: number) =>
    total ? `${((100 * part) / total).toFixed(1)}%` : '0%'

  function choosePages(ids: string[]) {
    setPageIds(ids)
    setAnswer(null)
    setAnswerMode('')
    setAnalysisIds((previous) =>
      previous.filter((id) =>
        dataset.spans.some(
          (span) => span.id === id && ids.includes(span.pageId)
        )
      )
    )
    if (!ids.includes(readerPage)) {
      setReaderPage(ids[0] || '')
      setSpanId(dataset.spans.find((span) => span.pageId === ids[0])?.id || '')
    }
  }
  function inspect(span: PublicEvidenceSpan | ReleasedEvidence) {
    setReaderPage(span.pageId)
    setSpanId('sourceSpanId' in span ? span.sourceSpanId : span.id)
    setQuery('')
    setStep(1)
  }
  function toggleAnalysis(id: string) {
    if (analysisIds.includes(id))
      setAnalysisIds(analysisIds.filter((item) => item !== id))
    else if (analysisIds.length < 8) setAnalysisIds([...analysisIds, id])
    else setError('Select at most eight units for this bounded analysis run.')
  }
  async function locate() {
    await run('Locating matching units on the server…', async () => {
      const result = await api({
        action: 'locate',
        query,
        pageIds: [readerPage],
        traceId: dataset.traceId,
        corpusId: dataset.corpusId,
        corpusVersion: dataset.version
      })
      setLocated({
        query,
        pageId: readerPage,
        version: dataset.version,
        result
      })
    })
  }
  async function ask() {
    await run(
      'Searching the selected corpus and reading source evidence…',
      async () => {
        setAnswer(null)
        const result = await api({
          action: 'ask',
          question,
          pageIds,
          traceId: dataset.traceId,
          corpusId: dataset.corpusId,
          corpusVersion: dataset.version
        })
        setAnswer(result)
        setAnswerRunId(result.activity.runId)
        setAnsweredQuestion(question)
        setAnswerMode(
          result.model === 'No model call'
            ? 'Local search · no model call'
            : 'Live model response'
        )
      }
    )
  }
  async function recorded(kind: 'answer' | 'analysis') {
    await run('Loading a recorded service response…', async () => {
      const saved = await api(
        undefined,
        `replay&traceId=${encodeURIComponent(dataset.traceId)}`
      )
      if (saved.corpusVersion !== dataset.version)
        throw new Error('The recording belongs to another corpus version.')
      choosePages(saved.pageIds)
      if (kind === 'answer') {
        const example =
          saved.questions.find(
            (row: { question: string }) => row.question === question
          ) || saved.questions[0]
        setQuestion(example.question)
        setAnswer(example.result)
        setAnswerRunId('')
        setAnsweredQuestion(example.question)
        setAnswerMode(
          `Recorded model response · ${new Date(
            saved.recordedAt
          ).toLocaleString()}`
        )
      } else {
        setLabelRunIds({})
        setReviewRunIds({})
        setLabels(saved.analysis.result.labels)
        setAnalysisIds(saved.analysis.spanIds)
        setAnalysisMode(
          `Recorded model labels · ${new Date(
            saved.recordedAt
          ).toLocaleString()}`
        )
      }
    })
  }
  async function analyze() {
    await run('Classifying the selected source units…', async () => {
      const result = await api({
        action: 'analyze',
        traceId: dataset.traceId,
        corpusId: dataset.corpusId,
        corpusVersion: dataset.version,
        pageIds,
        spanIds: analysisIds
      })
      setLabelRunIds((previous) => ({
        ...previous,
        ...Object.fromEntries(
          result.labels.map((row: BlockLabel) => [
            row.spanId,
            result.activity.runId
          ])
        )
      }))
      setReviewRunIds((previous) =>
        Object.fromEntries(
          Object.entries(previous).filter(([id]) => !analysisIds.includes(id))
        )
      )
      setLabels((previous) => [
        ...previous.filter((label) => !analysisIds.includes(label.spanId)),
        ...result.labels
      ])
      setAnalysisMode(
        `Live model labels · ${new Date(
          result.generatedAt
        ).toLocaleString()} · ${
          result.sessionCleared
            ? 'Session deletion acknowledged'
            : 'Session deletion not confirmed'
        }`
      )
    })
  }
  function amend(id: string, changes: Partial<BlockLabel>) {
    setLabels((previous) =>
      previous.map((row) => (row.spanId === id ? { ...row, ...changes } : row))
    )
  }
  async function review(
    target: { sourceSpanId: string } | { spanId: string },
    decision: 'accepted' | 'rejected' | 'label-changed',
    newLabel?: BlockLabel['label']
  ) {
    const id = 'spanId' in target ? target.spanId : target.sourceSpanId
    const originalRunId = 'spanId' in target ? labelRunIds[id] : answerRunId
    await run('Recording review assertion…', async () => {
      const result = await api({
        action: 'review',
        traceId: dataset.traceId,
        runId: originalRunId,
        target,
        decision,
        ...(newLabel ? { newLabel } : {}),
        reviewer,
        note: reviewNotes[id] || ''
      })
      setReviewRunIds((previous) => ({ ...previous, [id]: result.runId }))
      if ('spanId' in target)
        amend(id, {
          humanReviewed: decision !== 'rejected',
          ...(newLabel ? { label: newLabel, origin: 'manual' } : {})
        })
    })
  }
  async function exportData() {
    const response = await api({
      action: 'export',
      traceId: dataset.traceId
    })
    return response.exportBody
  }

  return (
    <div className={styles.workbench}>
      <header className={styles.hero}>
        <div>
          <p className={styles.brand}>
            <span>ClioX</span>
            <i aria-hidden="true" />
            <span>Europeana</span>
            <span className={styles.brandDot} aria-hidden="true">
              ·
            </span>
            <small>RESEARCH PILOT</small>
          </p>
          <h1>
            Follow the story.
            <br />
            <em>Inspect the evidence.</em>
          </h1>
          <p>
            From historical newspaper OCR to questions, original sources and
            transparent analysis.
          </p>
        </div>
        <aside>
          <span className={styles.pill}>
            {exploration
              ? 'Exploration and Compute-to-Data'
              : 'Compute-to-Data · Europeana'}
          </span>
          <p>
            <strong>{health}</strong>
          </p>
          <small>
            Europeana processing runs with the provider. Sealed results feed a
            server-held corpus. Only bounded results reach this browser.
          </small>
        </aside>
      </header>
      {exploration && (
        <section
          hidden={step !== 0}
          className={styles.panel}
          aria-labelledby="live-import-title"
        >
          <p className={styles.eyebrow}>01 / EXPLORATION MODE</p>
          <p>
            Exploration mode — service API, not Compute-to-Data. Both live
            imports and the saved sample use this mode.
          </p>
          <h2 id="live-import-title">Read newspaper text from Europeana</h2>
          <p>
            Search for a newspaper or paste a known record link. Load a working
            copy of its OCR on the demo server, then ask questions about the
            selected pages.
          </p>
          <SearchSources
            busy={Boolean(busy)}
            onImport={importSource}
            maxPages={maxPages}
            onActivity={addActivity}
          />
          <h3>Load a known record</h3>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              importSource()
            }}
          >
            <div className={styles.readerControls}>
              <label>
                Europeana record URL or ID
                <input
                  value={record}
                  onChange={(event) => setRecord(event.target.value)}
                  maxLength={500}
                  required
                  disabled={Boolean(busy)}
                />
              </label>
              <label>
                Maximum source pages to fetch
                <select
                  value={maxPages}
                  onChange={(event) => setMaxPages(Number(event.target.value))}
                  disabled={Boolean(busy)}
                >
                  {[1, 3, 5, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} pages
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.primary}
                disabled={Boolean(busy) || !record.trim()}
              >
                Fetch live Europeana text
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() =>
                  run('Loading the saved demonstration corpus…', async () =>
                    acceptDataset(await api())
                  )
                }
              >
                Use saved ten-page sample
              </button>
            </div>
          </form>
          <p className={styles.caption}>
            This prototype reads Public Domain / CC0 full text. Original OCR
            stays on the demo server. The browser receives metadata and bounded
            released results. See Data flow & activity for processing and
            retention details.
          </p>
          {dataset && (
            <div className={styles.notice} role="status">
              <strong>
                {dataset.origin === 'live'
                  ? 'LIVE EUROPEANA TEXT'
                  : 'SAVED SAMPLE — not freshly fetched'}
              </strong>
              <p>
                {dataset.pages[0]?.title} · {dataset.pages[0]?.date} ·{' '}
                {dataset.pages[0]?.language}
              </p>
              <p>
                {dataset.pages.length} pages loaded
                {dataset.totalSourcePages
                  ? ` / ${dataset.totalSourcePages} source pages`
                  : ''}{' '}
                · Retrieved {new Date(dataset.retrievedAt).toLocaleString()} ·
                Version {dataset.version}
              </p>
              {dataset.expiresAt && (
                <small>
                  Server access to this working copy expires at{' '}
                  {new Date(dataset.expiresAt).toLocaleTimeString()}, or on
                  restart. Released results and downloaded metadata exports are
                  separate.
                </small>
              )}
              {dataset.warnings?.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
            </div>
          )}
        </section>
      )}
      <section hidden={step !== 0} className={styles.panel}>
        <C2DFlow
          onLoaded={(result) => {
            acceptDataset(result.publicDataset)
            setAggregates(result.aggregates)
            addActivity(result.activity)
            setError('')
          }}
        />
        {dataset?.origin === 'c2d' && (
          <p role="status">
            C2D corpus ready · {dataset.pages.length} pages · server access
            expires {new Date(dataset.expiresAt).toLocaleTimeString()}
          </p>
        )}
      </section>
      {step === 0 && aggregates && <DistantReading aggregates={aggregates} />}
      <nav className={styles.steps} aria-label="Research workflow">
        {STEPS.map((name, index) => (
          <button
            key={name}
            onClick={() => setStep(index)}
            aria-current={step === index ? 'step' : undefined}
          >
            <span>0{index + 1}</span>
            {name}
          </button>
        ))}
      </nav>
      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}
      {busy && (
        <p role="status" className={styles.notice}>
          {busy} This can take a minute.
        </p>
      )}
      {!dataset ? (
        <p>
          {exploration
            ? 'Loading the preserved source corpus…'
            : 'Run a C2D job or load a previous job to begin.'}
        </p>
      ) : (
        <>
          <div className={styles.metrics}>
            <div>
              <strong>
                {pages.length}
                <small> / {dataset.pages.length}</small>
              </strong>
              <span>pages selected</span>
            </div>
            <div>
              <strong>{percent(totalCharacters, allCharacters)}</strong>
              <span>of loaded text selected</span>
            </div>
            <div>
              <strong>{spans.length}</strong>
              <span>source evidence units</span>
            </div>
            <div>
              <strong>{percent(analyzedCharacters, totalCharacters)}</strong>
              <span>selected text analyzed</span>
            </div>
          </div>
          {step === 0 && (
            <section aria-labelledby="corpus-title" className={styles.panel}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>01 / DEFINE THE SCOPE</p>
                  <h2 id="corpus-title">A corpus you can account for</h2>
                  <p>
                    Select from the loaded pages. Every page retains its source,
                    rights and original OCR hash. Original text stays on the
                    server.
                  </p>
                </div>
                <div className={styles.actions}>
                  <button
                    onClick={() => choosePages(dataset.pages.map((p) => p.id))}
                    disabled={Boolean(busy)}
                  >
                    Select all {dataset.pages.length}
                  </button>
                  <button
                    disabled={Boolean(busy)}
                    onClick={() =>
                      choosePages(dataset.pages.slice(0, 3).map((p) => p.id))
                    }
                  >
                    First three loaded pages
                  </button>
                </div>
              </div>
              <div className={styles.pageGrid}>
                {dataset.pages.map((page, index) => (
                  <label
                    key={page.id}
                    className={
                      pageIds.includes(page.id)
                        ? styles.selectedPage
                        : styles.pageCard
                    }
                  >
                    <input
                      type="checkbox"
                      disabled={Boolean(busy)}
                      checked={pageIds.includes(page.id)}
                      onChange={() =>
                        choosePages(
                          pageIds.includes(page.id)
                            ? pageIds.filter((id) => id !== page.id)
                            : [...pageIds, page.id]
                        )
                      }
                    />
                    <span className={styles.pageNumber}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <strong>{page.page}</strong>
                    <span>
                      {page.textCharacters.toLocaleString()} OCR characters
                    </span>
                    <small>
                      {dataset.spans.some(
                        (span) =>
                          span.pageId === page.id &&
                          span.kind === 'layout-block'
                      )
                        ? 'Mapped layout blocks'
                        : 'Exact text windows'}
                    </small>
                  </label>
                ))}
              </div>
              <div className={styles.twoColumns}>
                <div className={styles.note}>
                  <strong>Why scope matters</strong>
                  <p>
                    Selecting pages is different from analyzing them. Coverage
                    here is measured against loaded text, not the entire
                    Europeana collection. One publication date does not
                    establish a trend.
                  </p>
                </div>
                <div className={styles.note}>
                  <strong>Preserved, not silently corrected</strong>
                  <p>
                    Original OCR is retained on the server; source hashes appear
                    here. C2D evidence uses provider chunks assembled on the
                    server; offsets refer to that assembly and overlaps can
                    repeat. A unit is not automatically a complete article.
                  </p>
                  <small>
                    Source acquired:{' '}
                    {new Date(dataset.retrievedAt).toLocaleDateString()} ·
                    Version {dataset.version}
                  </small>
                </div>
              </div>
              <button
                className={styles.primary}
                disabled={!pages.length}
                onClick={() => setStep(1)}
              >
                Explore selected evidence →
              </button>
            </section>
          )}
          {step === 1 && (
            <section aria-labelledby="evidence-title">
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>
                    02 / READ BEFORE INTERPRETING
                  </p>
                  <h2 id="evidence-title">The evidence desk</h2>
                  <p>
                    Select a source unit by page, offsets and character count.
                    Original OCR stays on the server; only released result
                    quotes appear here.
                  </p>
                </div>
                <button onClick={() => setStep(3)}>
                  Analysis basket · {analysisIds.length}/8
                </button>
              </div>
              {!pages.length ? (
                <p>Select at least one page first.</p>
              ) : (
                <>
                  <div className={styles.readerControls}>
                    <label>
                      Source page
                      <select
                        value={readerPage}
                        disabled={Boolean(busy)}
                        onChange={(event) => {
                          setReaderPage(event.target.value)
                          setSpanId(
                            spans.find((s) => s.pageId === event.target.value)
                              ?.id || ''
                          )
                          setQuery('')
                        }}
                      >
                        {pages.map((page) => (
                          <option key={page.id} value={page.id}>
                            {page.page} · {page.textCharacters.toLocaleString()}{' '}
                            characters
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Locate text on this page (server search)
                      <input
                        value={query}
                        maxLength={200}
                        disabled={Boolean(busy)}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Try Ostende, April, Hamburg…"
                      />
                    </label>
                  </div>
                  <button
                    disabled={
                      Boolean(busy) ||
                      query.normalize('NFKC').replace(/\s+/gu, ' ').trim()
                        .length < 3
                    }
                    onClick={locate}
                  >
                    Locate matching units
                  </button>
                  {matching && (
                    <p role="status">
                      {matching.matchCount} matching units
                      {matching.truncated ? ' (first 100 shown)' : ''}. No
                      snippets are returned.
                    </p>
                  )}
                  <div className={styles.readerGrid}>
                    <aside
                      className={styles.unitList}
                      aria-label="Evidence units"
                    >
                      {readerSpans.map((span) => (
                        <button
                          key={span.id}
                          aria-pressed={spanId === span.id}
                          onClick={() => setSpanId(span.id)}
                        >
                          <small>
                            {span.kind === 'layout-block'
                              ? 'Layout block'
                              : 'Text window'}{' '}
                            · {span.start}–{span.end}
                          </small>
                          <span>
                            {span.pageLabel} ·{' '}
                            {span.textCharacters.toLocaleString()} characters
                          </span>
                        </button>
                      ))}
                      {!readerSpans.length && (
                        <p>No units match. Try another OCR term.</p>
                      )}
                    </aside>
                    <article className={styles.sourceText}>
                      <span className={styles.pill}>
                        {current?.kind === 'layout-block'
                          ? 'Original layout block'
                          : 'Original text window'}
                      </span>
                      <h3>{reader?.page} · Source metadata</h3>
                      <p>
                        Original OCR stays on the server. Page:{' '}
                        {reader?.textCharacters.toLocaleString()} characters.
                      </p>
                      {current && (
                        <>
                          <p className={styles.offset}>
                            Characters {current.start}–{current.end} ·{' '}
                            {current.textCharacters.toLocaleString()} characters
                          </p>
                          <button onClick={() => toggleAnalysis(current.id)}>
                            {analysisIds.includes(current.id)
                              ? 'Remove from analysis basket'
                              : 'Add this unit to analysis'}
                          </button>
                          <details>
                            <summary>Source identity and provenance</summary>
                            <p className={styles.break}>{current.id}</p>
                            <a
                              href={reader.source}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Europeana record ↗
                            </a>
                            <p>{reader.attribution}</p>
                            <p>
                              <a
                                href={reader.rights}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Text rights statement ↗
                              </a>
                            </p>
                            <small className={styles.break}>
                              SHA-256: {reader.textSha256}
                            </small>
                          </details>
                        </>
                      )}
                    </article>
                    <article className={styles.scan}>
                      <h3>Public Europeana item</h3>
                      <p>
                        The original OCR and scans are not embedded in this
                        browser. Follow the public item link to consult the
                        source.
                      </p>
                      {reader && (
                        <a
                          href={reader.source}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Europeana item ↗
                        </a>
                      )}
                      <p className={styles.break}>
                        SHA-256: {reader?.textSha256}
                      </p>
                      <small>
                        Local draft output policy: {dataset.outputPolicy.id}.
                        This is an application control, not a data-holder
                        custody guarantee.
                      </small>
                    </article>
                  </div>
                </>
              )}
            </section>
          )}
          {step === 2 && (
            <section aria-labelledby="question-title" className={styles.panel}>
              <p className={styles.eyebrow}>03 / QUESTION WITH SOURCES</p>
              <h2 id="question-title">
                An answer is the beginning of inspection
              </h2>
              <p>
                Ask about the selected {pages.length} pages. Evidence quotations
                are copied from stored OCR using validated source IDs.
              </p>
              <div className={styles.examples}>
                {QUESTIONS.map((text) => (
                  <button key={text} onClick={() => setQuestion(text)}>
                    {text}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  ask()
                }}
              >
                <label>
                  Your question
                  <textarea
                    value={question}
                    maxLength={1500}
                    onChange={(event) => setQuestion(event.target.value)}
                  />
                </label>
                <div className={styles.actions}>
                  <button
                    className={styles.primary}
                    disabled={
                      !LIVE_INFERENCE_AVAILABLE ||
                      Boolean(busy) ||
                      !pages.length ||
                      !question.trim()
                    }
                  >
                    Ask the live ClioX service
                  </button>
                  {exploration && (
                    <button
                      type="button"
                      disabled={Boolean(busy) || dataset.origin !== 'snapshot'}
                      onClick={() => recorded('answer')}
                    >
                      Load recorded example
                    </button>
                  )}
                </div>
              </form>
              <p className={styles.caption}>
                Live mode searches the selected pages locally and uploads up to
                eight candidate OCR units to the existing ClioX RAG service in a
                temporary session. Recorded examples explicitly restore their
                recorded corpus selection.
              </p>
              {answer && (
                <div className={styles.answer}>
                  <span className={styles.pill}>{answerMode}</span>
                  <p>
                    <strong>Question:</strong> {answeredQuestion}
                  </p>
                  <h3>
                    {answer.insufficientEvidence
                      ? 'Insufficient selected evidence'
                      : 'AI summary · requires interpretation review'}
                  </h3>
                  <p>
                    {(answer.answer || '').replace(
                      /\s*\[Source:\s*e\d+\]/g,
                      ''
                    )}
                  </p>
                  <p className={styles.caption}>
                    {answer.candidateCount} candidate units · ClioX service ·{' '}
                    {new Date(answer.generatedAt).toLocaleString()}
                    {answerMode.startsWith('Recorded')
                      ? ' · Historical execution trace unavailable'
                      : ' · See activity for execution and cleanup details'}
                  </p>
                  <div className={styles.evidenceCards}>
                    <label>
                      Reviewer name (self-reported; hash retained)
                      <input
                        maxLength={200}
                        value={reviewer}
                        onChange={(event) => setReviewer(event.target.value)}
                      />
                    </label>
                    {(answer.evidence || []).map((span) => (
                      <article key={span.id}>
                        <strong>
                          {span.pageLabel} · Released quote
                          {span.truncated ? ' (truncated)' : ''}
                        </strong>
                        <blockquote>{span.text}</blockquote>
                        <label>
                          Evidence review note (only hash and length retained)
                          <textarea
                            maxLength={4000}
                            value={reviewNotes[span.sourceSpanId] || ''}
                            onChange={(event) =>
                              setReviewNotes((previous) => ({
                                ...previous,
                                [span.sourceSpanId]: event.target.value
                              }))
                            }
                          />
                        </label>
                        <button
                          disabled={
                            !answerRunId || !reviewer.trim() || Boolean(busy)
                          }
                          onClick={() =>
                            review(
                              { sourceSpanId: span.sourceSpanId },
                              'accepted'
                            )
                          }
                        >
                          Accept evidence
                        </button>
                        <button
                          disabled={
                            !answerRunId || !reviewer.trim() || Boolean(busy)
                          }
                          onClick={() =>
                            review(
                              { sourceSpanId: span.sourceSpanId },
                              'rejected'
                            )
                          }
                        >
                          Reject evidence
                        </button>
                        {reviewRunIds[span.sourceSpanId] && (
                          <p role="status">
                            Review run ID: {reviewRunIds[span.sourceSpanId]}
                          </p>
                        )}
                        {!answerRunId && (
                          <p>
                            Recorded example: no original ask run is available
                            for review.
                          </p>
                        )}
                        <button onClick={() => inspect(span)}>
                          Inspect source metadata →
                        </button>
                      </article>
                    ))}
                  </div>
                  <p className={styles.notice}>
                    Source matching verifies where a quotation came from. It
                    does not verify the model’s translation, historical
                    interpretation or conclusions.
                  </p>
                </div>
              )}
            </section>
          )}
          {step === 3 && (
            <section aria-labelledby="analysis-title">
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>
                    04 / REVIEW BEFORE AGGREGATING
                  </p>
                  <h2 id="analysis-title">Patterns with visible limits</h2>
                  <p>
                    Classify up to eight selected units, inspect the evidence,
                    and record corrections.
                  </p>
                </div>
                <button onClick={() => setStep(1)}>
                  Choose evidence units →
                </button>
              </div>
              <div className={styles.panel}>
                <h3>Analysis basket · {analysisIds.length} units</h3>
                <div className={styles.chips}>
                  {analysisIds.map((id) => {
                    const span = dataset.spans.find((s) => s.id === id)
                    return (
                      <button key={id} onClick={() => toggleAnalysis(id)}>
                        {span.pageLabel} · {span.start}–{span.end} ×
                      </button>
                    )
                  })}
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.primary}
                    disabled={
                      !LIVE_INFERENCE_AVAILABLE ||
                      Boolean(busy) ||
                      !analysisIds.length
                    }
                    onClick={analyze}
                  >
                    Analyze selected units
                  </button>
                  {exploration && (
                    <button
                      disabled={Boolean(busy) || dataset.origin !== 'snapshot'}
                      onClick={() => recorded('analysis')}
                    >
                      Load recorded analysis
                    </button>
                  )}
                </div>
                <p className={styles.caption}>
                  Model labels are hypotheses about expressed tone and its
                  target, not public opinion. New analysis replaces labels for
                  the selected units; export reviewed work before rerunning.
                </p>
              </div>
              <div className={styles.twoColumns}>
                <div className={styles.panel}>
                  <h3>All five states remain visible</h3>
                  {counts.map(({ label, count }) => (
                    <div key={label} className={styles.barRow}>
                      <span>{label}</span>
                      <div>
                        <i
                          style={{
                            width: `${
                              activeLabels.length
                                ? (count / activeLabels.length) * 100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                      <strong>{count}</strong>
                    </div>
                  ))}
                  <p>
                    {activeLabels.length} labeled units ·{' '}
                    {activeLabels.filter((row) => row.humanReviewed).length}{' '}
                    marked reviewed
                    <br />
                    {analyzedCharacters.toLocaleString()} unique source
                    characters · {percent(analyzedCharacters, totalCharacters)}{' '}
                    of selected text
                  </p>
                </div>
                <div className={styles.note}>
                  <h3>What this chart means</h3>
                  <p>
                    Counts describe the selected evidence units. Mixed and
                    uncertain labels remain in the denominator. Overlapping text
                    is counted once for character coverage.
                  </p>
                  <p>
                    This is one issue from one date. Layout blocks and text
                    windows are not a representative sample of articles or
                    readers.
                  </p>
                  <label>
                    Reviewer name (self-reported; only hash exported)
                    <input
                      value={reviewer}
                      onChange={(event) => {
                        setReviewer(event.target.value)
                      }}
                      placeholder="Your name"
                    />
                  </label>
                  <small>
                    Submitted reviews enter an unsigned, process-local journal
                    for up to one hour. Identity is not verified. Notes are
                    hashed, never sent to a model.
                  </small>
                </div>
              </div>
              {analysisMode && <p className={styles.caption}>{analysisMode}</p>}
              <div className={styles.reviewList}>
                {activeLabels.map((row) => {
                  const span = dataset.spans.find((s) => s.id === row.spanId)
                  return (
                    <article key={row.spanId} className={styles.panel}>
                      <div className={styles.sectionHeading}>
                        <h3>
                          {span.pageLabel} · {span.kind} · {span.start}–
                          {span.end}
                        </h3>
                        <button onClick={() => inspect(span)}>
                          Inspect source →
                        </button>
                      </div>
                      <p>
                        {span.textCharacters.toLocaleString()} source characters
                        · Original OCR stays on the server.
                      </p>
                      <div className={styles.readerControls}>
                        <label>
                          Expressed tone
                          <select
                            value={row.label}
                            disabled={
                              !labelRunIds[row.spanId] ||
                              !reviewer.trim() ||
                              Boolean(busy)
                            }
                            onChange={(event) =>
                              review(
                                { spanId: row.spanId },
                                'label-changed',
                                event.target.value as BlockLabel['label']
                              )
                            }
                          >
                            {LABELS.map((label) => (
                              <option key={label}>{label}</option>
                            ))}
                          </select>
                        </label>
                        <p>Tone target: {row.toneTarget}</p>
                      </div>
                      <p>Model explanation: {row.explanation}</p>
                      <label>
                        Review note (only SHA-256 and length retained)
                        <textarea
                          maxLength={4000}
                          value={reviewNotes[row.spanId] || ''}
                          onChange={(event) =>
                            setReviewNotes((previous) => ({
                              ...previous,
                              [row.spanId]: event.target.value
                            }))
                          }
                        />
                      </label>
                      <label className={styles.check}>
                        <input
                          type="checkbox"
                          checked={row.humanReviewed}
                          disabled={
                            !reviewer.trim() ||
                            !labelRunIds[row.spanId] ||
                            Boolean(busy)
                          }
                          onChange={(event) =>
                            review(
                              { spanId: row.spanId },
                              event.target.checked ? 'accepted' : 'rejected'
                            )
                          }
                        />
                        I checked the source and this label (self-reported)
                      </label>
                      <button
                        disabled={
                          !reviewer.trim() ||
                          !labelRunIds[row.spanId] ||
                          Boolean(busy)
                        }
                        onClick={() =>
                          review({ spanId: row.spanId }, 'rejected')
                        }
                      >
                        Reject label
                      </button>
                      {!labelRunIds[row.spanId] && (
                        <p>
                          Recorded examples have no original ask/analyze run to
                          review. Run a new analysis first.
                        </p>
                      )}
                      {reviewRunIds[row.spanId] && (
                        <p role="status">
                          Review run ID: {reviewRunIds[row.spanId]}
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          )}
          {step === 4 && (
            <ActivityPanel records={activities} getExport={exportData} />
          )}
          {step !== 4 && (
            <div className={styles.activityLink}>
              <span>
                {activities.length} recorded operations this visit ·{' '}
                {dataset.origin === 'c2d'
                  ? 'Compute-to-Data corpus'
                  : 'Exploration mode'}
              </span>
              <button onClick={() => setStep(4)}>
                View data flow & activity
              </button>
            </div>
          )}
          <footer className={styles.footer}>
            <span>
              Source: Europeana /{' '}
              {dataset.pages[0]?.attribution || 'See record attribution'}
              <br />
              <small>
                Original OCR retained on server · Source snapshot{' '}
                {new Date(dataset.retrievedAt).toLocaleDateString()}
              </small>
            </span>
            <div className={styles.actions}>
              <a
                href={dataset.pages[0]?.source}
                target="_blank"
                rel="noreferrer"
              >
                Original Europeana record ↗
              </a>
              <JsonExport
                filename="europeana-research-session.json"
                label="Export evidence + activity"
                disabled={!pages.length || Boolean(busy)}
                getValue={exportData}
              />
            </div>
          </footer>
        </>
      )}
    </div>
  )
}
