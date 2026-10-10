/** @jest-environment node */
import type { ComputeJob } from '@oceanprotocol/lib'
import { ProviderInstance } from '@oceanprotocol/lib'
import type { Signer } from 'ethers'
import { handleComputeOrder } from '@utils/order'
import { getAsset } from '@utils/aquarius'
import {
  c2dStage,
  chooseComputeEnvironment,
  C2D_FILES,
  ingestC2DJob,
  listC2DJobs,
  loadC2DContext,
  parsePages,
  startC2DJob
} from './c2d-browser'

jest.mock('@oceanprotocol/lib', () => ({
  ProviderInstance: {
    computeStatus: jest.fn(),
    computeStart: jest.fn(),
    getComputeResultUrl: jest.fn(),
    getComputeEnvironments: jest.fn(async () => [
      { id: 'gpu-room', gpuNumber: 1, currentJobs: 0, maxJobs: 2 },
      {
        id: 'env1',
        gpuNumber: 0,
        currentJobs: 0,
        maxJobs: 3,
        consumerAddress: '0xENV'
      }
    ])
  },
  Datatoken: jest
    .fn()
    .mockImplementation(() => ({ balance: jest.fn().mockResolvedValue('1') }))
}))
jest.mock('@utils/aquarius', () => ({
  getAsset: jest.fn(async (id: string) => ({
    id,
    chainId: 8996,
    metadata: { type: id === 'did:op:dataset' ? 'dataset' : 'algorithm' },
    services: [
      {
        id: 'service1',
        type: 'compute',
        serviceEndpoint: 'https://provider.example',
        datatokenAddress: '0xDT',
        timeout: 1000
      }
    ]
  }))
}))
jest.mock('@utils/accessDetailsAndPricing', () => ({
  getAccessDetails: jest.fn(async () => ({ type: 'free' })),
  getOrderPriceAndFees: jest.fn(async () => ({ price: '0' }))
}))
jest.mock('@utils/compute', () => ({
  isOrderable: jest.fn(async () => true)
}))
jest.mock('@utils/provider', () => ({
  initializeProviderForCompute: jest.fn(async () => ({
    algorithm: { providerFee: {} },
    datasets: [{ providerFee: {} }]
  }))
}))
jest.mock('@utils/order', () => ({
  handleComputeOrder: jest.fn(async () => '0xorder')
}))
const pair = { datasetDid: 'did:op:dataset', algorithmDid: 'did:op:algorithm' }
const signer = {
  getAddress: async () => '0xowner',
  getChainId: async () => 8996
} as Signer
const job = {
  jobId: 'job1',
  owner: '0xowner',
  inputDID: [pair.datasetDid],
  algoDID: pair.algorithmDid,
  dateFinished: '123',
  status: 31,
  results: C2D_FILES.map((filename) => ({
    filename,
    type:
      filename === 'configure.log'
        ? 'configrationLog'
        : filename === 'algorithm.log'
        ? 'algorithmLog'
        : 'output',
    filesize: 10
  }))
} as ComputeJob
beforeEach(() => {
  jest.clearAllMocks()
  ;(ProviderInstance.computeStart as jest.Mock).mockResolvedValue({
    ...job,
    dateFinished: null,
    results: []
  })
  ;(ProviderInstance.computeStatus as jest.Mock).mockResolvedValue([job])
  ;(ProviderInstance.getComputeResultUrl as jest.Mock).mockImplementation(
    async (_provider, _signer, _job, index) =>
      `https://provider.example/result/${index}?signature=TEST`
  )
})
it('orders algorithm and dataset then passes page consumer parameters to computeStart', async () => {
  const context = await loadC2DContext(pair)
  const stages: string[] = []
  await startC2DJob(context, signer, ['page1'], 3, (stage) =>
    stages.push(stage)
  )
  expect(handleComputeOrder).toHaveBeenCalledTimes(2)
  expect(
    (handleComputeOrder as jest.Mock).mock.calls.map((call) => call[1].id)
  ).toEqual([pair.algorithmDid, pair.datasetDid])
  expect(ProviderInstance.computeStart).toHaveBeenCalledWith(
    context.providerUrl,
    signer,
    'env1',
    expect.objectContaining({
      documentId: pair.datasetDid,
      transferTxId: '0xorder'
    }),
    expect.objectContaining({
      documentId: pair.algorithmDid,
      algocustomdata: { pages: ['page1'], maxPages: 3 },
      transferTxId: '0xorder'
    }),
    undefined,
    null,
    { publishAlgorithmLog: true, publishOutput: true }
  )
  expect(stages).toContain('Access · sign and start the Compute-to-Data job')
})
it('skips the GPU room for a CPU room unless an environment is configured', async () => {
  const context = await loadC2DContext(pair)
  expect((await chooseComputeEnvironment(context.dataset))?.id).toBe('env1')
  process.env.NEXT_PUBLIC_EUROPEANA_COMPUTE_ENV = 'gpu-room'
  try {
    expect((await chooseComputeEnvironment(context.dataset))?.id).toBe(
      'gpu-room'
    )
  } finally {
    delete process.env.NEXT_PUBLIC_EUROPEANA_COMPUTE_ENV
  }
})
it('maps provider status codes without calling a running job failed', () => {
  const at = (status: number) => c2dStage({ status } as ComputeJob)
  expect(at(1)).toContain('queued')
  expect(at(20)).toContain('preparing')
  expect(at(40)).toContain('algorithm running')
  expect(at(50)).toContain('publishing results')
  expect(at(60)).toContain('publishing results')
  expect(at(31)).toContain('failed')
  expect(at(32)).toContain('failed')
})
it('filters provider job history by owner, dataset and algorithm', async () => {
  ;(ProviderInstance.computeStatus as jest.Mock).mockResolvedValue([
    job,
    { ...job, algoDID: 'did:op:other' },
    { ...job, owner: '0xother' },
    { ...job, inputDID: ['did:op:other'] }
  ])
  expect(
    await listC2DJobs(await loadC2DContext(pair), pair, '0xowner')
  ).toEqual([job])
  expect(c2dStage(job)).toContain('sealed results ready')
})
it('fetches only the six signed outputs in the browser and posts exact file bytes to ingestion', async () => {
  const fetchMock = jest.fn(async (url: string) =>
    url.startsWith('/api/')
      ? { ok: true, json: async () => ({ traceId: 'trace1' }) }
      : new Response(`file:${new URL(url).pathname.split('/').pop()}`)
  )
  global.fetch = fetchMock as unknown as typeof fetch
  const result = await ingestC2DJob(
    await loadC2DContext(pair),
    pair,
    job,
    signer
  )
  expect(result.traceId).toBe('trace1')
  expect(ProviderInstance.getComputeResultUrl).toHaveBeenCalledTimes(6)
  const posted = JSON.parse(
    (fetchMock.mock.calls[6] as unknown as [string, RequestInit])[1]
      .body as string
  )
  expect(posted).toMatchObject({
    ...pair,
    sealed: 'file:0',
    summary: 'file:1',
    aggregates: 'file:2',
    pipelineLog: 'file:3',
    configureLog: 'file:4',
    algorithmLog: 'file:5'
  })
  expect(JSON.stringify(posted)).not.toContain('signature=')
})
it('rejects missing results, foreign jobs, oversize downloads and invalid page selections', async () => {
  const context = await loadC2DContext(pair)
  await expect(
    ingestC2DJob(context, pair, { ...job, owner: 'other' }, signer)
  ).rejects.toThrow('Choose a finished job')
  await expect(
    ingestC2DJob(
      context,
      pair,
      {
        ...job,
        results: job.results.filter(
          (file) => file.filename !== 'aggregates.json'
        )
      },
      signer
    )
  ).rejects.toThrow()
  global.fetch = jest.fn(
    async () =>
      new Response('x', {
        headers: { 'content-length': String(5 * 1024 * 1024) }
      })
  ) as unknown as typeof fetch
  await expect(ingestC2DJob(context, pair, job, signer)).rejects.toThrow(
    'size limit'
  )
  expect(parsePages(' p1, p2 ')).toEqual(['p1', 'p2'])
  expect(parsePages('')).toEqual([])
  expect(() => parsePages('p1,p1')).toThrow()
  expect(() => parsePages('p1,../secret')).toThrow()
})
it('rejects the wrong wallet network before orders', async () => {
  await expect(
    startC2DJob(
      await loadC2DContext(pair),
      { ...signer, getChainId: async () => 1 } as Signer,
      [],
      3,
      jest.fn()
    )
  ).rejects.toThrow('Switch your wallet')
  expect(handleComputeOrder).not.toHaveBeenCalled()
})

it('never reorders a nonzero compute service into a service-index-zero purchase', async () => {
  ;(getAsset as jest.Mock).mockResolvedValueOnce({
    id: pair.datasetDid,
    chainId: 8996,
    metadata: { type: 'dataset' },
    services: [
      { id: 'download', type: 'access' },
      {
        id: 'compute',
        type: 'compute',
        serviceEndpoint: 'https://provider.example'
      }
    ]
  })
  await expect(loadC2DContext(pair)).rejects.toThrow(
    'no Compute-to-Data service'
  )
  expect(handleComputeOrder).not.toHaveBeenCalled()
})
it('checks every required output before requesting any wallet result signature', async () => {
  await expect(
    ingestC2DJob(
      await loadC2DContext(pair),
      pair,
      {
        ...job,
        results: job.results.filter(
          (file) => file.filename !== 'aggregates.json'
        )
      },
      signer
    )
  ).rejects.toThrow('exactly one aggregates.json')
  expect(ProviderInstance.getComputeResultUrl).not.toHaveBeenCalled()
})
