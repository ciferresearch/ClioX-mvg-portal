import { Signer, utils } from 'ethers'
import { assertNodeFileInfo } from './nodeFileInfo'

export const AGROSPAI_NODE = 'https://ocean-node.agrospai.udl.cat'
export const OP_SEPOLIA = 11155420

export interface NodeComputeService {
  id: string
  type: string
  serviceEndpoint: string
  datatokenAddress: string
  files?: string
  compute?: {
    publisherTrustedAlgorithms?: {
      did: string
      filesChecksum: string
      containerSectionChecksum: string
    }[]
    publisherTrustedAlgorithmPublishers?: string[]
  }
}

export interface NodeComputeAsset {
  id: string
  chainId: number
  metadata: {
    type: string
    name: string
    algorithm?: {
      container: {
        entrypoint: string
        checksum: string
        image?: string
        tag?: string
      }
    }
  }
  services: NodeComputeService[]
  indexedMetadata?: {
    nft?: { state: number; owner?: string }
    stats?: {
      datatokenAddress: string
      prices?: { type: string; price: string }[]
    }[]
  }
}

export interface NodeEnvironment {
  id: string
  description: string
  features?: { computeJobs?: boolean }
  fees?: Record<string, unknown[]>
  free?: {
    maxJobs: number
    minJobDuration: number
    maxJobDuration: number
    access?: { addresses?: string[]; accessLists?: unknown }
    resources: { id: string; min: number; max: number }[]
  }
}

export interface NodeJob {
  jobId: string
  status: number
  statusText: string
  owner?: string
  environment?: string
  dateCreated?: string
  terminationDetails?: { exitCode?: number }
  results?: { index: number; type: string }[]
}

const failures = [2, 11, 13, 14, 21, 22, 31, 32, 33, 41, 42, 61, 62]
export const isNodeJobTerminal = (job: NodeJob): boolean =>
  [...failures, 70, 71].includes(job.status)
export const isNodeJobSuccessful = (job: NodeJob): boolean =>
  [70, 71].includes(job.status) && job.terminationDetails?.exitCode === 0

async function request(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 45000)
  try {
    const response = await fetch(`${AGROSPAI_NODE}${path}`, {
      ...init,
      signal: controller.signal
    })
    if (!response.ok)
      throw new Error(`AgrospAI (${response.status}): ${await response.text()}`)
    return response
  } finally {
    clearTimeout(timer)
  }
}

export async function getNodeEnvironments(): Promise<NodeEnvironment[]> {
  const result = await (
    await request(`/api/services/computeEnvironments?chainId=${OP_SEPOLIA}`)
  ).json()
  if (!Array.isArray(result))
    throw new Error('Invalid compute environment response')
  return result.filter(
    (env: NodeEnvironment) =>
      env.features?.computeJobs !== false && env.free?.maxJobs > 0
  )
}

export function computeService(asset: NodeComputeAsset): NodeComputeService {
  const service = asset.services?.find((item) => item.type === 'compute')
  if (
    asset.chainId !== OP_SEPOLIA ||
    !service ||
    service.serviceEndpoint.replace(/\/$/, '') !== AGROSPAI_NODE
  )
    throw new Error(
      `${asset.id}: select an OP Sepolia compute asset served by AgrospAI.`
    )
  return service
}

export async function getNodeComputeAsset(
  did: string
): Promise<NodeComputeAsset> {
  if (!/^did:op:[a-f0-9]{64}$/i.test(did))
    throw new Error('Enter a complete asset DID.')
  try {
    const asset = await (
      await request(`/api/aquarius/assets/ddo/${encodeURIComponent(did)}`)
    ).json()
    computeService(asset)
    return asset
  } catch (e) {
    throw new Error(`${did}: ${e.message}`)
  }
}

function requireFreeAsset(asset: NodeComputeAsset): void {
  const service = computeService(asset)
  const prices = asset.indexedMetadata?.stats?.find(
    (stat) =>
      stat.datatokenAddress.toLowerCase() ===
      service.datatokenAddress.toLowerCase()
  )?.prices
  // Never interpret missing pricing as permission to consume a paid asset for free.
  if (
    !prices?.some(
      (price) => price.type === 'dispenser' && Number(price.price) === 0
    )
  )
    throw new Error(
      `${asset.id}: free asset pricing could not be verified. Paid asset ordering is not supported by this free room flow.`
    )
  if (![0, 4].includes(asset.indexedMetadata?.nft?.state))
    throw new Error(`${asset.id}: asset is not available for consumption.`)
}

export interface NodeComputePlan {
  environment: string
  maxJobDuration: number
  queueMaxWaitTime: number
  resources: { id: string; amount: number }[]
  datasets: { documentId: string; serviceId: string }[]
  algorithm: { documentId: string; serviceId: string }
}

