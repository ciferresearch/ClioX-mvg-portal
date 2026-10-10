export function parseChatStream(text: string) {
  let response = ''
  let sources: Array<{ source: string; content_preview: string }> = []
  let metadata: Record<string, unknown> = {}
  let observability: unknown
  let complete = false
  for (const block of text.split(/\r?\n\r?\n/)) {
    const payload = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')
    if (!payload || payload === '[DONE]') {
      if (payload === '[DONE]') complete = true
      continue
    }
    const event = JSON.parse(payload)
    if (event.type === 'error' || event.error)
      throw new Error(
        event.message || event.error || 'The model returned an error.'
      )
    if (
      (event.type === 'chunk' || (!event.type && !event.done)) &&
      typeof event.content === 'string'
    )
      response += event.content
    if (Array.isArray(event.sources)) ({ sources } = event)
    if (event.metadata) metadata = { ...metadata, ...event.metadata }
    if (
      event.observability &&
      typeof event.observability === 'object' &&
      !Array.isArray(event.observability)
    )
      observability = {
        ...((observability as object) || {}),
        ...event.observability
      }
    if (event.type === 'complete' || event.done) complete = true
  }
  if (!complete || !response.trim())
    throw new Error('The model response was interrupted. Please retry.')
  // Raw service data stays server-side until the observability allowlist runs.
  return {
    success: true,
    response,
    sources,
    metadata,
    ...(observability ? { observability } : {})
  }
}
