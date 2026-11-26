import {
  createTrustedAlgorithmList,
  addNodeTrustedAlgorithm,
  transformComputeFormToServiceComputeOptions
} from './compute'
import { getAssetsFromDids } from './aquarius'
import { getFileDidInfo } from './provider'
import { getNodeComputeAsset } from './nodeCompute'
import { getComputeSettingsInitialValues } from '../components/Asset/Edit/_constants'
import { ComputeEditForm } from '../components/Asset/Edit/_types'
import { ServiceComputeOptions, getHash } from '@oceanprotocol/lib'

jest.mock('./aquarius', () => ({ getAssetsFromDids: jest.fn() }))
jest.mock('./provider', () => ({ getFileDidInfo: jest.fn() }))
jest.mock('./subgraph', () => ({}))
jest.mock('./assetConvertor', () => ({}))
jest.mock('./ddo', () => ({}))
jest.mock('./nodeCompute', () => ({ getNodeComputeAsset: jest.fn() }))

const options = {
  publisherTrustedAlgorithms: [],
  publisherTrustedAlgorithmPublishers: ['0x123']
} as ServiceComputeOptions
const form = {
  allowAllPublishedAlgorithms: true,
  publisherTrustedAlgorithms: []
} as ComputeEditForm
beforeEach(() => {
  jest.clearAllMocks()
  ;(getNodeComputeAsset as jest.Mock).mockImplementation(async (id) => ({
    id,
    services: [
      { id: 'svc', serviceEndpoint: 'https://ocean-node.agrospai.udl.cat' }
    ],
    metadata: {
      algorithm: {
        container: { entrypoint: 'python $ALGO', checksum: 'sha256:current' }
      }
    }
  }))
})

test('encodes explicit allow-all selection using Node wildcard checksums, preserving publisher permissions', async () => {
  const result = await transformComputeFormToServiceComputeOptions(
    form,
    options,
    11155420,
    undefined
  )
  expect(result.publisherTrustedAlgorithms).toEqual([
    { did: '*', filesChecksum: '*', containerSectionChecksum: '*' }
  ])
  expect(result.publisherTrustedAlgorithmPublishers).toEqual(['0x123'])
})

test('preserves legacy allow-all representation on other networks', async () => {
  const result = await transformComputeFormToServiceComputeOptions(
    form,
    options,
    32456,
    undefined
  )
  expect(result.publisherTrustedAlgorithms).toBeNull()
})

test('does not interpret null Node permissions as permission to run any algorithm', () => {
  const value = { ...options, publisherTrustedAlgorithms: null }
  expect(
    getComputeSettingsInitialValues(value, 11155420).allowAllPublishedAlgorithms
  ).toBe(false)
  expect(
    getComputeSettingsInitialValues(value, 32456).allowAllPublishedAlgorithms
  ).toBe(true)
})

test('aggregates every algorithm file checksum as the Node does', async () => {
  ;(getAssetsFromDids as jest.Mock).mockResolvedValue([
    {
      id: 'did:op:test',
      services: [
        { id: 'svc', serviceEndpoint: 'https://ocean-node.agrospai.udl.cat' }
      ],
      metadata: {
        algorithm: {
          container: { entrypoint: 'python main.py', checksum: 'sha256:test' }
        }
      }
    }
  ])
  ;(getFileDidInfo as jest.Mock).mockResolvedValue([
    { valid: true, checksum: 'first' },
    { valid: true, checksum: 'second' }
  ])
  const result = await createTrustedAlgorithmList(
    ['did:op:test'],
    11155420,
    undefined
  )
  expect(result[0].filesChecksum).toBe('firstsecond')
})

test('does not save permissions when an algorithm cannot be resolved', async () => {
  ;(getAssetsFromDids as jest.Mock).mockResolvedValue([])
  await expect(
    createTrustedAlgorithmList(['did:op:missing'], 11155420, undefined)
  ).rejects.toThrow('could not be retrieved')
})

test('adds a verified algorithm without deleting other permissions', async () => {
  ;(getAssetsFromDids as jest.Mock).mockResolvedValue([
    {
      id: 'did:op:new',
      services: [
        { id: 'svc', serviceEndpoint: 'https://ocean-node.agrospai.udl.cat' }
      ],
      metadata: {
        algorithm: {
          container: { entrypoint: 'python $ALGO', checksum: 'sha256:test' }
        }
      }
    }
  ])
  ;(getFileDidInfo as jest.Mock).mockResolvedValue([
    { valid: true, checksum: 'verified' }
  ])
  const previous = {
    ...options,
    publisherTrustedAlgorithms: [
      {
        did: 'did:op:existing',
        filesChecksum: 'old',
        containerSectionChecksum: 'old'
      }
    ]
  }
  const result = await addNodeTrustedAlgorithm(
    previous,
    'did:op:new',
    undefined
  )
  expect(result.publisherTrustedAlgorithms.map((entry) => entry.did)).toEqual([
    'did:op:existing',
    'did:op:new'
  ])
  expect(result.publisherTrustedAlgorithmPublishers).toEqual(['0x123'])
  expect(previous.publisherTrustedAlgorithms).toHaveLength(1)
  expect(result.publisherTrustedAlgorithms[1].containerSectionChecksum).toBe(
    getHash('python $ALGOsha256:current')
  )
})