export async function prepareNodeCompute(
  datasetDid: string,
  algorithmDid: string,
  environmentId: string,
  duration: number
): Promise<NodeComputePlan> {
  const [dataset, algorithm, environments] = await Promise.all([
    getNodeComputeAsset(datasetDid),
    getNodeComputeAsset(algorithmDid),
    getNodeEnvironments()
  ])
  if (
    dataset.metadata.type !== 'dataset' ||
    algorithm.metadata.type !== 'algorithm'
  )
    throw new Error(
      'Select a dataset DID and an algorithm DID in the corresponding fields.'
    )
  requireFreeAsset(dataset)
  requireFreeAsset(algorithm)
  const environment = environments.find((env) => env.id === environmentId)
  if (!environment?.free)
    throw new Error('The selected free compute room is unavailable.')
  if (
    !Number.isInteger(duration) ||
    duration < environment.free.minJobDuration ||
    duration > environment.free.maxJobDuration
  )
    throw new Error(
      `Duration must be between ${environment.free.minJobDuration} and ${environment.free.maxJobDuration} seconds.`
    )

  const datasetService = computeService(dataset)
  const algorithmService = computeService(algorithm)
  // A missing index entry or undecryptable file must fail before asking for a signature.
  await Promise.all(
    [dataset, algorithm].map(async (asset) => {
      const response = await request('/api/services/fileInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did: asset.id,
          serviceId: computeService(asset).id,
          checksum: true
        })
      })
      const files = await response.json()
      try {
        assertNodeFileInfo(files)
      } catch (e) {
        throw new Error(`${asset.id}: ${e.message}`)
      }
    })
  )
  const trusted = datasetService.compute
  if (
    !trusted?.publisherTrustedAlgorithms?.length &&
    !trusted?.publisherTrustedAlgorithmPublishers?.length
  )
    throw new Error(
      'This dataset has no trusted algorithms or publishers. AgrospAI denies computation by default; the dataset publisher must configure algorithm access.'
    )

  return {
    environment: environment.id,
    maxJobDuration: duration,
    queueMaxWaitTime: 0,
    resources: environment.free.resources.map((resource) => ({
      id: resource.id,
      amount: Math.max(resource.min, Math.min(1, resource.max))
    })),
    datasets: [{ documentId: dataset.id, serviceId: datasetService.id }],
    algorithm: { documentId: algorithm.id, serviceId: algorithmService.id }
  }
}

async function signedCommand(signer: Signer, command: string) {
  const consumerAddress = await signer.getAddress()
  const nonce = Date.now().toString()
  // This is the signature contract of the deployed AgrospAI OE Node.
  const digest = utils.keccak256(
    utils.toUtf8Bytes(`${consumerAddress}${nonce}${command}`)
  )
  return {
    consumerAddress,
    nonce,
    signature: await signer.signMessage(utils.arrayify(digest))
  }
}

export async function startNodeCompute(
  plan: NodeComputePlan,
  signer: Signer
): Promise<NodeJob> {
  if ((await signer.getChainId()) !== OP_SEPOLIA)
    throw new Error('Switch your wallet to OP Sepolia before starting compute.')
  const result = await (
    await request('/api/services/freeCompute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...plan,
        ...(await signedCommand(signer, 'freeStartCompute'))
      })
    })
  ).json()
  const job = Array.isArray(result) ? result[0] : result
  if (!job?.jobId)
    throw new Error(
      'AgrospAI did not return a job ID. Check job history before resubmitting.'
    )
  return job
}

export async function getNodeJob(jobId: string): Promise<NodeJob> {
  // Job-ID status polling requires no wallet prompt. Download authorization is separate.
  const result = await (
    await request(
      `/api/services/compute?${new URLSearchParams({
        jobId,
        includeMetrics: 'false'
      })}`
    )
  ).json()
  const shortId = jobId.slice(jobId.indexOf('-') + 1)
  const job = Array.isArray(result)
    ? result.find((entry) => entry.jobId === jobId || entry.jobId === shortId)
    : result
  if (!job?.jobId) throw new Error('The compute job was not found.')
  // Status returns the engine-local ID; result/stop routes need the full routed ID.
  return { ...job, jobId }
}

export async function getNodeJobs(consumerAddress: string): Promise<NodeJob[]> {
  const result = await (
    await request(
      `/api/services/compute?${new URLSearchParams({
        consumerAddress,
        includeMetrics: 'false'
      })}`
    )
  ).json()
  if (!Array.isArray(result))
    throw new Error('Invalid compute history response.')
  return result
    .filter(
      (job: NodeJob) =>
        job.owner?.toLowerCase() === consumerAddress.toLowerCase() &&
        (job.jobId?.includes('-') || job.environment?.includes('-'))
    )
    .map((job: NodeJob) => ({
      ...job,
      jobId: job.jobId.includes('-')
        ? job.jobId
        : `${job.environment.split('-')[0]}-${job.jobId}`
    }))
    .sort((a, b) => Number(b.dateCreated) - Number(a.dateCreated))
}

export async function getNodeResult(
  jobId: string,
  index: number,
  signer: Signer
): Promise<Blob> {
  const query = new URLSearchParams({
    jobId,
    index: String(index),
    ...(await signedCommand(signer, 'getComputeResult'))
  })
  return (await request(`/api/services/computeResult?${query}`)).blob()
}

export async function stopNodeCompute(
  jobId: string,
  signer: Signer
): Promise<void> {
  const query = new URLSearchParams({
    jobId,
    ...(await signedCommand(signer, 'stopCompute'))
  })
  await request(`/api/services/compute?${query}`, { method: 'PUT' })
}
