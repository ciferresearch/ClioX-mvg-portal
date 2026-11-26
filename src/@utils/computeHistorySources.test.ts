import { getComputeJobs } from './compute'
import { getNodeComputeHistory } from './nodeComputeHistory'
import { fetchDataForMultipleChains } from './subgraph'

jest.mock('./nodeComputeHistory', () => ({ getNodeComputeHistory: jest.fn() }))
jest.mock('./subgraph', () => ({ fetchDataForMultipleChains: jest.fn() }))
jest.mock('./aquarius', () => ({}))
jest.mock('./provider', () => ({}))
jest.mock('./assetConvertor', () => ({}))
jest.mock('./ddo', () => ({}))
const oldFlag = process.env.NEXT_PUBLIC_ENABLE_OP_SEPOLIA
beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXT_PUBLIC_ENABLE_OP_SEPOLIA = 'true'
})
afterAll(() => {
  if (oldFlag === undefined) delete process.env.NEXT_PUBLIC_ENABLE_OP_SEPOLIA
  else process.env.NEXT_PUBLIC_ENABLE_OP_SEPOLIA = oldFlag
})

test('loads OP Sepolia jobs without querying subgraph orders', async () => {
  ;(getNodeComputeHistory as jest.Mock).mockResolvedValue([
    { jobId: 'engine-job', providerUrl: 'node', dateCreated: '100' }
  ])
  const result = await getComputeJobs([11155420], '0x123')
  expect(result.computeJobs).toHaveLength(1)
  expect(fetchDataForMultipleChains).not.toHaveBeenCalled()
})

test('keeps Node jobs when the legacy subgraph fails', async () => {
  ;(fetchDataForMultipleChains as jest.Mock).mockRejectedValue(
    new Error('legacy unavailable')
  )
  ;(getNodeComputeHistory as jest.Mock).mockResolvedValue([
    { jobId: 'engine-job', dateCreated: '100' }
  ])
  const result = await getComputeJobs([32456, 11155420], '0x123')
  expect(result.computeJobs).toHaveLength(1)
  expect(result.error).toContain('legacy unavailable')
})

test('does not call Node history when the preview integration is disabled', async () => {
  process.env.NEXT_PUBLIC_ENABLE_OP_SEPOLIA = 'false'
  ;(fetchDataForMultipleChains as jest.Mock).mockResolvedValue([])
  await getComputeJobs([32456], '0x123')
  expect(getNodeComputeHistory).not.toHaveBeenCalled()
  expect(fetchDataForMultipleChains).toHaveBeenCalled()
})

test('reports Node history failures rather than pretending there are no jobs', async () => {
  ;(getNodeComputeHistory as jest.Mock).mockRejectedValue(
    new Error('Node unavailable')
  )
  const result = await getComputeJobs([11155420], '0x123')
  expect(result.error).toContain('Node unavailable')
  expect(result.isLoaded).toBe(true)
})
