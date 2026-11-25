import { Wallet } from 'ethers'
import {
  AGROSPAI_NODE,
  getNodeComputeAsset,
  prepareNodeCompute,
  startNodeCompute,
  getNodeJob,
  getNodeResult,
  isNodeJobSuccessful
} from './nodeCompute'

const datasetDid = `did:op:${'a'.repeat(64)}`
const algorithmDid = `did:op:${'b'.repeat(64)}`
const address = '0x1234567890123456789012345678901234567890'
const environment = {
  id: 'engine-room',
  description: 'Test room',
  features: { computeJobs: true },
  free: {
    maxJobs: 1,
    minJobDuration: 10,
    maxJobDuration: 600,
    resources: [
      { id: 'cpu', min: 1, max: 1 },
      { id: 'ram', min: 1, max: 1 },
      { id: 'disk', min: 0, max: 2 }
    ]
  }
}
function asset(type: string) {
  return {
    id: type === 'dataset' ? datasetDid : algorithmDid,
    chainId: 11155420,
    metadata: { name: type, type },
    services: [
      {
        id: type,
        type: 'compute',
        serviceEndpoint: AGROSPAI_NODE,
        datatokenAddress: address,
        compute: { publisherTrustedAlgorithmPublishers: [address] }
      }
    ],
    indexedMetadata: {
      nft: { state: 0 },
      stats: [
        {
          datatokenAddress: address,
          prices: [{ type: 'dispenser', price: '0' }]
        }
      ]
    }
  }
}
const fetchMock = jest.fn()
const originalFetch = global.fetch
beforeEach(() => {
  global.fetch = fetchMock
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string) => ({
    ok: true,
    json: async () =>
      url.includes('/assets/ddo/')
        ? asset(
            decodeURIComponent(url).includes(datasetDid)
              ? 'dataset'
              : 'algorithm'
          )
        : url.includes('computeEnvironments')
        ? [environment]
        : [{ valid: true }]
  }))
})
afterAll(() => {
  global.fetch = originalFetch
})

test('prepares published DID references and free room resources without legacy order transactions', async () => {
  const plan = await prepareNodeCompute(
    datasetDid,
    algorithmDid,
    environment.id,
    60
  )
  expect(plan.datasets).toEqual([
    { documentId: datasetDid, serviceId: 'dataset' }
  ])
  expect(plan.algorithm).toEqual({
    documentId: algorithmDid,
    serviceId: 'algorithm'
  })
  expect(plan.resources).toContainEqual({ id: 'cpu', amount: 1 })
  expect(
    fetchMock.mock.calls.filter(([url]) => url.endsWith('/fileInfo'))
  ).toHaveLength(2)
})

test('rejects missing indexes before starting a job', async () => {
  fetchMock.mockResolvedValueOnce({
    ok: false,
    status: 404,
    text: async () => 'DDO not found'
  })
  await expect(
    prepareNodeCompute(datasetDid, algorithmDid, environment.id, 60)
  ).rejects.toThrow('DDO not found')
  expect(
    fetchMock.mock.calls.some(([url]) => url.endsWith('/freeCompute'))
  ).toBe(false)
})

test('blocks an empty download even when the Node incorrectly reports valid:true', async () => {
  const original = fetchMock.getMockImplementation()
  fetchMock.mockImplementation((url, ...args) =>
    url.endsWith('/fileInfo')
      ? Promise.resolve({
          ok: true,
          json: async () => [
            {
              valid: true,
              contentLength: '0',
              checksum:
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
            }
          ]
        })
      : original(url, ...args)
  )
  await expect(
    prepareNodeCompute(datasetDid, algorithmDid, environment.id, 60)
  ).rejects.toThrow('zero bytes')
  expect(
    fetchMock.mock.calls.some(([url]) => url.endsWith('/freeCompute'))
  ).toBe(false)
})

