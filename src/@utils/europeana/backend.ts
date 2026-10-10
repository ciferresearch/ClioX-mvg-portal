import { serverEnv } from './server-env'
import { parseChatStream } from './stream'
// Configuration is supplied only by the Portal API route, never browser input.
// Operator configuration only: a running Clio-X Portal's chatbot proxy routes.
function portalProxyUrl(): string | undefined {
  return (
    serverEnv('EUROPEANA_CHATBOT_PORTAL_URL')?.replace(/\/$/, '') || undefined
  )
}

export function backendTransport(
  apiUrl?: string
): 'direct-service' | 'portal-proxy' | 'unconfigured' {
  return apiUrl
    ? 'direct-service'
    : portalProxyUrl()
    ? 'portal-proxy'
    : 'unconfigured'
}

// Reuse the Portal's existing question-answering service directly.
export async function backendRequest(
  action: 'health' | 'upload' | 'chat' | 'clear',
  sessionId?: string,
  payload?: unknown,
  apiUrl?: string
) {
  const direct = apiUrl?.replace(/\/$/, '')
  const proxy = direct ? undefined : portalProxyUrl()
  if (!direct && !proxy)
    throw new Error(
      'Configure CHATBOT_API_URL or EUROPEANA_CHATBOT_PORTAL_URL to connect the question-answering service.'
    )
  const paths = direct
    ? {
        health: '/api/health',
        upload: '/api/v1/session/knowledge/upload',
        chat: '/api/v1/session/chat',
        clear: '/api/v1/session/knowledge/session'
      }
    : {
        health: '/api/chatbot/health',
        upload: '/api/chatbot/upload',
        chat: '/api/chatbot/stream',
        clear: '/api/chatbot/session'
      }
  const response = await fetch(`${direct || proxy}${paths[action]}`, {
    method:
      action === 'health' ? 'GET' : action === 'clear' ? 'DELETE' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(action === 'chat' ? { Accept: 'text/event-stream' } : {}),
      ...(sessionId ? { 'X-Session-ID': sessionId } : {})
    },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(action === 'chat' ? 120000 : 60000),
    redirect: 'error'
  })
  if (!response.ok)
    throw new Error(
      `Question-answering service returned HTTP ${response.status} during ${action}.`
    )
  // A successful empty DELETE is an acknowledgement, not proof of erasure.
  if (action === 'clear' && response.status === 204) return { success: true }
  const text = await response.text()
  if (action === 'clear' && !text.trim()) return { success: true }
  const result =
    response.headers.get('content-type')?.includes('text/event-stream') ||
    text.startsWith('data:')
      ? parseChatStream(text)
      : JSON.parse(text)
  if (result.success === false || result.error)
    throw new Error(
      `Question-answering service reported failure during ${action}.`
    )
  return result
}

// The Portal proxy routes take camelCase fields and convert them for the service.
function usesPortalProxy(apiUrl?: string) {
  return backendTransport(apiUrl) === 'portal-proxy'
}

export function uploadPayload(
  sessionId: string,
  chunks: unknown[],
  apiUrl?: string
) {
  return usesPortalProxy(apiUrl)
    ? { sessionId, knowledgeChunks: chunks, domains: ['europeana-newspapers'] }
    : {
        session_id: sessionId,
        knowledge_chunks: chunks,
        domains: ['europeana-newspapers']
      }
}

export function chatPayload(
  sessionId: string,
  message: string,
  maxTokens = 1000,
  apiUrl?: string
) {
  return {
    ...(usesPortalProxy(apiUrl) ? { sessionId } : { session_id: sessionId }),
    message,
    config: { temperature: 0.1, max_tokens: maxTokens }
  }
}
