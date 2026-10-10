import evidence from '../../../content/europeana/historical-c2d-evidence.json'
import styles from './research.module.css'
import detail from './HistoricalEvidence.module.css'

const number = (value: number) => value.toLocaleString('en-US')

export default function HistoricalEvidence() {
  return (
    <section
      id="historical-c2d-evidence"
      className={`${styles.panel} ${detail.panel}`}
      aria-labelledby="historical-c2d-title"
    >
      <div className={detail.heading}>
        <div>
          <p className={styles.eyebrow}>HISTORICAL EXECUTION / UDL</p>
          <h2 id="historical-c2d-title">
            Historical Compute-to-Data run (UdL budget PDFs, not Europeana)
          </h2>
        </div>
        <span className={styles.pill}>Logs &amp; output reviewed</span>
      </div>
      <p className={detail.scope}>{evidence.scope}</p>
      <p className={detail.date}>
        <time dateTime={evidence.startedAt}>{evidence.dateLabel}</time>
        <span>{evidence.timeLabel}</span>
      </p>
      <p className={detail.job}>
        <span>Job ID</span> <code>{evidence.jobId}</code>
        <span className={styles.runStatus}>
          Provider: {evidence.providerStatus}
        </span>
      </p>

      <div className={`${styles.metrics} ${detail.stats}`}>
        <div>
          <strong>{evidence.input.pdfs} PDFs</strong>
          <span>{evidence.input.ocrPages} pages reported by OCR</span>
        </div>
        <div>
          <strong>{evidence.output.records} records</strong>
          <span>{evidence.output.uniqueRecords} distinct records verified</span>
        </div>
        <div>
          <strong>{evidence.algorithmSeconds.toFixed(2)} sec</strong>
          <span>Algorithm log interval</span>
        </div>
        <div>
          <strong>11 min 12 sec</strong>
          <span>Full job, from Provider timestamps</span>
        </div>
      </div>

      <aside className={detail.finding} aria-label="Output quality finding">
        <strong>Execution completed; output quality needs attention.</strong>
        <p>
          The output contains {evidence.output.duplicateRecords} extra exact
          copies of records. Of {evidence.output.uniqueRecords} distinct
          records, {evidence.output.uniqueRecordsWithoutPage} have no page value
          in their metadata. The returned content is readable OCR text, not just
          summary statistics.
        </p>
      </aside>

      <div className={styles.activityList}>
        {evidence.steps.map((step) => (
          <details key={step.id} className={styles.activityRecord}>
            <summary>
              <span className={detail.stepLabel}>{step.label}</span>
              <span>{step.title}</span>
            </summary>
            <p className={detail.description}>{step.description}</p>
            <ul className={detail.excerpts}>
              {step.excerpts.map((excerpt) => (
                <li key={`${excerpt.file}-${excerpt.line}`}>
                  <cite>
                    {excerpt.file} · line {excerpt.line}
                  </cite>
                  <blockquote>{excerpt.text}</blockquote>
                </li>
              ))}
            </ul>
            {step.id === 'process' && (
              <p className={styles.caption}>
                {evidence.warning} The logs do not identify an embedding model
                or establish the complete network activity.
              </p>
            )}
          </details>
        ))}

        <details className={styles.activityRecord}>
          <summary>Job identity and timing</summary>
          <dl className={styles.runFacts}>
            <div>
              <dt>Dataset</dt>
              <dd>{evidence.dataset.name}</dd>
              <dd>
                <code>{evidence.dataset.did}</code>
              </dd>
            </div>
            <div>
              <dt>Algorithm</dt>
              <dd>{evidence.algorithm.name}</dd>
              <dd>
                <code>{evidence.algorithm.did}</code>
              </dd>
            </div>
            <div>
              <dt>Provider and network</dt>
              <dd>{evidence.provider}</dd>
              <dd>
                {evidence.chain} · chain {evidence.chainId}
              </dd>
            </div>
            <div>
              <dt>Two different time intervals</dt>
              <dd>
                Algorithm log: {evidence.algorithmSeconds} seconds between its
                first and last timestamps; no timezone is recorded in that log.
              </dd>
              <dd>
                Provider job: {evidence.jobSeconds} seconds, including time
                outside that algorithm log interval.
              </dd>
            </div>
          </dl>
          <p className={styles.caption}>{evidence.association}</p>
        </details>

        <details className={styles.activityRecord}>
          <summary>Output inspection: where the duplicates came from</summary>
          <p className={detail.description}>
            Each processing pass appended the earlier chunks again. The six
            batches contain 14, 26, 41, 65, 88 and 114 records; together they
            produce 348 records. This pattern was verified against the actual
            JSON, as well as the log.
          </p>
          <div className={detail.tableScroll}>
            <table className={detail.table}>
              <caption>PDF years identified through the algorithm log</caption>
              <thead>
                <tr>
                  <th scope="col">PDF year</th>
                  <th scope="col">Distinct records</th>
                  <th scope="col">Copies per record</th>
                  <th scope="col">Total records</th>
                </tr>
              </thead>
              <tbody>
                {evidence.sources.map((source) => (
                  <tr key={source.year}>
                    <th scope="row">{source.year}</th>
                    <td>{source.uniqueRecords}</td>
                    <td>{source.copiesPerRecord}</td>
                    <td>{source.records}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.caption}>
            The JSON stores temporary source names. Matching them to the
            original PDFs requires the algorithm log.{' '}
            {evidence.output.contentType}
          </p>
        </details>

        <details className={styles.activityRecord}>
          <summary>
            Three reviewed files: sizes and SHA-256 fingerprints
          </summary>
          <p className={detail.description}>
            These fingerprints identify the original files supplied for review.
            Only selected log excerpts and review findings appear in this panel;
            the source text and download authorizations are not included.
          </p>
          <dl className={detail.files}>
            {evidence.files.map((file) => (
              <div key={file.name}>
                <dt>
                  {file.name} <span>{number(file.bytes)} bytes</span>
                </dt>
                <dd>
                  <code>{file.sha256}</code>
                </dd>
              </div>
            ))}
          </dl>
          <p className={styles.caption}>
            Review records: {evidence.evidenceSources.join(' · ')}.
          </p>
        </details>
      </div>

      <div className={detail.limits}>
        <h3>What this evidence does not establish</h3>
        <ul>
          {evidence.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
        <p className={styles.caption}>
          This historical result does not establish current Provider readiness.
        </p>
      </div>
    </section>
  )
}