test('does not consume assets with unknown or paid pricing through freeCompute', async () => {
  const paid = asset('dataset')
  paid.indexedMetadata.stats[0].prices = [{ type: 'fixedrate', price: '1' }]
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => paid })
  await expect(
    prepareNodeCompute(datasetDid, algorithmDid, environment.id, 60)
  ).rejects.toThrow('free asset pricing could not be verified')
})

test('rejects datasets without trusted algorithms or publishers', async () => {
  const untrusted = asset('dataset')
  untrusted.services[0].compute.publisherTrustedAlgorithmPublishers = []
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => untrusted })
  await expect(
    prepareNodeCompute(datasetDid, algorithmDid, environment.id, 60)
  ).rejects.toThrow('no trusted algorithms')
})

test('rejects durations outside the room limits', async () => {
  await expect(
    prepareNodeCompute(datasetDid, algorithmDid, environment.id, 601)
  ).rejects.toThrow('between 10 and 600')
})

test('rejects assets served by another provider', async () => {
  const wrong = asset('dataset')
  wrong.services[0].serviceEndpoint = 'https://other.example'
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => wrong })
  await expect(getNodeComputeAsset(datasetDid)).rejects.toThrow(
    'served by AgrospAI'
  )
})

test('submits the deployed Node signature and payload and never calls legacy computeStart', async () => {
  const plan = await prepareNodeCompute(
    datasetDid,
    algorithmDid,
    environment.id,
    60
  )
  const wallet = Wallet.createRandom()
  wallet.getChainId = jest.fn().mockResolvedValue(11155420)
  const job = { jobId: 'engine-job', status: 1, statusText: 'Queued' }
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [job] })
  await expect(startNodeCompute(plan, wallet)).resolves.toEqual(job)
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
  expect(url).toBe(`${AGROSPAI_NODE}/api/services/freeCompute`)
  const body = JSON.parse(init.body)
  const { utils } = await import('ethers')
  const digest = utils.keccak256(
    utils.toUtf8Bytes(`${wallet.address}${body.nonce}freeStartCompute`)
  )
  expect(utils.verifyMessage(utils.arrayify(digest), body.signature)).toBe(
    wallet.address
  )
  expect(body.datasets).toEqual(plan.datasets)
  expect(body.payment).toBeUndefined()
})

test('rejects the wrong wallet network before signing or submitting', async () => {
  const wallet = Wallet.createRandom()
  wallet.getChainId = jest.fn().mockResolvedValue(32456)
  const sign = jest.spyOn(wallet, 'signMessage')
  await expect(startNodeCompute({} as never, wallet)).rejects.toThrow(
    'Switch your wallet'
  )
  expect(sign).not.toHaveBeenCalled()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('polls by job ID without repeated wallet prompts and authorizes downloads separately', async () => {
  const job = {
    jobId: 'engine-job',
    status: 70,
    statusText: 'Finished',
    terminationDetails: { exitCode: 0 }
  }
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [job] })
  await expect(getNodeJob(job.jobId)).resolves.toEqual(job)
  expect(fetchMock.mock.calls[0][0]).toContain('includeMetrics=false')
  const blob = new Blob(['output'])
  fetchMock.mockResolvedValueOnce({ ok: true, blob: async () => blob })
  await expect(
    getNodeResult(job.jobId, 0, Wallet.createRandom())
  ).resolves.toBe(blob)
  expect(fetchMock.mock.calls[1][0]).toContain('index=0')
  expect(fetchMock.mock.calls[1][0]).toContain('signature=')
  expect(isNodeJobSuccessful(job)).toBe(true)
  expect(
    isNodeJobSuccessful({ ...job, terminationDetails: { exitCode: 1 } })
  ).toBe(false)
})

test('preserves the routed ID when the Node returns an engine-local job ID', async () => {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => [{ jobId: 'local-id', status: 1 }]
  })
  await expect(getNodeJob('engine-local-id')).resolves.toMatchObject({
    jobId: 'engine-local-id'
  })
})
