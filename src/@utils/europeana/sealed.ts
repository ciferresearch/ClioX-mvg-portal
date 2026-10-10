import { serverEnv } from './server-env'
// Server-only: Node crypto and the runtime ingest secret must never enter a client bundle.
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  hkdfSync,
  createDecipheriv
} from 'crypto'
import { TextDecoder } from 'util'

if (typeof window !== 'undefined')
  throw new Error('Sealed ingestion is server-only.')

export const MAX_PLAINTEXT_BYTES = 2 * 1024 * 1024
const SPKI = Buffer.from('302a300506032b656e032100', 'hex')
const digest = (value: Buffer | string) =>
  createHash('sha256').update(value).digest('hex')
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid C2D object.')
  return value as Record<string, unknown>
}
function exact(value: Record<string, unknown>, fields: string[]) {
  if (Object.keys(value).sort().join('|') !== [...fields].sort().join('|'))
    throw new Error('Invalid sealed schema.')
}
function base64(value: unknown, size?: number): Buffer {
  if (
    typeof value !== 'string' ||
    value.length > Math.ceil((MAX_PLAINTEXT_BYTES + 16) / 3) * 4
  )
    throw new Error('Invalid sealed encoding.')
  const decoded = Buffer.from(value, 'base64')
  if (
    decoded.toString('base64') !== value ||
    (size !== undefined && decoded.length !== size)
  )
    throw new Error('Invalid sealed encoding.')
  return decoded
}
export function decryptSealed(
  input: unknown,
  runId: string,
  privateKeyB64 = serverEnv('EUROPEANA_INGEST_PRIVATE_KEY_B64')
): Buffer {
  try {
    const e = object(input)
    exact(e, [
      'format',
      'alg',
      'recipientKeyId',
      'ephemeralPublicKey',
      'salt',
      'nonce',
      'aad',
      'ciphertext',
      'plaintextSha256',
      'plaintextBytes'
    ])
    if (
      !/^[a-zA-Z0-9_-]{1,128}$/.test(runId) ||
      e.format !== 'cliox-sealed/v1' ||
      e.alg !== 'X25519-HKDF-SHA256-AES-256-GCM' ||
      e.aad !== `cliox-europeana-chunks/v1|${runId}` ||
      !Number.isSafeInteger(e.plaintextBytes) ||
      Number(e.plaintextBytes) < 1 ||
      Number(e.plaintextBytes) > MAX_PLAINTEXT_BYTES ||
      typeof e.plaintextSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(e.plaintextSha256)
    )
      throw new Error('Invalid envelope.')
    const pem = base64(privateKeyB64)
    let key: ReturnType<typeof createPrivateKey>
    try {
      key = createPrivateKey(pem)
    } finally {
      pem.fill(0)
    }
    if (key.asymmetricKeyType !== 'x25519')
      throw new Error('Invalid recipient.')
    const pub = createPublicKey(key).export({
      type: 'spki',
      format: 'der'
    }) as Buffer
    if (
      !pub.subarray(0, SPKI.length).equals(SPKI) ||
      pub.length !== SPKI.length + 32 ||
      e.recipientKeyId !== digest(pub.subarray(SPKI.length))
    )
      throw new Error('Invalid recipient.')
    const ephemeral = createPublicKey({
      key: Buffer.concat([SPKI, base64(e.ephemeralPublicKey, 32)]),
      type: 'spki',
      format: 'der'
    })
    const ct = base64(e.ciphertext)
    if (ct.length !== Number(e.plaintextBytes) + 16)
      throw new Error('Invalid length.')
    const shared = diffieHellman({ privateKey: key, publicKey: ephemeral })
    const aes = Buffer.from(
      hkdfSync('sha256', shared, base64(e.salt, 32), 'cliox-sealed/v1', 32)
    )
    shared.fill(0)
    try {
      const decipher = createDecipheriv('aes-256-gcm', aes, base64(e.nonce, 12))
      decipher.setAAD(Buffer.from(e.aad as string, 'utf8'))
      decipher.setAuthTag(ct.subarray(-16))
      const plaintext = Buffer.concat([
        decipher.update(ct.subarray(0, -16)),
        decipher.final()
      ])
      if (
        plaintext.length !== e.plaintextBytes ||
        digest(plaintext) !== e.plaintextSha256
      ) {
        plaintext.fill(0)
        throw new Error('Invalid plaintext.')
      }
      return plaintext
    } finally {
      aes.fill(0)
    }
  } catch {
    throw new Error('Sealed output could not be verified.')
  }
}
export interface SealedChunk {
  id: string
  text: string
  source: { recordId: string; page: string }
  charCount: number
  wordCount: number
  sha256: string
}
export function decryptChunks(
  input: unknown,
  runId: string,
  privateKeyB64?: string
): SealedChunk[] {
  const bytes = decryptSealed(input, runId, privateKeyB64)
  try {
    const root = object(
      JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    )
    exact(root, ['schemaVersion', 'runId', 'deliveryPolicy', 'chunks'])
    if (
      root.schemaVersion !== 1 ||
      root.runId !== runId ||
      !Array.isArray(root.chunks) ||
      root.chunks.length < 1 ||
      root.chunks.length > 2000
    )
      throw new Error('Invalid chunk payload.')
    const policy = object(root.deliveryPolicy)
    exact(policy, [
      'audience',
      'transport',
      'researcherWalletDelivery',
      'containsSourceText'
    ])
    if (
      policy.audience !== 'Clio-X RAG service only' ||
      policy.transport !== 'server-to-server' ||
      policy.researcherWalletDelivery !== false ||
      policy.containsSourceText !== true
    )
      throw new Error('Invalid delivery policy.')
    const ids = new Set<string>()
    return root.chunks.map((item) => {
      const c = object(item)
      exact(c, ['id', 'text', 'source', 'charCount', 'wordCount', 'sha256'])
      const source = object(c.source)
      exact(source, ['recordId', 'page'])
      if (
        typeof c.id !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,128}$/.test(c.id) ||
        ids.has(c.id) ||
        typeof c.text !== 'string' ||
        !c.text.trim() ||
        c.text.length > 100000 ||
        typeof source.recordId !== 'string' ||
        !/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(source.recordId) ||
        source.recordId.length > 300 ||
        typeof source.page !== 'string' ||
        !/^[a-zA-Z0-9_.-]{1,80}$/.test(source.page) ||
        c.sha256 !== digest(c.text) ||
        c.charCount !== Array.from(c.text).length ||
        c.wordCount !== c.text.trim().split(/\s+/u).length
      )
        throw new Error('Invalid chunk record.')
      ids.add(c.id)
      return {
        id: c.id,
        text: c.text,
        source: { recordId: source.recordId, page: source.page },
        charCount: Number(c.charCount),
        wordCount: Number(c.wordCount),
        sha256: c.sha256 as string
      }
    })
  } catch {
    throw new Error('Invalid sealed chunk schema.')
  } finally {
    bytes.fill(0)
  }
}
