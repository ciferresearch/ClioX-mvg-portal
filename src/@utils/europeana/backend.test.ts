/** @jest-environment node */
import { backendRequest as requestBackend } from './backend'
const originalFetch = global.fetch
const backendRequest = (action: 'clear' | 'chat', sessionId: string) =>
  requestBackend(action, sessionId, undefined, 'https://example.test')
beforeEach(() => {
  global.fetch = jest.fn()
})
afterEach(() => {
  global.fetch = originalFetch
})
it('accepts HTTP 204 as DELETE acknowledgement', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(new Response(null, { status: 204 }))
  expect(await backendRequest('clear', 'test')).toEqual({ success: true })
})
it('does not turn a failed deletion into success', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(new Response('{}', { status: 503 }))
  await expect(backendRequest('clear', 'test')).rejects.toThrow('HTTP 503')
})
it('does not forward arbitrary service error details', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(
    new Response(JSON.stringify({ success: false, message: 'secret token' }), {
      status: 200
    })
  )
  await expect(backendRequest('clear', 'test')).rejects.toThrow(
    'reported failure during clear'
  )
})
it('preserves optional streamed observability for the server allowlist hook', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(
    new Response(
      [
        'data: {"type":"chunk","content":"A response"}',
        'data: {"type":"complete","observability":{"model_used":"fixture-v1","text":"untrusted"}}',
        'data: [DONE]'
      ].join('\n\n'),
      { headers: { 'content-type': 'text/event-stream' } }
    )
  )
  const result = await backendRequest('chat', 'test')
  expect(result.observability).toEqual({
    model_used: 'fixture-v1',
    text: 'untrusted'
  })
})
