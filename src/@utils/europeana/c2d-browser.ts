import { Datatoken, ProviderInstance } from '@oceanprotocol/lib'
import type {
  ComputeAlgorithm,
  ComputeEnvironment,
  ComputeJob
} from '@oceanprotocol/lib'
import type { Signer } from 'ethers'
import { getAsset } from '@utils/aquarius'
import {
  getAccessDetails,
  getOrderPriceAndFees
} from '@utils/accessDetailsAndPricing'
import { isOrderable } from '@utils/compute'
import { initializeProviderForCompute } from '@utils/provider'
import { handleComputeOrder } from '@utils/order'
import { customProviderUrl } from '../../../app.config'
import type { C2DIngestResult } from './c2d-types'

export interface C2DPair {
  datasetDid: string
  algorithmDid: string
}
export interface C2DContext {
  dataset: AssetExtended
  algorithm: AssetExtended
  providerUrl: string
}
export const C2D_FILES = [
  'chunks.sealed.json',
  'summary.json',
  'aggregates.json',
  'pipeline.jsonl',
  'configure.log',
  'algorithm.log'
] as const
export function parsePages(value: string): string[] {
  if (!value.trim()) return []
  const pages = value.split(',').map((page) => page.trim())
  if (
    pages.length > 10 ||
    new Set(pages).size !== pages.length ||
    pages.some((page) => !/^[a-zA-Z0-9_.-]{1,80}$/.test(page))
  )
    throw new Error(
      'Choose up to 10 distinct Europeana page IDs, separated by commas.'
    )
  return pages
}
export async function loadC2DContext(pair: C2DPair): Promise<C2DContext> {
  const [dataset, algorithm] = await Promise.all([
    getAsset(pair.datasetDid, undefined),
    getAsset(pair.algorithmDid, undefined)
  ])
  if (
    !dataset ||
    !algorithm ||
    dataset.id !== pair.datasetDid ||
    algorithm.id !== pair.algorithmDid ||
    dataset.metadata.type !== 'dataset' ||
    algorithm.metadata.type !== 'algorithm' ||
    dataset.chainId !== algorithm.chainId
  )
    throw new Error(
      'The configured Europeana assets are unavailable or incompatible.'
    )
  // Portal orders hard-code on-chain serviceIndex 0. Never reorder a DDO,
  // which would buy a different service from the one passed to computeStart.
  const service = dataset.services[0]
  if (!service || service.type !== 'compute' || !algorithm.services[0])
    throw new Error('The configured dataset has no Compute-to-Data service.')
  const endpoint = customProviderUrl || service.serviceEndpoint
  const provider = new URL(endpoint)
  if (
    provider.protocol !== 'https:' ||
    provider.username ||
    provider.password ||
    provider.search ||
    provider.hash
  )
    throw new Error('The provider must use an unsigned HTTPS endpoint.')
  return {
    dataset: {
      ...dataset,
      services: [
        { ...service, serviceEndpoint: endpoint },
        ...dataset.services.slice(1)
      ]
    } as AssetExtended,
    algorithm: algorithm as AssetExtended,
    providerUrl: endpoint
  }
}
export function matchesC2DJob(
  job: ComputeJob,
  pair: C2DPair,
  owner: string
): boolean {
  return (
    job.owner?.toLowerCase() === owner.toLowerCase() &&
    job.inputDID?.includes(pair.datasetDid) &&
    job.algoDID === pair.algorithmDid
  )
}
export function hasC2DResults(job: ComputeJob): boolean {
  return Boolean(
    job.dateFinished &&
      job.results?.some(
        (result) => result.filename?.split('/').pop() === 'chunks.sealed.json'
      )
  )
}
export function c2dStage(job: ComputeJob): string {
  if (hasC2DResults(job)) return 'Compute complete · sealed results ready'
  if (job.dateFinished)
    return 'Compute ended · required sealed results unavailable'
  // Ocean C2D codes: 31/32 provisioning failed, 40 running the algorithm,
  // 50/60 filtering and publishing results, 70 finished.
  if (job.status === 31 || job.status === 32)
    return 'Compute job failed · inspect provider status'
  if (job.status >= 50) return 'Ingestion · provider publishing results'
  if (job.status >= 40) return 'Ingestion · provider algorithm running'
  if (job.status >= 10) return 'Access · provider preparing source data'
  return 'Access · compute job queued'
}
export async function listC2DJobs(
  context: C2DContext,
  pair: C2DPair,
  owner: string,
  signal?: AbortSignal
): Promise<ComputeJob[]> {
  const result = await ProviderInstance.computeStatus(
    context.providerUrl,
    owner,
    undefined,
    pair.datasetDid,
    signal
  )
  return (Array.isArray(result) ? result : result ? [result] : []).filter(
    (job) => matchesC2DJob(job, pair, owner)
  )
}
// The provider lists a GPU room first, and that room did not run this
// CPU-only algorithm. Prefer the configured room, then a CPU room with capacity.
export async function chooseComputeEnvironment(
  dataset: AssetExtended
): Promise<ComputeEnvironment | undefined> {
  const listed = await ProviderInstance.getComputeEnvironments(
    dataset.services[0].serviceEndpoint
  )
  const environments: ComputeEnvironment[] = Array.isArray(listed)
    ? listed
    : listed?.[dataset.chainId] || []
  const preferred = process.env.NEXT_PUBLIC_EUROPEANA_COMPUTE_ENV
  return (
    environments.find((env) => preferred && env.id === preferred) ||
    environments.find(
      (env) => !env.gpuNumber && env.currentJobs < env.maxJobs
    ) ||
    environments[0]
  )
}
export async function startC2DJob(
  context: C2DContext,
  signer: Signer,
  pages: string[],
  maxPages: number,
  onStage: (stage: string) => void,
  signal?: AbortSignal
): Promise<ComputeJob> {
  if (
    !Number.isInteger(maxPages) ||
    maxPages < 1 ||
    maxPages > 10 ||
    pages.length > maxPages
  )
    throw new Error('Choose 1–10 pages; maximum must cover selected pages.')
  const owner = await signer.getAddress()
  if ((await signer.getChainId()) !== context.dataset.chainId)
    throw new Error(
      'Switch your wallet to the dataset network before running C2D.'
    )
  onStage('Access · checking dataset and algorithm orders')
  const assetWithAccess = async (
    asset: AssetExtended
  ): Promise<AssetExtended> => ({
    ...asset,
    accessDetails: await getAccessDetails(
      asset.chainId,
      asset.services[0].datatokenAddress,
      asset.services[0].timeout,
      owner
    )
  })
  const [dataset, algorithm] = await Promise.all([
    assetWithAccess(context.dataset),
    assetWithAccess(context.algorithm)
  ])
  if (
    !dataset.accessDetails ||
    !algorithm.accessDetails ||
    [dataset, algorithm].some(
      (asset) => asset.accessDetails.type === 'NOT_SUPPORTED'
    )
  )
    throw new Error('Asset pricing is unavailable.')
  const computeAlgorithm: ComputeAlgorithm = {
    documentId: algorithm.id,
    serviceId: algorithm.services[0].id,
    algocustomdata: { ...(pages.length ? { pages } : {}), maxPages }
  }
  if (
    !(await isOrderable(
      dataset,
      dataset.services[0].id,
      computeAlgorithm,
      algorithm
    ))
  )
    throw new Error('This algorithm cannot run on the configured dataset.')
  const environment = await chooseComputeEnvironment(dataset)
  if (!environment) throw new Error('No compute environment is available.')
  const initialized = await initializeProviderForCompute(
    dataset,
    algorithm,
    owner,
    environment
  )
  if (!initialized?.algorithm || !initialized.datasets?.[0])
    throw new Error('Provider initialization failed.')
  const orderAsset = async (
    asset: AssetExtended,
    initialization: typeof initialized.algorithm
  ) => {
    const fees =
      asset.accessDetails.type === 'fixed' && !initialization.validOrder
        ? await getOrderPriceAndFees(
            asset,
            owner,
            signer,
            initialization.providerFee
          )
        : undefined
    const balance = await new Datatoken(signer).balance(
      asset.services[0].datatokenAddress,
      owner
    )
    if (signal?.aborted) throw new Error('Compute request cancelled.')
    onStage(`Access · approve ${asset.metadata.type} order in your wallet`)
    const tx = await handleComputeOrder(
      signer,
      asset,
      fees,
      owner,
      initialization,
      Number(balance) >= 1,
      environment.consumerAddress
    )
    if (!tx) throw new Error('The compute order was not completed.')
    return tx
  }
  computeAlgorithm.transferTxId = await orderAsset(
    algorithm,
    initialized.algorithm
  )
  const transferTxId = await orderAsset(dataset, initialized.datasets[0])
  if (signal?.aborted) throw new Error('Compute request cancelled.')
  onStage('Access · sign and start the Compute-to-Data job')
  const result = await ProviderInstance.computeStart(
    context.providerUrl,
    signer,
    environment.id,
    { documentId: dataset.id, serviceId: dataset.services[0].id, transferTxId },
    computeAlgorithm,
    signal,
    null,
    { publishAlgorithmLog: true, publishOutput: true }
  )
  const job = (Array.isArray(result) ? result : [result]).find(
    (item) => item?.jobId
  )
  if (!job) throw new Error('Provider did not return a compute job ID.')
  return job
}
async function boundedText(response: Response, limit: number): Promise<string> {
  if (
    !response.ok ||
    Number(response.headers.get('content-length') || 0) > limit
  )
    throw new Error(
      'A required C2D result could not be retrieved within the size limit.'
    )
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Streaming result downloads are unavailable.')
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let total = 0
  let text = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > limit) throw new Error('A C2D result exceeds its size limit.')
      text += decoder.decode(value, { stream: true })
    }
    return text + decoder.decode()
  } finally {
    await reader.cancel()
    reader.releaseLock()
  }
}
export async function ingestC2DJob(
  context: C2DContext,
  pair: C2DPair,
  job: ComputeJob,
  signer: Signer,
  signal?: AbortSignal
): Promise<C2DIngestResult> {
  if (
    !matchesC2DJob(job, pair, await signer.getAddress()) ||
    !hasC2DResults(job)
  )
    throw new Error('Choose a finished job for this wallet and asset pair.')
  const files: Record<string, string> = {}
  // Download only explicitly named public-safe outputs, never arbitrary results.
  const downloads = C2D_FILES.map((filename) => {
    const indices = job.results
      .map((result, i) =>
        result.filename?.split('/').pop() === filename ||
        (filename === 'configure.log' && result.type === 'configrationLog') ||
        (filename === 'algorithm.log' && result.type === 'algorithmLog')
          ? i
          : -1
      )
      .filter((i) => i >= 0)
    if (indices.length !== 1)
      throw new Error(`The job must provide exactly one ${filename}.`)
    return { filename, index: indices[0] }
  })
  for (const { filename, index } of downloads) {
    if (signal?.aborted) throw new Error('Result download cancelled.')
    const url = await ProviderInstance.getComputeResultUrl(
      context.providerUrl,
      signer,
      job.jobId,
      index
    )
    if (new URL(url).protocol !== 'https:')
      throw new Error('C2D result URLs must use HTTPS.')
    files[filename] = await boundedText(
      await fetch(url, {
        signal,
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer'
      }),
      filename === 'chunks.sealed.json' ? 3 * 1024 * 1024 : 64 * 1024
    )
  }
  const response = await fetch('/api/europeana/c2d-ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    signal,
    body: JSON.stringify({
      jobId: job.jobId,
      ...pair,
      providerUrl: context.providerUrl,
      sealed: files['chunks.sealed.json'],
      summary: files['summary.json'],
      aggregates: files['aggregates.json'],
      configureLog: files['configure.log'],
      algorithmLog: files['algorithm.log'],
      pipelineLog: files['pipeline.jsonl']
    })
  })
  const result = await response.json()
  if (!response.ok)
    throw new Error('Sealed C2D results could not be verified by the server.')
  return result
}
