/** @jest-environment node */
import { fetchLiveCorpus, getLiveCorpus, retainCorpus } from './live-server'
import { europeanaJson } from './server'
import { ResearchDataset } from './research'
jest.mock('./server', () => ({
  europeanaJson: jest.fn(),
  plainText: (s: string) => s
}))
const request = europeanaJson as jest.Mock
const record = '/9200338/Example'
const manifest = {
  label: { en: ['A newspaper'] },
  navDate: '1918-04-24',
  items: [1, 2].map((n) => ({
    label: { en: [`p. ${n}`] },
    annotations: [
      { id: `https://iiif.europeana.eu/annopage/p${n}?lang=de`, language: 'de' }
    ],
    width: 100,
    height: 200,
    items: [
      {
        items: [
          {
            body: {
              id: 'https://iiif.europeana.eu/image/test/full/full/0/default.jpg'
            }
          }
        ]
      }
    ]
  }))
}
beforeEach(() => request.mockReset())
afterEach(() => jest.restoreAllMocks())
function mockSources(
  rights = 'http://creativecommons.org/publicdomain/mark/1.0/'
) {
  request.mockImplementation(async (url: string) =>
    url.includes('/manifest')
      ? manifest
      : { value: 'Ostende\n  original OCR.', edmRights: rights, language: 'de' }
  )
}
it('fetches current OCR, preserves text slices and identifies partial imports', async () => {
  mockSources()
  const data = await fetchLiveCorpus(record, 1)
  expect(request).toHaveBeenCalledTimes(2)
  expect(data.origin).toBe('live')
  expect(data.totalSourcePages).toBe(2)
  expect(data.pages).toHaveLength(1)
  expect(data.pages[0].text).toBe('Ostende\n  original OCR.')
  expect(data.spans[0].text).toBe(
    data.pages[0].text.slice(data.spans[0].start, data.spans[0].end)
  )
  expect(data.warnings.join(' ')).toContain('first 1 of 2')
})
it('does not substitute a saved sample when acquisition fails', async () => {
  request.mockRejectedValue(new Error('Network unavailable'))
  await expect(fetchLiveCorpus(record, 1)).rejects.toThrow(
    'Network unavailable'
  )
})
it('skips an unavailable page and reports it without inventing coverage', async () => {
  mockSources()
  const original = request.getMockImplementation()
  request.mockImplementation((url: string) =>
    url.endsWith('/p1') ? Promise.reject(new Error('HTTP 404')) : original(url)
  )
  const data = await fetchLiveCorpus(record, 2)
  expect(data.pages).toHaveLength(1)
  expect(data.pages[0].page).toBe('p. 2')
  expect(data.warnings.join(' ')).toContain('HTTP 404')
})
it('rejects unsupported rights and missing OCR instead of indexing them', async () => {
  mockSources('http://rightsstatements.org/vocab/InC/1.0/')
  await expect(fetchLiveCorpus(record, 1)).rejects.toThrow(
    'No usable full text'
  )
})
it('rejects arbitrary destinations and invalid page limits before fetching', async () => {
  await expect(
    fetchLiveCorpus('https://example.com/private', 1)
  ).rejects.toThrow()
  await expect(fetchLiveCorpus(record, 11)).rejects.toThrow('between 1 and 10')
  expect(request).not.toHaveBeenCalled()
})
it('keeps corpora separate and makes expired handles fail explicitly', () => {
  const dataset = {
    version: 'a',
    retrievedAt: '',
    pages: [],
    spans: []
  } as ResearchDataset
  const a = retainCorpus(dataset)
  const b = retainCorpus({ ...dataset, version: 'b' })
  expect(a.corpusId).not.toBe(b.corpusId)
  expect(getLiveCorpus(a.corpusId).version).toBe('a')
  expect(() => getLiveCorpus('00000000-0000-0000-0000-000000000000')).toThrow(
    'expired'
  )
  jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61 * 60 * 1000)
  expect(() => getLiveCorpus(a.corpusId)).toThrow('expired')
})
