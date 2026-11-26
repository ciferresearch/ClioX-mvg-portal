import { getNodeComputeHistory } from './nodeComputeHistory'
import { getNodeJobs } from './nodeCompute'
import { getOceanNodeAsset } from './aquarius'

jest.mock('./nodeCompute', () => ({
  ...jest.requireActual('./nodeCompute'),
  getNodeJobs: jest.fn()
}))
jest.mock('./aquarius', () => ({ getOceanNodeAsset: jest.fn() }))
const did = `did:op:${'a'.repeat(64)}`
const owner = '0x123'
beforeEach(() => {
  jest.clearAllMocks()
})

test('keeps historical free jobs with null DIDs and reports a failed exit', async () => {
  ;(getNodeJobs as jest.Mock).mockResolvedValue([
    {
      jobId: 'engine-25035',
      owner,
      status: 71,
      statusText: 'Job settling',
      dateCreated: '100',
      dateFinished: '110',
      inputDID: null,
      algoDID: null,
      terminationDetails: { exitCode: 1 },
      results: [
        {
          index: 3,
          type: 'algorithmLog',
          filename: 'algorithm.log',
          filesize: 20
        }
      ]
    }
  ])
  const jobs = await getNodeComputeHistory(owner)
  expect(jobs).toHaveLength(1)
  expect(jobs[0]).toMatchObject({
    jobId: 'engine-25035',
    isOceanNodeJob: true,
    inputDID: [],
    statusText: 'Failed (exit 1)',
    networkId: 0
  })
  expect(jobs[0].results[0]).toMatchObject({ index: 3 })
  expect(getOceanNodeAsset).not.toHaveBeenCalled()
})

test('enriches references through ClioX once per dataset and retains jobs when metadata is unavailable', async () => {
  ;(getNodeJobs as jest.Mock).mockResolvedValue(
    [1, 2].map((i) => ({
      jobId: `engine-${i}`,
      owner,
      status: 40,
      statusText: 'Running',
      metadata: {
        clioxChainId: 11155420,
        clioxDatasetDids: did,
        clioxAlgorithmDid: 'did:op:algorithm'
      }
    }))
  )
  ;(getOceanNodeAsset as jest.Mock).mockRejectedValue(new Error('not indexed'))
  const jobs = await getNodeComputeHistory(owner)
  expect(jobs).toHaveLength(2)
  expect(jobs[0]).toMatchObject({
    inputDID: [did],
    networkId: 11155420,
    assetName: did
  })
  expect(getOceanNodeAsset).toHaveBeenCalledTimes(1)
})

test('does not attribute an unreferenced job to an arbitrary asset', async () => {
  ;(getNodeJobs as jest.Mock).mockResolvedValue([
    { jobId: 'engine-unknown', owner, status: 71 }
  ])
  await expect(getNodeComputeHistory(owner, did)).resolves.toEqual([])
})

test('respects a reported chain and keeps jobs whose network is not reported', async () => {
  ;(getNodeJobs as jest.Mock).mockResolvedValue([
    {
      jobId: 'engine-other',
      owner,
      metadata: { cliox: { chainId: 11155111 } }
    },
    { jobId: 'engine-unknown', owner }
  ])
  const jobs = await getNodeComputeHistory(owner)
  expect(jobs.map((job) => job.jobId)).toEqual(['engine-unknown'])
})
