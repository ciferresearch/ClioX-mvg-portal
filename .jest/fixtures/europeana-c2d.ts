// Synthetic data and ephemeral keys only. No runtime secrets or network.
import {
  createCipheriv,
  createHash,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  randomBytes
} from 'crypto'
export const hash = (value: string | Buffer) =>
  createHash('sha256').update(value).digest('hex')
export function fixture() {
  const keys = generateKeyPairSync('x25519')
  const privateB64 = Buffer.from(
    keys.privateKey.export({ type: 'pkcs8', format: 'pem' })
  ).toString('base64')
  const recipientKeyId = hash(
    (keys.publicKey.export({ type: 'spki', format: 'der' }) as Buffer).subarray(
      -32
    )
  )
  const runId = 'fixture-run'
  const text = Array.from(
    { length: 80 },
    (_, i) =>
      `Ostende newspaper observation ${i} describes ships approaching the harbour and people reading daily reports.`
  ).join(' ')
  const chunk = {
    id: 'p0000-c000000-test',
    text,
    source: { recordId: '/123/Archive', page: 'page1' },
    charCount: Array.from(text).length,
    wordCount: text.split(/\s+/).length,
    sha256: hash(text)
  }
  const plaintext = {
    schemaVersion: 1,
    runId,
    deliveryPolicy: {
      audience: 'Clio-X RAG service only',
      transport: 'server-to-server',
      researcherWalletDelivery: false,
      containsSourceText: true
    },
    chunks: [chunk]
  }
  function seal(value: unknown = plaintext) {
    const bytes = Buffer.from(JSON.stringify(value))
    const ephemeral = generateKeyPairSync('x25519')
    const salt = randomBytes(32)
    const nonce = randomBytes(12)
    const aad = `cliox-europeana-chunks/v1|${runId}`
    const shared = diffieHellman({
      privateKey: ephemeral.privateKey,
      publicKey: createPublicKey(keys.privateKey)
    })
    const cipher = createCipheriv(
      'aes-256-gcm',
      Buffer.from(hkdfSync('sha256', shared, salt, 'cliox-sealed/v1', 32)),
      nonce
    )
    cipher.setAAD(Buffer.from(aad))
    const ct = Buffer.concat([
      cipher.update(bytes),
      cipher.final(),
      cipher.getAuthTag()
    ])
    return {
      format: 'cliox-sealed/v1',
      alg: 'X25519-HKDF-SHA256-AES-256-GCM',
      recipientKeyId,
      ephemeralPublicKey: (
        ephemeral.publicKey.export({ type: 'spki', format: 'der' }) as Buffer
      )
        .subarray(-32)
        .toString('base64'),
      salt: salt.toString('base64'),
      nonce: nonce.toString('base64'),
      aad,
      ciphertext: ct.toString('base64'),
      plaintextSha256: hash(bytes),
      plaintextBytes: bytes.length
    }
  }
  const envelope = seal()
  const aggregates = {
    schemaVersion: 1,
    runId,
    pages: [
      {
        ...chunk.source,
        wordCount: chunk.wordCount,
        metadata: {
          title: 'Archive',
          date: '1918-01-01',
          language: 'en',
          rights: 'Public domain',
          attribution: 'Library'
        }
      }
    ],
    topTerms: [{ term: 'Ostende', count: 80 }]
  }
  const body = {
    jobId: 'provider-job-1',
    datasetDid: 'did:op:dataset',
    algorithmDid: 'did:op:algorithm',
    providerUrl: 'https://provider.example',
    sealed: envelope,
    summary: {
      schemaVersion: 1,
      runId,
      chunkCount: 1,
      pageCount: 1,
      recipientKeyId,
      plaintextSha256: envelope.plaintextSha256,
      chunksSealedSha256: hash(JSON.stringify(envelope))
    },
    aggregates,
    configureLog:
      'fetch https://example.test?signature=secretSig&nonce=secretNonce\nAuthorization: Bearer secretBearer',
    algorithmLog: 'chunking succeeded\nseal succeeded',
    pipelineLog: '{"stage":"chunking","pipelineStep":"ingestion"}'
  }
  return { privateB64, text, chunk, plaintext, seal, envelope, body, runId }
}
