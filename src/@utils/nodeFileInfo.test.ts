import { assertNodeFileInfo } from './nodeFileInfo'

test('rejects the actual false-positive response from the unavailable Enron endpoint', () => {
  expect(() =>
    assertNodeFileInfo([
      {
        valid: true,
        contentLength: '0',
        contentType: '',
        checksum:
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        type: 'url'
      }
    ])
  ).toThrow('zero bytes')
})

test('accepts a nonempty file and does not interpret missing length as zero', () => {
  expect(() =>
    assertNodeFileInfo([
      { valid: true, contentLength: '1781', checksum: 'nonempty' }
    ])
  ).not.toThrow()
  expect(() => assertNodeFileInfo([{ valid: true }])).not.toThrow()
})

test.each([undefined, [], [{ valid: false }]])(
  'rejects missing and invalid file responses',
  (files) => {
    expect(() => assertNodeFileInfo(files)).toThrow('could not validate')
  }
)
