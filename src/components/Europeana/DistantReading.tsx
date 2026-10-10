import type { C2DAggregates } from '@utils/europeana/c2d-types'
import styles from './research.module.css'

export default function DistantReading({
  aggregates
}: {
  aggregates: C2DAggregates
}) {
  return (
    <section className={styles.panel} aria-label="Distant reading">
      <h3>Distant reading</h3>
      <p>
        Provider-reported counts, validated against sealed chunks. Top terms are
        bounded to 50 single words.
      </p>
      <div className={styles.twoColumns}>
        <div>
          <h4>Top terms</h4>
          <ul>
            {aggregates.topTerms.map(({ term, count }) => (
              <li key={term}>
                {term} · {count}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Words per page</h4>
          <ul>
            {aggregates.pages.map((page) => (
              <li key={`${page.recordId}/${page.page}`}>
                Page {page.page} · {page.wordCount.toLocaleString()} words
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
