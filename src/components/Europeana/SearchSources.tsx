import { useState } from 'react'
import styles from './research.module.css'
import type { ActivityRecord } from '@utils/europeana/activity'
type Item = {
  id: string
  title: string
  provider: string
  language: string
  year: string
  url: string
}
type Results = {
  query: string
  page: number
  total: number
  hasNext: boolean
  items: Item[]
}
export default function SearchSources({
  busy,
  onImport,
  maxPages,
  onActivity
}: {
  busy: boolean
  onImport: (record: string) => Promise<void>
  maxPages: number
  onActivity: (record: ActivityRecord) => void
}) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState('')
  async function search(q: string, page = 1) {
    if (searching || busy) return
    setSearching(true)
    setError('')
    setResults(null)
    try {
      const response = await fetch(
        `/api/europeana/search?${new URLSearchParams({
          q,
          page: String(page)
        })}`
      )
      const data = await response.json()
      if (data.activity) onActivity(data.activity)
      if (!response.ok) throw new Error(data.error || 'Search failed.')
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setSearching(false)
    }
  }
  return (
    <div className={styles.sourceSearch}>
      <h3>Find a newspaper</h3>
      <p>
        Search Europeana newspaper records by keyword or title, then choose a
        result to load on the demo server; this browser receives metadata and
        bounded results.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          search(keyword.trim())
        }}
      >
        <label htmlFor="source-keyword">Keyword or newspaper title</label>
        <div className={styles.searchBar}>
          <input
            id="source-keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Try Hamburger Anzeiger"
            minLength={2}
            maxLength={200}
            required
            disabled={searching || busy}
          />
          <button
            className={styles.primary}
            disabled={searching || busy || keyword.trim().length < 2}
          >
            {searching ? 'Searching…' : 'Search Europeana'}
          </button>
        </div>
      </form>
      <p className={styles.caption}>
        Search discovers records. Full-text availability and reuse rights are
        checked when you load text; some records have no usable text. The page
        limit below also applies to search results.
      </p>
      {searching && <p role="status">Searching Europeana now…</p>}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {results && (
        <div aria-live="polite">
          <p>
            <strong>{results.total.toLocaleString()} matching records</strong>{' '}
            for “{results.query}” · Page {results.page}
          </p>
          {!results.items.length && (
            <p>
              No importable record identifiers were returned on this page. Try
              another keyword or result page.
            </p>
          )}
          <ul className={styles.searchResults}>
            {results.items.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p className={styles.caption}>
                    {[item.provider, item.language, item.year]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    View Europeana record ↗
                  </a>
                </div>
                <button
                  type="button"
                  disabled={searching || busy}
                  aria-label={`Load ${item.title}`}
                  onClick={async () => {
                    setSelected(item.id)
                    await onImport(item.id)
                  }}
                >
                  {busy && selected === item.id
                    ? 'Loading…'
                    : `Load up to ${maxPages} pages`}
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <button
              type="button"
              disabled={searching || busy || results.page === 1}
              onClick={() => search(results.query, results.page - 1)}
            >
              Previous results
            </button>
            <button
              type="button"
              disabled={searching || busy || !results.hasNext}
              onClick={() => search(results.query, results.page + 1)}
            >
              Next results
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
