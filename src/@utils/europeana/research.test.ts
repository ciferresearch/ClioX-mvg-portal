/** @jest-environment node */
import {
  coveredCharacters,
  textWindows,
  resolveAnswer,
  resolveLabels,
  scanRegionUrl,
  selectEvidence
} from './research'
import type { NewspaperPage } from './types'
import type { ResearchPage } from './research'

const page: NewspaperPage = {
  id: '/1/p',
  recordId: '/1',
  title: 'Test',
  date: '1918-04-24',
  language: 'de',
  page: 'p. 1',
  source: '',
  fulltextUrl: 'https://api.europeana.eu/fulltext/1/p',
  rights: '',
  attribution: '',
  text: 'Ostende\n\noriginal  OCR',
  retrievedAt: ''
}

describe('Evidence desk source integrity', () => {
  it('preserves raw whitespace and offset identity across overlapping windows', () => {
    const source = {
      ...page,
      text: Array.from({ length: 701 }, (_, i) => `word${i}`).join('\n  ')
    }
    const spans = textWindows(source)
    expect(
      spans.every((s) => s.text === source.text.slice(s.start, s.end))
    ).toBe(true)
    expect(spans[spans.length - 1].end).toBe(source.text.length)
    expect(coveredCharacters(spans)).toBe(source.text.length)
  })
  it('does not double-count overlapping text and distinguishes pages', () => {
    const base = textWindows(page)[0]
    expect(
      coveredCharacters([
        { ...base, start: 0, end: 10 },
        { ...base, start: 5, end: 20 },
        { ...base, pageId: 'other', start: 0, end: 5 }
      ])
    ).toBe(25)
  })
  it('rejects invented IDs and unsupported answers without evidence', () => {
    const spans = textWindows(page)
    expect(() =>
      resolveAnswer(
        {
          answer: 'A claim',
          insufficientEvidence: false,
          evidenceIds: ['invented']
        },
        spans
      )
    ).toThrow('unknown source')
    expect(() =>
      resolveAnswer(
        { answer: 'A claim', insufficientEvidence: false, evidenceIds: [] },
        spans
      )
    ).toThrow('no source')
    const answer = resolveAnswer(
      {
        answer: 'A claim',
        insufficientEvidence: false,
        evidenceIds: [spans[0].id]
      },
      spans
    )
    expect(answer.evidence[0].text).toBe(page.text)
  })
  it('does not attach irrelevant evidence to abstention', () => {
    const spans = textWindows(page)
    expect(
      resolveAnswer(
        {
          answer: 'Unknown',
          insufficientEvidence: true,
          evidenceIds: [spans[0].id]
        },
        spans
      ).evidence
    ).toEqual([])
  })
  it('keeps missing labels uncertain and model labels unreviewed', () => {
    const spans = textWindows(page)
    expect(resolveLabels([], spans)[0].label).toBe('uncertain')
    expect(
      resolveLabels([{ spanId: spans[0].id, label: 'mixed' }], spans)[0]
        .humanReviewed
    ).toBe(false)
  })
  it('finds source names and does not force unrelated lexical matches', () => {
    expect(
      selectEvidence('What about Ostende?', textWindows(page))
    ).toHaveLength(1)
    expect(
      selectEvidence('Apple stock price 2026', textWindows(page))
    ).toHaveLength(0)
  })
  it('builds region requests only for the known image host', () => {
    const source = {
      ...page,
      imageUrl: 'https://iiif.europeana.eu/image/test/full/full/0/default.jpg'
    } as ResearchPage
    const span = {
      ...textWindows(page)[0],
      region: { x: 10, y: 20, width: 200, height: 300 }
    }
    expect(scanRegionUrl(source, span)).toBe(
      'https://iiif.europeana.eu/image/test/10,20,200,300/200,/0/default.jpg'
    )
    expect(
      scanRegionUrl(
        { ...source, imageUrl: 'https://example.com/image.jpg' },
        span
      )
    ).toBe('')
  })
})
