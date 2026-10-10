import type { ActivityRecord } from '@utils/europeana/activity'
import {
  ACTIVITY_LABELS,
  PIPELINE_STEPS,
  INDEXING_SCOPE
} from '@utils/europeana/activity'
import JsonExport from './JsonExport'
import HistoricalEvidence from './HistoricalEvidence'
import styles from './research.module.css'

function PipelineEvents({ records }: { records: ActivityRecord[] }) {
  const events = records
    .flatMap((record) =>
      record.events.map((event, index) => ({ record, event, index }))
    )
    .sort((a, b) => a.event.at.localeCompare(b.event.at))
  return (
    <>
      {PIPELINE_STEPS.map((step) => {
        const grouped = events.filter(
          ({ event }) => event.pipelineStep === step.id
        )
        return (
          <section
            key={step.id}
            aria-label={step.label}
            data-pipeline-step={step.id}
          >
            <h4>{step.label}</h4>
            {step.id === 'indexing' && (
              <p className={styles.caption}>{INDEXING_SCOPE}</p>
            )}
            {!grouped.length && (
              <p className={styles.caption}>No events observed in this step.</p>
            )}
            <ol className={styles.timeline}>
              {grouped.map(({ record, event, index }) => (
                <li key={`${record.runId}-${index}`}>
                  <time dateTime={event.at}>
                    {new Date(event.at).toLocaleTimeString()}
                  </time>
                  <div>
                    <strong>
                      {event.stage.replace(/-/g, ' ')} · {event.outcome}
                    </strong>
                    <p>{event.detail}</p>
                    <p className={styles.caption}>
                      {ACTIVITY_LABELS[record.action]} · run {record.runId}
                    </p>
                    {event.metadata && (
                      <pre className={styles.break}>
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </>
  )
}

export default function ActivityPanel({
  records,
  getExport
}: {
  records: ActivityRecord[]
  getExport: () => Promise<unknown>
}) {
  const c2d = records.some((record) => record.sourceOrigin === 'c2d')
  const server = c2d ? 'ClioX Portal server' : 'Demo server'
  const serverInText = c2d ? 'ClioX Portal server' : 'demo server'
  const cleanupIssues = records.filter(
    (record) => record.cleanup === 'failed'
  ).length
  return (
    <section aria-labelledby="activity-title">
      <div className={styles.panel}>
        <p className={styles.eyebrow}>05 / FOLLOW THE PROCESS</p>
        <h2 id="activity-title">Where the data goes. What the AI did.</h2>
        <p>
          {c2d
            ? 'Europeana pages are processed in the provider environment. Sealed chunks feed a server-held corpus; selected passages are processed by the configured ClioX service.'
            : 'Exploration reads public newspaper text through Europeana APIs and sends selected passages to the configured ClioX service.'}
        </p>
        <div className={styles.boundaryBadges}>
          <span className={styles.pill}>
            {c2d
              ? 'Compute-to-Data · sealed output verified'
              : 'Exploration · service API'}
          </span>
        </div>
        <figure className={styles.architecture}>
          <div
            className={styles.componentFlow}
            aria-label="Current technical components and data flow"
          >
            <article>
              <h3>
                {c2d
                  ? 'Provider · Europeana Compute-to-Data'
                  : 'Europeana Search / IIIF / full-text API'}
              </h3>
              <p>
                {c2d
                  ? 'Inside the provider environment, the trusted algorithm calls the Europeana API, extracts text, chunks it and seals the chunks for the ClioX server key.'
                  : 'Published metadata, manifests and OCR.'}
              </p>
            </article>
            <p>
              {c2d
                ? '↓ Encrypted chunks + public aggregates + sanitized provider logs → server'
                : '↓ Metadata + manifests + bounded OCR pages → demo server'}
            </p>
            <article>
              <h3>{server}</h3>
              <p>
                {c2d
                  ? 'Verifies and opens the sealed chunks, locates and retrieves selected spans. Decrypted chunks are held in an in-memory server cache with expiry; not erasure-attested.'
                  : 'Loads sources, locates and retrieves selected spans. OCR is held in an in-memory server cache with expiry; not erasure-attested.'}
              </p>
            </article>
            <p>
              ↓ Candidate results + server-owned source references → local
              output-policy gate
            </p>
            <article>
              <h3>Local output-policy gate</h3>
              <p>
                Content-fingerprint quotas, metadata allowlists, bounded quotes,
                copy checks and cumulative release budget.
              </p>
            </article>
            <p>
              ↓ Metadata, hashes, bounded released results, trace log → browser
            </p>
            <article>
              <h3>Browser</h3>
              <p>
                Displays released results and source metadata. Sends validated
                source selections, trace IDs, questions and review assertions to
                the {serverInText}. Exports use the server journal.
              </p>
            </article>
            <p>
              {server} → configured ClioX service: only selected spans (up to
              eight), repeated in the prompt, plus the question and requested
              settings.
            </p>
            <article>
              <h3>Configured ClioX service</h3>
              <p>
                Temporary session requested. Model response → {serverInText} →
                output-policy gate. Session DELETE requested after processing;
                service internals and physical deletion are not observed.
              </p>
            </article>
          </div>
          <figcaption>
            {c2d
              ? 'The envelope is cryptographically verified. Job identity and provider logs are supplied by the browser, not independently attested. Chunk offsets refer to assembled chunks; overlapping chunks may repeat source words. Provider resource deletion is not observed.'
              : 'Saved samples load from server disk. Exploration does not execute a provider job.'}
          </figcaption>
        </figure>
        <div className={styles.twoColumns}>
          <article className={styles.note}>
            <h3>Working copies and retention</h3>
            <p>
              {c2d ? 'Decrypted C2D chunks are' : 'Live OCR is'} cached in
              server memory with one-hour access expiry and an eight-corpus
              limit. Expired entries are removed on access or later loading;
              restart clears the cache. This is not secure erasure.
            </p>
            <p>
              The browser holds metadata, bounded released results and activity
              until refresh or closing. Exports remain on your computer.
              {c2d
                ? ' The provider result files stay with the provider job; the sealed chunks cannot be opened without the ClioX server key.'
                : ' The saved demonstration corpus remains on disk.'}
            </p>
          </article>
          <article className={styles.note}>
            <h3>Service session cleanup</h3>
            <p>
              After each model operation, the {c2d ? 'Portal' : 'demo'} requests
              deletion of its temporary session, including when processing
              fails. An acknowledgement does not prove removal of service logs,
              backups or compute resources.
            </p>
            <p>
              Backend retention and the data holder’s approved processing
              boundary still need verification.
            </p>
          </article>
        </div>
      </div>
      <div className={styles.panel}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Activity from this visit</h2>
            <p>
              Inspect inputs, requested settings, outcomes and cleanup for each
              operation.
            </p>
          </div>
          <JsonExport
            filename="europeana-activity.json"
            label="Export current trace JSON"
            disabled={!records.length}
            getValue={getExport}
          />
        </div>
        <p className={styles.caption}>
          This journal is in-memory, unsigned and process-local, not a
          tamper-evident audit log. It expires after one hour and holds at most
          1000 runs. Restart or capacity eviction loses records. Full prompts
          and OCR bodies are omitted from activity records; source references,
          offsets and hashes identify inputs. Export before refreshing to retain
          this visit’s records. Export uses the current corpus trace; earlier
          traces remain listed below.
        </p>
        <p className={styles.caption}>
          Steps follow the RAG pipeline of Zhou, Li and Lemieux, IEEE CAS 2025,
          Section II.A; Access and Governance frame the five steps. Prepare the
          JSON export to preview, copy or download its companion interaction.log
          from the same server snapshot.
        </p>
        {cleanupIssues > 0 && (
          <p className={styles.error} role="status">
            Session deletion was not confirmed for {cleanupIssues} operation(s).
            Review those records before assuming the service has removed the
            data.
          </p>
        )}
        {!records.length && (
          <p className={styles.notice}>
            No operations recorded yet. Load source text or run a question to
            create a real activity record.
          </p>
        )}
        <div className={styles.activityList}>
          {[...new Set(records.map((record) => record.traceId))].map(
            (traceId) => (
              <section key={traceId} aria-label={`Trace ${traceId}`}>
                <h3 className={styles.break}>Trace {traceId}</h3>
                <PipelineEvents
                  records={records.filter(
                    (record) => record.traceId === traceId
                  )}
                />
                {records.some(
                  (record) =>
                    record.traceId === traceId &&
                    record.events.some((event) => event.metadata?.providerLog)
                ) && (
                  <section aria-label="Provider logs (Compute-to-Data)">
                    <h4>Provider logs (Compute-to-Data)</h4>
                    <p>
                      Sanitized before storage. SHA-256 identifies sanitized
                      UTF-8 content; these logs are client-supplied
                      observations.
                    </p>
                    {(['access', 'ingestion'] as const).map((step) => (
                      <div key={step}>
                        <h5>
                          {step === 'access'
                            ? 'Access · configure / fetch'
                            : 'Ingestion · algorithm stages'}
                        </h5>
                        {records
                          .filter((record) => record.traceId === traceId)
                          .flatMap((record) => record.events)
                          .filter(
                            (event) =>
                              event.pipelineStep === step &&
                              event.metadata?.providerLog
                          )
                          .map((event, index) => (
                            <pre className={styles.break} key={index}>
                              {event.metadata.providerLog.filename} · SHA-256{' '}
                              {event.metadata.providerLog.sha256}
                              {'\n'}
                              {event.detail}
                            </pre>
                          ))}
                      </div>
                    ))}
                  </section>
                )}
                <h4>Operation details</h4>
                {records
                  .filter((record) => record.traceId === traceId)
                  .map((record, index) => (
                    <details
                      key={record.runId}
                      className={styles.activityRecord}
                      open={index === 0 ? true : undefined}
                    >
                      <summary>
                        <span>{ACTIVITY_LABELS[record.action]}</span>
                        <span
                          className={
                            record.status === 'failed'
                              ? styles.failedStatus
                              : styles.runStatus
                          }
                        >
                          {record.status}
                        </span>
                        <time dateTime={record.startedAt}>
                          {new Date(record.startedAt).toLocaleTimeString()}
                        </time>
                      </summary>
                      <dl className={styles.runFacts}>
                        <div>
                          <dt>Trace ID</dt>
                          <dd>{record.traceId}</dd>
                        </div>
                        {record.parentRunId && (
                          <div>
                            <dt>Parent run ID</dt>
                            <dd>{record.parentRunId}</dd>
                          </div>
                        )}
                        <div>
                          <dt>Run ID</dt>
                          <dd>{record.runId}</dd>
                        </div>
                        <div>
                          <dt>Source</dt>
                          <dd>
                            {record.sourceOrigin || 'Search metadata'}
                            {record.corpusVersion
                              ? ` · ${record.corpusVersion}`
                              : ''}
                          </dd>
                        </div>
                        <div>
                          <dt>Model</dt>
                          <dd>
                            {record.model.state === 'not-called'
                              ? 'No model call'
                              : record.model.name
                              ? `${record.model.name} (service-reported)`
                              : record.model.state === 'requested'
                              ? 'Requested; no complete response received'
                              : 'Identity not reported by service'}
                          </dd>
                        </div>
                        <div>
                          <dt>Session deletion</dt>
                          <dd>
                            {record.cleanup === 'acknowledged'
                              ? 'Acknowledged; erasure not verified'
                              : record.cleanup === 'not-needed'
                              ? 'No service session requested'
                              : record.cleanup === 'failed'
                              ? 'Not confirmed; needs review'
                              : 'Not attempted'}
                          </dd>
                        </div>
                        {record.configuration && (
                          <>
                            <div>
                              <dt>Requested configuration</dt>
                              <dd>
                                Temperature{' '}
                                {record.configuration.requested.temperature} ·
                                max tokens{' '}
                                {record.configuration.requested.max_tokens}.
                                Effective settings not reported.
                              </dd>
                            </div>
                            <div>
                              <dt>Text selection</dt>
                              <dd>
                                {record.inputs.length} units ·{' '}
                                {record.configuration.retrieval}
                              </dd>
                            </div>
                            <div>
                              <dt>Service connection</dt>
                              <dd>{record.configuration.transport}</dd>
                            </div>
                          </>
                        )}
                      </dl>
                      <details className={styles.rawRecord}>
                        <summary>
                          Input references, hashes and full record
                        </summary>
                        <pre>{JSON.stringify(record, null, 2)}</pre>
                      </details>
                    </details>
                  ))}
              </section>
            )
          )}
        </div>
      </div>
      {process.env.NEXT_PUBLIC_EUROPEANA_EXPLORATION === 'true' && (
        <HistoricalEvidence />
      )}
      <div className={styles.panel}>
        <h3>ClioX compute-to-data connection</h3>
        <p>
          {c2d
            ? 'This trace includes verified sealed output and sanitized provider logs. The browser supplied the job identifiers and logs; the server did not independently authenticate the provider execution.'
            : 'Run a Europeana Compute-to-Data job in step 01 to attach sealed output and provider logs to a trace.'}
        </p>
        <p className={styles.caption}>
          Provider resource lifecycle and deletion are not attested. Subsequent
          inference uses the configured ClioX service with the existing bounded
          output policy.
        </p>
      </div>
    </section>
  )
}
