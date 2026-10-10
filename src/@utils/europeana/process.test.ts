/** @jest-environment node */
import sample from '../../../content/europeana/sample.json'
import {
  chunkPages,
  corpusStats,
  parseSentiment,
  recordIdFromInput,
  SAMPLE_RECORD
} from './process'
import { parseChatStream } from './stream'

describe('Europeana corpus preparation', () => {
  it('accepts source links and rejects arbitrary hosts and traversal', () => {
    expect(
      recordIdFromInput(`https://www.europeana.eu/en/item${SAMPLE_RECORD}`)
    ).toBe(SAMPLE_RECORD)
    expect(() => recordIdFromInput('https://evil.test/item/123/abc')).toThrow()
    expect(() => recordIdFromInput('/123/../abc')).toThrow()
  })

  it('retains every OCR word across bounded, overlapping passages with source metadata', () => {
    const page = {
      ...sample[0],
      text: Array.from({ length: 720 }, (_, index) => `word${index}`).join(' ')
    }
    const chunks = chunkPages([page])
    expect(chunks).toHaveLength(3)
    expect(new Set(chunks.map((chunk) => chunk.id)).size).toBe(3)
    expect(chunks[0].content.split(' ')).toHaveLength(300)
    expect(chunks[1].content.startsWith('word250 ')).toBe(true)
    expect(chunks[2].content.endsWith('word719')).toBe(true)
    expect(chunks[0].metadata.source).toBe(page.fulltextUrl)
    expect(page.text.split(' ')).toHaveLength(720)
  })

  it('uses real dates and never invents a date for undated pages', () => {
    const stats = corpusStats([
      { ...sample[0], date: '', text: 'Zeebrügge Zeebrügge und Hamburg' }
    ])
    expect(stats.timeline).toEqual([])
    expect(stats.wordCloud.wordCloudData).toContainEqual({
      value: 'zeebrügge',
      count: 2
    })
    expect(
      stats.wordCloud.wordCloudData.some((word) => word.value === 'und')
    ).toBe(false)
  })

  it('rejects fabricated evidence instead of silently assigning neutral sentiment', () => {
    const result = parseSentiment(
      JSON.stringify([
        {
          pageId: sample[0].id,
          label: 'positive',
          evidence: 'A quotation that does not exist in the source.'
        }
      ]),
      sample
    )
    expect(result.every((entry) => entry.label === 'uncertain')).toBe(true)
    expect(result.every((entry) => entry.evidence === '')).toBe(true)
  })

  it('keeps a classification only when its quotation is present in OCR', () => {
    const evidence = sample[0].text.slice(0, 90)
    const [result] = parseSentiment(
      JSON.stringify([
        {
          pageId: sample[0].id,
          label: 'neutral',
          evidence,
          explanation: 'Publication information.'
        }
      ]),
      [sample[0]]
    )
    expect(result.label).toBe('neutral')
    expect(result.evidence).toBe(evidence.trim())
  })

  it('accepts model JSON followed by the existing backend citation footer', () => {
    const evidence = sample[0].text.slice(0, 90)
    const answer =
      '```json\n' +
      JSON.stringify([{ pageId: sample[0].id, label: 'neutral', evidence }]) +
      '\n```\nSources cited: [Source: newspaper]'
    expect(parseSentiment(answer, [sample[0]])[0].label).toBe('neutral')
  })

  it('resolves a supplied evidence ID to the exact original OCR', () => {
    const result = parseSentiment(
      JSON.stringify([
        {
          pageKey: 'p1',
          label: 'negative',
          evidenceId: 'p1-e6',
          explanation: 'Exploratory label.'
        }
      ]),
      [sample[0]]
    )[0]
    expect(result.evidence).toBe(sample[0].text.slice(3250, 3900))
    expect(result.label).toBe('negative')
  })
})

describe('ClioX streaming response adapter', () => {
  it('ignores status text and keeps evidence from earlier events', () => {
    const events = [
      {
        type: 'status',
        content: 'Generating',
        sources: [
          {
            source: 'https://api.europeana.eu/fulltext/test',
            content_preview: 'Evidence'
          }
        ]
      },
      { type: 'chunk', content: 'Grounded answer.' },
      { type: 'complete', content: 'Response finished', sources: null }
    ]
      .map((event) => `data: ${JSON.stringify(event)}\r\n\r\n`)
      .join('')
    const result = parseChatStream(events)
    expect(result.response).toBe('Grounded answer.')
    expect(result.sources).toHaveLength(1)
  })

  it('fails on incomplete streams and explicit backend errors', () => {
    expect(() =>
      parseChatStream('data: {"type":"chunk","content":"Partial"}\n\n')
    ).toThrow('interrupted')
    expect(() =>
      parseChatStream('data: {"type":"error","message":"Offline"}\n\n')
    ).toThrow('Offline')
  })
})
