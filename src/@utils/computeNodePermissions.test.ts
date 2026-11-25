import {
  createTrustedAlgorithmList,
  transformComputeFormToServiceComputeOptions
} from './compute'
import { getAssetsFromDids } from './aquarius'
import { getFileDidInfo } from './provider'
import { getComputeSettingsInitialValues } from '../components/Asset/Edit/_constants'
import { ComputeEditForm } from '../components/Asset/Edit/_types'
import { ServiceComputeOptions } from '@oceanprotocol/lib'

jest.mock('./aquarius', () => ({ getAssetsFromDids: jest.fn() }))
jest.mock('./provider', () => ({ getFileDidInfo: jest.fn() }))
jest.mock('./subgraph', () => ({}))
jest.mock('./assetConvertor', () => ({}))
jest.mock('./ddo', () => ({}))

const options = {
  publisherTrustedAlgorithms: [],
  publisherTrustedAlgorithmPublishers: ['0x123']
} as ServiceComputeOptions
const form = {
  allowAllPublishedAlgorithms: true,
  publisherTrustedAlgorithms: []
} as ComputeEditForm
beforeEach(() => jest.clearAllMocks())

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
