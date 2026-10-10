import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount, useSigner } from 'wagmi'
import type { ComputeJob } from '@oceanprotocol/lib'
import {
  c2dStage,
  hasC2DResults,
  ingestC2DJob,
  listC2DJobs,
  loadC2DContext,
  parsePages,
  startC2DJob
} from '@utils/europeana/c2d-browser'
import type { C2DContext } from '@utils/europeana/c2d-browser'
import type { C2DIngestResult } from '@utils/europeana/c2d-types'
import styles from './research.module.css'
import { defaultTermsAndConditionsUrl } from '../../../app.config'

const POLL_ERROR =
  'Provider status is unavailable. Status polling will retry; do not place another order for the same job.'

function ConnectedFlow({
  datasetDid,
  algorithmDid,
  onLoaded
}: {
  datasetDid: string
  algorithmDid: string
  onLoaded: (result: C2DIngestResult) => void
}) {
  const { address } = useAccount()
  const { data: signer } = useSigner()
  const [context, setContext] = useState<C2DContext>()
  const [jobs, setJobs] = useState<ComputeJob[]>([])
  const [pages, setPages] = useState('')
  const [maxPages, setMaxPages] = useState(3)
  const [status, setStatus] = useState(
    'Connect your wallet to run or reload a C2D job.'
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeJob, setActiveJob] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [accepted, setAccepted] = useState(false)
  const attempted = useRef(new Set<string>())
  const request = useRef<AbortController>()
  const loaded = useRef(onLoaded)
  loaded.current = onLoaded

  useEffect(() => {
    const controller = new AbortController()
    request.current?.abort()
    request.current = controller
    setContext(undefined)
    setJobs([])
    setActiveJob('')
    setError('')
    setBusy(false)
    attempted.current.clear()
    if (address && signer) {
      setStatus('Access · locating the Europeana compute assets')
      loadC2DContext({ datasetDid, algorithmDid })
        .then((value) => {
          if (controller.signal.aborted) return
          setContext(value)
          setStatus('Ready to run Compute-to-Data.')
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              'The Europeana compute assets could not be loaded. Check the configured DIDs and provider.'
            )
        })
    }
    return () => controller.abort()
  }, [address, signer, datasetDid, algorithmDid])

  useEffect(() => {
    if (!context || !address) return
    let cancelled = false
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    let failures = 0
    const poll = async () => {
      try {
        const next = await listC2DJobs(
          context,
          { datasetDid, algorithmDid },
          address,
          controller.signal
        )
        if (!cancelled) {
          failures = 0
          setError((current) => (current === POLL_ERROR ? '' : current))
          setJobs(next)
          const active = next.find((job) => job.jobId === activeJob)
          if (active && !attempted.current.has(active.jobId))
            setStatus(c2dStage(active))
        }
      } catch {
        // One failed poll is common; warn only when the provider stays unreachable.
        if (!cancelled && ++failures >= 2) setError(POLL_ERROR)
      }
      if (!cancelled) timer = setTimeout(poll, 10000)
    }
    poll()
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [context, address, datasetDid, algorithmDid, activeJob, refresh])

  const ingest = useCallback(
    async (job: ComputeJob) => {
      if (busy || !signer || !context) return
      const controller = request.current
      setBusy(true)
      setError('')
      setStatus('Ingestion · sign result access, then verify sealed outputs')
      try {
        const result = await ingestC2DJob(
          context,
          { datasetDid, algorithmDid },
          job,
          signer,
          controller.signal
        )
        if (controller.signal.aborted) return
        loaded.current(result)
        setStatus('Ready · C2D corpus available in the Evidence Desk')
      } catch (err) {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error &&
              /^The job must provide exactly one /.test(err.message)
              ? err.message
              : 'C2D results could not be loaded. Check that the job produced all six required files, then retry with this wallet.'
          )
      } finally {
        if (!controller.signal.aborted) setBusy(false)
      }
    },
    [busy, signer, context, datasetDid, algorithmDid]
  )
  useEffect(() => {
    const job = jobs.find(
      (item) => item.jobId === activeJob && hasC2DResults(item)
    )
    if (!job || busy || attempted.current.has(job.jobId)) return
    attempted.current.add(job.jobId)
    ingest(job)
  }, [jobs, activeJob, busy, ingest])

  async function start() {
    if (busy || !context || !signer || !accepted) return
    const controller = request.current
    setBusy(true)
    setError('')
    try {
      const selection = parsePages(pages)
      const job = await startC2DJob(
        context,
        signer,
        selection,
        maxPages,
        (value) => {
          if (!controller.signal.aborted) setStatus(value)
        },
        controller.signal
      )
      if (controller.signal.aborted) return
      setActiveJob(job.jobId)
      setStatus(c2dStage(job))
      setRefresh((value) => value + 1)
    } catch (err) {
      if (!controller.signal.aborted)
        setError(
          'The C2D job could not be started. Check page IDs, wallet network, asset access and wallet approvals. Refresh previous jobs before trying another order.'
        )
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  return (
    <>
      <div className={styles.readerControls}>
        <label>
          Page IDs (optional, comma separated)
          <input
            value={pages}
            onChange={(event) => setPages(event.target.value)}
            disabled={busy}
            maxLength={810}
            placeholder="Leave empty for the first pages"
          />
        </label>
        <label>
          Maximum pages
          <select
            value={maxPages}
            onChange={(event) => setMaxPages(Number(event.target.value))}
            disabled={busy}
          >
            {[1, 3, 5, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        I accept the dataset and algorithm licences and the{' '}
        <a href={defaultTermsAndConditionsUrl} target="_blank" rel="noreferrer">
          Portal terms
        </a>
        . Orders may require wallet transactions and provider fees.
      </label>
      {context && (
        <p>
          Dataset licence: {context.dataset.metadata.license} · Algorithm
          licence: {context.algorithm.metadata.license}
        </p>
      )}
      <div className={styles.actions}>
        <button
          className={styles.primary}
          disabled={
            !context ||
            !signer ||
            busy ||
            !accepted ||
            Boolean(
              activeJob &&
                !jobs.find((job) => job.jobId === activeJob)?.dateFinished
            )
          }
          onClick={start}
        >
          Run C2D job
        </button>
        <button
          disabled={!context || busy}
          onClick={() => setRefresh((value) => value + 1)}
        >
          Refresh jobs
        </button>
      </div>
      <p role="status">
        {!address
          ? 'Connect your wallet using the Portal wallet control.'
          : status}
      </p>
      {activeJob && <p>Job ID: {activeJob}</p>}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <h3>Previous finished jobs</h3>
      <p>
        Only jobs for the configured Europeana dataset, algorithm and connected
        wallet appear here.
      </p>
      <ul>
        {jobs
          .filter((job) => Boolean(job.dateFinished))
          .map((job) => (
            <li key={job.jobId}>
              {job.jobId} · {c2dStage(job)}{' '}
              <button
                disabled={busy || !signer || !hasC2DResults(job)}
                onClick={() => ingest(job)}
              >
                Load sealed results again
              </button>
            </li>
          ))}
      </ul>
    </>
  )
}
export default function C2DFlow({
  onLoaded
}: {
  onLoaded: (result: C2DIngestResult) => void
}) {
  const datasetDid = process.env.NEXT_PUBLIC_EUROPEANA_DATASET_DID
  const algorithmDid = process.env.NEXT_PUBLIC_EUROPEANA_ALGORITHM_DID
  return (
    <>
      <p className={styles.eyebrow}>01 / COMPUTE-TO-DATA</p>
      <h2>Compute-to-Data (Europeana)</h2>
      <p>
        The provider fetches and processes Europeana pages. Sealed chunks are
        opened only by the server; the Evidence Desk releases bounded answers
        and statistics.
      </p>
      {!datasetDid || !algorithmDid ? (
        <>
          <button disabled>Run C2D job</button>
          <p role="status">
            Europeana Compute-to-Data is not configured. The Portal operator
            must configure the Europeana dataset and algorithm DIDs.
          </p>
        </>
      ) : (
        <ConnectedFlow
          datasetDid={datasetDid}
          algorithmDid={algorithmDid}
          onLoaded={onLoaded}
        />
      )}
    </>
  )
}
