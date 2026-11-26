import type { CancelToken } from 'axios'
import type { ComputeResultType } from '@oceanprotocol/lib'
import { getOceanNodeAsset } from './aquarius'
import {
  AGROSPAI_NODE,
  OP_SEPOLIA,
  getNodeJobs,
  isNodeJobTerminal
} from './nodeCompute'

export async function getNodeComputeHistory(
  accountId: string,
  assetId?: string,
  cancelToken?: CancelToken
): Promise<ComputeJobMetaData[]> {
  const jobs = await getNodeJobs(accountId)
  const references = jobs
    .map((job) => ({
      job,
      datasets: (Array.isArray(job.inputDID) && job.inputDID.length
        ? job.inputDID
        : Array.isArray(job.metadata?.cliox?.datasetDids)
        ? job.metadata.cliox.datasetDids
        : []
      ).filter((did) => /^did:op:[a-f0-9]{64}$/i.test(did)),
      algorithm: job.algoDID || job.metadata?.cliox?.algorithmDid,
      chainId: Number(job.metadata?.cliox?.chainId || job.payment?.chainId || 0)
    }))
    .filter(
      (entry) =>
        (!entry.chainId || entry.chainId === OP_SEPOLIA) &&
        (!assetId ||
          entry.datasets.includes(assetId) ||
          entry.algorithm === assetId)
    )

  const dids = [...new Set(references.flatMap((entry) => entry.datasets))]
  const assets = new Map<
    string,
    Awaited<ReturnType<typeof getOceanNodeAsset>>
  >()
  await Promise.all(
    dids.map(async (did) => {
      try {
        assets.set(did, await getOceanNodeAsset(did, cancelToken))
      } catch {
        // Missing metadata must not hide a real job or prevent log downloads.
      }
    })
  )

  return references.map(({ job, datasets, algorithm, chainId }) => {
    const asset = assets.get(datasets[0])
    const failed =
      isNodeJobTerminal(job) &&
      typeof job.terminationDetails?.exitCode === 'number' &&
      job.terminationDetails.exitCode !== 0
    return {
      isOceanNodeJob: true,
      providerUrl: AGROSPAI_NODE,
      owner: job.owner,
      jobId: job.jobId,
      dateCreated: job.dateCreated || '0',
      dateFinished: Number(job.dateFinished) > 0 ? job.dateFinished : null,
      status: job.status,
      statusText: failed
        ? `Failed (exit ${job.terminationDetails.exitCode})`
        : job.statusText,
      terminationDetails: job.terminationDetails,
      results: (job.results || []).map((result) => ({
        ...result,
        filename: result.filename || `${result.type}-${result.index}`,
        filesize: result.filesize || 0,
        type: result.type as ComputeResultType
      })),
      inputDID: datasets,
      algoDID: algorithm,
      agreementId: job.agreementId,
      expireTimestamp: 0,
      networkId: chainId || asset?.chainId || 0,
      assetName:
        asset?.metadata?.name ||
        (datasets[0]
          ? datasets[0]
          : `Job ${job.jobId.slice(
              job.jobId.indexOf('-') + 1,
              job.jobId.indexOf('-') + 11
            )}`),
      assetDtSymbol: asset?.datatokens?.[0]?.symbol || ''
    }
  })
}
