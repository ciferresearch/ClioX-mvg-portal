import { updateNodeAlgorithmContainer } from './nodeAlgorithm'

const current = {
  entrypoint: 'python /algorithm/src/main.py',
  image: 'chriswch/text-analysis',
  tag: '0.1.0',
  checksum: `sha256:${'a'.repeat(64)}`
}
test('updates the image and downloaded entrypoint together without mutating the existing asset', () => {
  const result = updateNodeAlgorithmContainer(current, {
    nodeAlgorithmEntrypoint: ' python $ALGO ',
    nodeAlgorithmTag: 'node-preview',
    nodeAlgorithmChecksum: `sha256:${'b'.repeat(64)}`
  })
  expect(result).toEqual({
    ...current,
    entrypoint: 'python $ALGO',
    tag: 'node-preview',
    checksum: `sha256:${'b'.repeat(64)}`
  })
  expect(current.tag).toBe('0.1.0')
})
test('preserves unspecified image fields', () => {
  expect(updateNodeAlgorithmContainer(current, {})).toEqual(current)
})
