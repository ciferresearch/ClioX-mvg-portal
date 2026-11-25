import { ReactElement, useEffect, useState } from 'react'
import { Signer } from 'ethers'
import { useNetwork } from 'wagmi'
import Button from '@shared/atoms/Button'
import {
  AGROSPAI_NODE,
  OP_SEPOLIA,
  NodeEnvironment,
  NodeJob,
  getNodeEnvironments,
  prepareNodeCompute,
  startNodeCompute,
  getNodeJob,
  getNodeJobs,
  getNodeResult,
  stopNodeCompute,
  isNodeJobTerminal,
  isNodeJobSuccessful
} from '@utils/nodeCompute'
import styles from './index.module.css'

export default function NodeCompute({
  asset,
  signer,
  accountId
}: {
  asset: AssetExtended
  signer: Signer
  accountId: string
}): ReactElement {
  const { chain } = useNetwork()
  const [dataset, setDataset] = useState('')
  const [algorithm, setAlgorithm] = useState('')
  const [environments, setEnvironments] = useState<NodeEnvironment[]>([])
  const [environmentId, setEnvironmentId] = useState('')
  const [duration, setDuration] = useState(300)
  const [job, setJob] = useState<NodeJob>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [checked, setChecked] = useState(false)
  const storageKey = `cliox-op-compute:${accountId?.toLowerCase()}`
  const running = job && !isNodeJobTerminal(job)
  const jobId = job?.jobId
  const terminal = job ? isNodeJobTerminal(job) : false
  const room = environments.find((env) => env.id === environmentId)

  useEffect(() => {
    setDataset(asset.metadata.type === 'dataset' ? asset.id : '')
    setAlgorithm(asset.metadata.type === 'algorithm' ? asset.id : '')
    setChecked(false)
  }, [asset.id, asset.metadata.type])

  useEffect(() => {
    let active = true
    getNodeEnvironments()
      .then((envs) => {
        if (!active) return
        setEnvironments(envs)
        setEnvironmentId(envs[0]?.id || '')
        if (envs[0]?.free)
          setDuration(Math.min(300, envs[0].free.maxJobDuration))
        if (!envs.length)
          setError('AgrospAI has no available free compute room.')
      })
      .catch((e) => active && setError(e.message))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setJob(undefined)
    setMessage('')
    if (!accountId) return
    let active = true
    try {
      const jobId = localStorage.getItem(storageKey)
      if (jobId)
        getNodeJob(jobId)
          .then((result) => {
            if (active) setJob(result)
          })
          .catch((e) => active && setError(e.message))
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
    return () => {
      active = false
    }
  }, [accountId, storageKey])

  useEffect(() => {
    if (!jobId || terminal) return
    let active = true
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const current = await getNodeJob(jobId)
        if (active) {
          setJob(current)
          if (isNodeJobTerminal(current)) return
        }
      } catch (e) {
        if (active)
          setError(
            `Status check failed: ${e.message}. The job may still be running; do not submit a duplicate.`
          )
      }
      if (active) timer = setTimeout(poll, 5000)
    }
    timer = setTimeout(poll, 1500)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [jobId, terminal])

  async function recover() {
    setBusy(true)
    setError('')
    try {
      const jobs = await getNodeJobs(accountId)
      if (!jobs.length)
        throw new Error('No AgrospAI compute jobs found for this wallet.')
      setJob(jobs[0])
      try {
        localStorage.setItem(storageKey, jobs[0].jobId)
      } catch {
        /* Optional recovery. */
      }
      setMessage('Loaded the latest compute job for this wallet.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function stop() {
    setBusy(true)
    setError('')
    try {
      await stopNodeCompute(jobId, signer)
      setJob(await getNodeJob(jobId))
      setMessage('Stop requested. Waiting for AgrospAI to confirm termination.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    setChecked(false)
  }, [dataset, algorithm, environmentId, duration])

  async function submit(start: boolean) {
    setBusy(true)
    setError('')
    setMessage('Checking indexed assets, free pricing and encrypted files…')
    try {
      const plan = await prepareNodeCompute(
        dataset.trim(),
        algorithm.trim(),
        environmentId,
        duration
      )
      setChecked(true)
      if (!start) {
        setMessage(
          'File and pricing checks passed. AgrospAI will enforce credentials and algorithm permissions when starting the job.'
        )
        return
      }
      if (!signer || chain?.id !== OP_SEPOLIA)
        throw new Error('Connect your wallet on OP Sepolia.')
      setMessage(
        'Confirm the compute request signature in your wallet. No payment transaction is required for this free room.'
      )
      const submitted = await startNodeCompute(plan, signer)
      setJob(submitted)
      try {
        localStorage.setItem(storageKey, submitted.jobId)
      } catch {
        /* Optional recovery. */
      }
      setMessage('Compute request accepted by AgrospAI.')
    } catch (e) {
      setChecked(false)
      setMessage('')
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function download(index: number, type: string) {
    setBusy(true)
    setError('')
    try {
      const blob = await getNodeResult(job.jobId, index, signer)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}-${index}.${type === 'output' ? 'zip' : 'txt'}`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.compute} aria-label="AgrospAI compute">
      <h3>Compute with AgrospAI</h3>
      <p>
        Run free OP Sepolia assets in AgrospAI’s free compute room. Paid assets
        and paid compute are not available in this flow.
      </p>
      <fieldset disabled={busy || !!running}>
        <label htmlFor="node-dataset">Dataset DID</label>
        <input
          id="node-dataset"
          value={dataset}
          onChange={(e) => setDataset(e.target.value)}
          placeholder="did:op:…"
        />
        <label htmlFor="node-algorithm">Algorithm DID</label>
        <input
          id="node-algorithm"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          placeholder="did:op:…"
        />
        <label htmlFor="node-room">Compute room</label>
        <select
          id="node-room"
          value={environmentId}
          onChange={(e) => setEnvironmentId(e.target.value)}
        >
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.description} — free
            </option>
          ))}
        </select>
        <label htmlFor="node-duration">Maximum runtime (seconds)</label>
        <input
          id="node-duration"
          type="number"
          min={room?.free?.minJobDuration}
          max={room?.free?.maxJobDuration}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
        {room?.free && (
          <p>
            Room limit: {room.free.maxJobDuration} seconds. Provider:{' '}
            <a href={AGROSPAI_NODE} target="_blank" rel="noreferrer">
              AgrospAI Ocean Node
            </a>
            .
          </p>
        )}
      </fieldset>
      <div className={styles.buttons}>
        <Button disabled={busy || !accountId} onClick={recover}>
          Load latest job
        </Button>
        <Button
          disabled={busy || !!running || !dataset || !algorithm || !room}
          onClick={() => submit(false)}
        >
          Check assets
        </Button>
        <Button
          style="primary"
          disabled={
            busy || !!running || !checked || !signer || chain?.id !== OP_SEPOLIA
          }
          onClick={() => submit(true)}
        >
          Start free compute
        </Button>
      </div>
      {!signer && (
        <p>Connect your wallet to start compute and download results.</p>
      )}
      {signer && chain?.id !== OP_SEPOLIA && (
        <p>Switch your wallet to OP Sepolia to start compute.</p>
      )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      {job && (
        <div>
          <p>
            Job: <code className={styles.jobId}>{job.jobId}</code>
          </p>
          <p role="status">
            {job.statusText} ({job.status})
          </p>
          {running && (
            <Button disabled={busy || !signer} onClick={stop}>
              Stop job
            </Button>
          )}
          {isNodeJobTerminal(job) && (
            <p>
              {isNodeJobSuccessful(job)
                ? 'Container completed successfully. Download the output to verify its contents.'
                : `Job did not complete successfully. Exit code: ${
                    job.terminationDetails?.exitCode ?? 'unavailable'
                  }. Check the logs below.`}
            </p>
          )}
          <div className={styles.buttons}>
            {job.results?.map((result) => (
              <Button
                key={result.index}
                disabled={busy || !signer}
                onClick={() => download(result.index, result.type)}
              >
                Download {result.type}
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
