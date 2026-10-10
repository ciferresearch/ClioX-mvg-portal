/** @jest-environment node */
import { searchNewspapers as search } from './search-server'
const originalFetch = global.fetch
let apiKey: string | undefined
const searchNewspapers = (query: unknown, page: unknown = 1) =>
  search(query, page, apiKey)
const secret = 'private-test-credential'
const request = jest.fn()
function response(data: unknown, status = 200) {
  let read = false
  return {
    status,
    ok: status === 200,
    body: {
      getReader: () => ({
        read: async () =>
          read
            ? { done: true }
            : ((read = true),
              { done: false, value: Buffer.from(JSON.stringify(data)) }),
        cancel: async () => {}
      })
    }
  }
}
beforeEach(() => {
  apiKey = secret
  global.fetch = request
  request.mockReset()
})
afterAll(() => {
  global.fetch = originalFetch
})
it('keeps the credential in the fixed-host header and excludes echoed credentials and unsafe links', async () => {
  request.mockResolvedValue(
    response({
      success: true,
      apikey: secret,
      totalResults: 11,
      items: [
        {
          id: '/9200338/Example',
          title: ['Newspaper'],
          dataProvider: ['Library ' + secret],
          link: 'https://api.europeana.eu/?wskey=' + secret,
          guid: 'https://bad.example',
          url: 'javascript:alert(1)'
        },
        { id: 'https://bad.example', title: ['Bad'] }
      ]
    })
  )
  const data = await searchNewspapers('Hamburger Anzeiger', 2)
  const [url, options] = request.mock.calls[0]
  expect(new URL(url).origin).toBe('https://api.europeana.eu')
  expect(new URL(url).searchParams.get('theme')).toBe('newspaper')
  expect(new URL(url).searchParams.get('start')).toBe('6')
  expect(url).not.toContain(secret)
  expect(options.headers['X-Api-Key']).toBe(secret)
  expect(options.redirect).toBe('error')
  expect(JSON.stringify(data)).not.toContain(secret)
  expect(data.items).toHaveLength(1)
  expect(data.items[0].url).toBe(
    'https://www.europeana.eu/item/9200338/Example'
  )
  expect(data.hasNext).toBe(true)
})
it('rejects invalid inputs and a missing key before making requests', async () => {
  for (const [q, p] of [
    ['', 1],
    ['ok', 0],
    ['ok', 1.5],
    ['ok', 101],
    ['x'.repeat(201), 1]
  ])
    await expect(searchNewspapers(q, p)).rejects.toMatchObject({ status: 400 })
  apiKey = undefined
  await expect(searchNewspapers('newspaper')).rejects.toMatchObject({
    status: 503
  })
  expect(request).not.toHaveBeenCalled()
})
it('reports empty results and pagination without substituting a sample', async () => {
  request.mockResolvedValue(response({ success: true, totalResults: 0 }))
  expect(await searchNewspapers('absent')).toMatchObject({
    items: [],
    total: 0,
    hasNext: false
  })
})
it('does not expose upstream failures or credentials', async () => {
  request.mockResolvedValue(response({ error: secret }, 401))
  await expect(searchNewspapers('title')).rejects.toMatchObject({
    status: 503,
    message: 'Europeana did not accept the configured search key.'
  })
  request.mockResolvedValue(response({ error: secret }, 429))
  await expect(searchNewspapers('title')).rejects.toMatchObject({ status: 429 })
  request.mockResolvedValue(response({ success: false, error: secret }))
  await expect(searchNewspapers('title')).rejects.toThrow(
    'Try a simpler keyword'
  )
  request.mockRejectedValue(new Error(secret))
  await expect(searchNewspapers('title')).rejects.toThrow(
    'could not be reached'
  )
})
