import { useState } from 'react'
import { downloadJson, downloadText } from './download'
import styles from './research.module.css'

export default function JsonExport({
  filename,
  label,
  getValue,
  disabled = false
}: {
  filename: string
  label: string
  getValue: () => unknown | Promise<unknown>
  disabled?: boolean
}) {
  const [preview, setPreview] = useState('')
  const [interactionLog, setInteractionLog] = useState<string | undefined>()
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function exportFile() {
    setLoading(true)
    setError('')
    setPreview('')
    setInteractionLog(undefined)
    try {
      const value = await getValue()
      // Capture once: preview, clipboard and download share this server snapshot.
      const snapshot = JSON.stringify(value, null, 2)
      setPreview(snapshot)
      const captured = JSON.parse(snapshot)
      if (typeof captured?.interactionLog === 'string')
        setInteractionLog(captured.interactionLog)
      try {
        downloadJson(filename, JSON.parse(snapshot))
        setMessage(
          'Download requested. You can also view or copy the JSON below.'
        )
      } catch {
        setMessage(
          'Download is unavailable in this browser. Copy the JSON below.'
        )
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      setLoading(false)
    }
  }

  async function copy(text = preview, kind = 'JSON') {
    try {
      await navigator.clipboard.writeText(text)
      setMessage(`${kind} copied.`)
    } catch {
      setMessage(`Select the ${kind} below and copy it using your browser.`)
    }
  }

  return (
    <div className={styles.exportControl}>
      <button disabled={disabled || loading} onClick={exportFile}>
        {loading ? 'Preparing export…' : label}
      </button>
      {loading && <p role="status">Fetching the server export…</p>}
      {error && <p role="alert">{error}</p>}
      {preview && (
        <>
          <p role="status" className={styles.caption}>
            {message}
          </p>
          <details>
            <summary>View or copy exported JSON</summary>
            <p className={styles.caption}>
              {filename} · Snapshot taken when you clicked export.
            </p>
            <button onClick={() => copy()}>Copy JSON</button>
            <textarea
              aria-label={`Export preview: ${filename}`}
              value={preview}
              readOnly
              rows={10}
            />
          </details>
          {interactionLog !== undefined && (
            <details>
              <summary>View or copy interaction.log</summary>
              <p className={styles.caption}>
                Same server snapshot as the JSON export.
              </p>
              <button onClick={() => copy(interactionLog, 'interaction.log')}>
                Copy interaction.log
              </button>
              <button
                onClick={() => {
                  try {
                    downloadText('interaction.log', interactionLog)
                    setMessage('interaction.log download requested.')
                  } catch {
                    setMessage(
                      'Download is unavailable. Copy interaction.log below.'
                    )
                  }
                }}
              >
                Download interaction.log
              </button>
              <textarea
                aria-label="Export preview: interaction.log"
                value={interactionLog}
                readOnly
                rows={10}
              />
            </details>
          )}
        </>
      )}
    </div>
  )
}
