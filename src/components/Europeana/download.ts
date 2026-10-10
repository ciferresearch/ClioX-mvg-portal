function downloadFile(filename: string, value: string, type: string) {
  const url = URL.createObjectURL(new Blob([value], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Allow the browser to start reading the blob before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadJson(filename: string, value: unknown) {
  downloadFile(filename, JSON.stringify(value, null, 2), 'application/json')
}

export function downloadText(filename: string, value: string) {
  downloadFile(filename, value, 'text/plain;charset=utf-8')
}
