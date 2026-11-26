import axios from 'axios'
import { getOceanNodeAsset } from '.'

jest.mock('axios')
jest.mock('../../../app.config', () => ({
  ...jest.requireActual('../../../app.config'),
  metadataEncryptionNodeUrl: 'https://cliox-node.test',
  metadataCacheUri: 'https://legacy-cache.test'
}))
const did = `did:op:${'a'.repeat(64)}`
beforeEach(() => jest.clearAllMocks())

test('retrieves an exact DID from the configured ClioX Node', async () => {
  ;(axios.get as jest.Mock).mockResolvedValue({
    status: 200,
    data: { id: did }
  })
  await expect(getOceanNodeAsset(did)).resolves.toEqual({ id: did })
  expect(axios.get).toHaveBeenCalledWith(
    `https://cliox-node.test/api/aquarius/assets/ddo/${did}`,
    { cancelToken: undefined }
  )
})

test('does not silently fall back to the legacy cache when ClioX returns 404', async () => {
  ;(axios.get as jest.Mock).mockRejectedValue(new Error('ClioX 404'))
  await expect(getOceanNodeAsset(did)).rejects.toThrow('ClioX 404')
  expect(axios.get).toHaveBeenCalledTimes(1)
})

test('rejects a response for another DID', async () => {
  ;(axios.get as jest.Mock).mockResolvedValue({
    status: 200,
    data: { id: 'different' }
  })
  await expect(getOceanNodeAsset(did)).rejects.toThrow('requested asset')
})
