import { DDO } from '@oceanprotocol/lib'
import { ethers, Signer } from 'ethers'

/**
 * Ocean Node authenticates DDO encryption with a wallet signature. This is
 * intentionally different from the legacy Provider `/encrypt` endpoint.
 */
export async function encryptDdoWithOceanNode(
  ddo: DDO,
  nodeUrl: string,
  signer: Signer,
  signal?: AbortSignal
): Promise<string> {
  if (!nodeUrl) throw new Error('Ocean Node URL is not configured.')
  if (!signer) throw new Error('Wallet signer is not available.')

  const consumerAddress = await signer.getAddress()
  const nonce = Date.now().toString()
  const message = `${consumerAddress}${nonce}encrypt`
  const messageHash = ethers.utils.solidityKeccak256(
    ['bytes'],
    [ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message))]
  )
  const signature = await signer.signMessage(ethers.utils.arrayify(messageHash))

  const endpoint = new URL('/api/services/encrypt', nodeUrl)
  endpoint.searchParams.set('consumerAddress', consumerAddress)
  endpoint.searchParams.set('nonce', nonce)
  endpoint.searchParams.set('signature', signature)

  const response = await fetch(endpoint.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: JSON.stringify(ddo),
    signal
  })
  const encryptedDdo = await response.text()

  if (!response.ok)
    throw new Error(
      `Ocean Node encryption failed (${response.status}): ${encryptedDdo}`
    )
  if (!encryptedDdo.startsWith('0x'))
    throw new Error('Ocean Node returned an invalid encrypted DDO.')

  return encryptedDdo
}
