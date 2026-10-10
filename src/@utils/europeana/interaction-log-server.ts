import type { ActivityRecord } from './activity'

// The same server-owned journal snapshot as JSON, in chronological event order.
// Only fixed event descriptions and typed metadata are rendered: no result text,
// request text, source URLs, reviewer names or notes. JSON escapes metadata line
// breaks; escape detail line breaks too so every event occupies exactly one line.
export function renderInteractionLog(records: ActivityRecord[]): string {
  const line = (value: string) => value.replace(/[\r\n\u2028\u2029]/g, ' ')
  return records
    .flatMap((record) => record.events.map((event) => ({ record, event })))
    .sort((a, b) => a.event.at.localeCompare(b.event.at))
    .map(
      ({ record, event }) =>
        `${event.at} [trace ${record.traceId}] [run ${record.runId}] [${
          event.pipelineStep
        }] ${event.stage} ${event.outcome} — ${line(event.detail)}${
          event.metadata ? ` ${JSON.stringify(event.metadata)}` : ''
        }`
    )
    .join('\n')
}
