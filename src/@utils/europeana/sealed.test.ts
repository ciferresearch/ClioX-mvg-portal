/** @jest-environment node */
import { readFileSync } from 'fs'
import path from 'path'
import { decryptChunks, decryptSealed, MAX_PLAINTEXT_BYTES } from './sealed'
import { fixture } from '../../../.jest/fixtures/europeana-c2d'

it('decrypts the read-only cross-language TEST vector exactly', () => {
  const root = path.join(
    process.cwd(),
    'c2d-algorithms/europeana-rag-preprocess/fixture'
  )
  const vector = JSON.parse(
    readFileSync(path.join(root, 'sealed-test-vector.json'), 'utf8')
  )
  // Explicit TEST key used by crypto only, never printed or copied to artifacts.
  const key = readFileSync(path.join(root, 'test-keys/private.pem')).toString(
    'base64'
  )
  expect(
    decryptSealed(vector.envelope, vector.runId, key).equals(
      Buffer.from(vector.plaintextUtf8)
    )
  ).toBe(true)
})
it.each([
  'ciphertext',
  'aad',
  'nonce',
  'recipientKeyId',
  'salt',
  'plaintextSha256',
  'plaintextBytes'
])('rejects tampered %s', (field) => {
  const f = fixture()
  const e = { ...f.envelope }
  if (['ciphertext', 'nonce', 'salt'].includes(field)) {
    const bytes = Buffer.from(e[field], 'base64')
    bytes[0] ^= 1
    e[field] = bytes.toString('base64')
  } else
    e[field] =
      field === 'plaintextBytes'
        ? e.plaintextBytes + 1
        : field === 'plaintextSha256' || field === 'recipientKeyId'
        ? '0'.repeat(64)
        : 'tampered'
  expect(() => decryptSealed(e, f.runId, f.privateB64)).toThrow(
    'could not be verified'
  )
})
it('authenticates AAD even when both the claimed run ID and envelope AAD change', () => {
  const f = fixture()
  expect(() =>
    decryptSealed(
      { ...f.envelope, aad: 'cliox-europeana-chunks/v1|other-run' },
      'other-run',
      f.privateB64
    )
  ).toThrow('could not be verified')
})
it('rejects wrong keys even if recipientKeyId is replaced', () => {
  const a = fixture()
  const b = fixture()
  expect(() => decryptSealed(a.envelope, a.runId, b.privateB64)).toThrow()
  expect(() =>
    decryptSealed(
      { ...a.envelope, recipientKeyId: b.envelope.recipientKeyId },
      a.runId,
      b.privateB64
    )
  ).toThrow()
})
it('requires canonical encoding, strict envelope fields and bounded lengths', () => {
  const f = fixture()
  for (const change of [
    { extra: 'field' },
    { nonce: f.envelope.nonce + '\n' },
    { plaintextBytes: MAX_PLAINTEXT_BYTES + 1 },
    { ephemeralPublicKey: 'AAAA' }
  ])
    expect(() =>
      decryptSealed({ ...f.envelope, ...change }, f.runId, f.privateB64)
    ).toThrow()
})
it('validates chunk hashes, counts, identifiers and strict schema after authentication', () => {
  const f = fixture()
  expect(decryptChunks(f.envelope, f.runId, f.privateB64)).toEqual([f.chunk])
  for (const change of [
    { wordCount: 0 },
    { charCount: 1 },
    { sha256: '0'.repeat(64) },
    { extra: true },
    { source: { recordId: 'bad', page: 'p' } },
    { text: '' }
  ])
    expect(() =>
      decryptChunks(
        f.seal({ ...f.plaintext, chunks: [{ ...f.chunk, ...change }] }),
        f.runId,
        f.privateB64
      )
    ).toThrow('Invalid sealed chunk schema')
  expect(() =>
    decryptChunks(
      f.seal({ ...f.plaintext, chunks: [f.chunk, f.chunk] }),
      f.runId,
      f.privateB64
    )
  ).toThrow()
  expect(() =>
    decryptChunks(
      f.seal({ chunks: [{ text: 'minimal vector' }] }),
      f.runId,
      f.privateB64
    )
  ).toThrow()
})
