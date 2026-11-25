const EMPTY_SHA256 =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

/** Some Node builds report valid:true after a failed source download. */
export function assertNodeFileInfo(files: unknown): void {
  if (
    !Array.isArray(files) ||
    !files.length ||
    files.some((file) => file?.valid !== true)
  )
    throw new Error('The Node could not validate the asset files.')

  if (
    files.some(
      (file) =>
        Number(file.contentLength) === 0 && file.checksum === EMPTY_SHA256
    )
  )
    throw new Error(
      'The Node returned zero bytes and an empty-file checksum. The source may be unavailable or empty; verify its URL before publishing or starting compute.'
    )
}
