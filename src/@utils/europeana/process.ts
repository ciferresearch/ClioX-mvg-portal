import type { NewspaperPage, NewspaperChunk, SentimentResult } from './types'

export const SAMPLE_RECORD = '/9200338/BibliographicResource_3000094647100'

// Accept identifiers and Europeana item links, never arbitrary fetch URLs.
export function recordIdFromInput(input: string): string {
  let path = input.trim()
  if (path.startsWith('https://')) {
    const url = new URL(path)
    if (url.hostname !== 'www.europeana.eu' || url.port || url.username) {
      throw new Error('Use a Europeana item URL or /dataset/record identifier.')
    }
    const segments = url.pathname.split('/').filter(Boolean)
    const itemIndex =
      segments[0] === 'item' ? 0 : segments[1] === 'item' ? 1 : -1
    if (itemIndex < 0) throw new Error('Use a Europeana item URL.')
    path = '/' + segments.slice(itemIndex + 1).join('/')
  }
  if (!/^\/[0-9]+\/[A-Za-z0-9_-]+$/.test(path)) {
    throw new Error('Expected /dataset/record or a Europeana item URL.')
  }
  return path
}

// Keep the original OCR on the page; normalize only the derived RAG input.
export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\u00ad/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function chunkPages(pages: NewspaperPage[]): NewspaperChunk[] {
  const chunks: NewspaperChunk[] = []
  for (const page of pages) {
    const words = normalizeText(page.text).split(' ').filter(Boolean)
    for (let start = 0; start < words.length; start += 250) {
      const content = words.slice(start, start + 300).join(' ')
      if (!content) continue
      chunks.push({
        id: `${page.id}:${start}`,
        content,
        metadata: {
          source: page.fulltextUrl,
          title: page.title,
          date: page.date,
          language: page.language,
          page: page.page,
          recordId: page.recordId,
          rights: page.rights,
          category: 'europeana-newspaper'
        }
      })
      if (start + 300 >= words.length) break
    }
  }
  return chunks
}

const STOP_WORDS = new Set(
  'the and of to a in is it for on with as at by from an be that this was were are not und die der das den dem des ein eine einer einem einen eines im in zu von mit auf für ist es am an als auch sich nicht nach wird werden bei aus hat haben oder um zum zur aber wir sie er ihr ihre bis über durch noch nur vor wie so ich war sind uns man unter sein mehr wurde alle hatte dann jetzt bereits diese unserer waren worden dieser gegen schon sehr teil unsere ihm ihn kann muß seiner wieder wurden allen daß dass'.split(
    ' '
  )
)

export function corpusStats(pages: NewspaperPage[]) {
  const counts = new Map<string, number>()
  const dates = new Map<string, number>()
  let words = 0
  const histogram = pages.map((page) => {
    const tokens = page.text.toLocaleLowerCase().match(/[\p{L}]{3,}/gu) || []
    words += tokens.length
    for (const token of tokens) {
      if (!STOP_WORDS.has(token))
        counts.set(token, (counts.get(token) || 0) + 1)
    }
    if (page.date) dates.set(page.date, (dates.get(page.date) || 0) + 1)
    return { value: tokens.length }
  })
  return {
    words,
    histogram,
    timeline: [...dates].sort().map(([time, count]) => ({ time, count })),
    wordCloud: {
      wordCloudData: [...counts]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 60)
        .map(([value, count]) => ({ value, count }))
    }
  }
}

// Existing RAG adds source-citation prose after the model's JSON response.
// Find a complete JSON value without treating brackets inside strings as syntax.
export function extractModelJson(text: string): unknown {
  for (let start = 0; start < text.length; start++) {
    if (text[start] !== '[' && text[start] !== '{') continue
    let depth = 0
    let quoted = false
    let escaped = false
    for (let end = start; end < text.length; end++) {
      const char = text[end]
      if (quoted) {
        if (escaped) escaped = false
        else if (char === '\\') escaped = true
        else if (char === '"') quoted = false
      } else if (char === '"') quoted = true
      else if (char === '[' || char === '{') depth++
      else if (char === ']' || char === '}') {
        depth--
        if (depth === 0) {
          try {
            return JSON.parse(text.slice(start, end + 1))
          } catch {
            break
          }
        }
      }
    }
  }
  throw new Error('No complete JSON result was returned.')
}

// Evidence identifiers let the model select OCR without rewriting garbled letters.
export function sentimentExcerpts(pages: NewspaperPage[]) {
  return pages.map((page, index) => {
    const pageKey = `p${index + 1}`
    const text = page.text.slice(0, 6500)
    const passages = []
    for (let start = 0; start < text.length; start += 650) {
      passages.push({
        evidenceId: `${pageKey}-e${passages.length + 1}`,
        text: text.slice(start, start + 650)
      })
    }
    return { pageKey, language: page.language, passages }
  })
}

export function parseSentiment(
  answer: string,
  pages: NewspaperPage[]
): SentimentResult[] {
  let parsed: unknown
  try {
    parsed = extractModelJson(answer)
  } catch {
    throw new Error('The model did not return valid analysis. Please retry.')
  }
  if (!Array.isArray(parsed)) throw new Error('Expected an analysis array.')
  const entries = parsed
  const excerpts = sentimentExcerpts(pages)
  return pages.map((page, index) => {
    const item = entries.find(
      (entry) =>
        entry?.pageId === page.id || entry?.pageKey === excerpts[index].pageKey
    )
    const selectedEvidence = excerpts[index].passages.find(
      (passage) => passage.evidenceId === item?.evidenceId
    )
    const evidence =
      selectedEvidence?.text ||
      (typeof item?.evidence === 'string' ? item.evidence.trim() : '')
    const validLabel = [
      'negative',
      'neutral',
      'positive',
      'uncertain'
    ].includes(item?.label)
    // A model-generated quote must occur in the actual OCR before we chart it.
    const grounded =
      evidence.length >= 12 &&
      normalizeText(page.text.slice(0, 6500)).includes(normalizeText(evidence))
    return {
      pageId: page.id,
      label: validLabel && grounded ? item.label : 'uncertain',
      evidence: grounded ? evidence : '',
      explanation:
        validLabel && grounded && typeof item.explanation === 'string'
          ? item.explanation.slice(0, 600)
          : 'No verifiable evidence was returned; excluded from sentiment counts.'
    }
  })
}

export function retrievePassages(question: string, pages: NewspaperPage[]) {
  const terms = [
    ...new Set(
      (question.toLowerCase().match(/[\p{L}]{4,}/gu) || []).filter(
        (term) =>
          !STOP_WORDS.has(term) &&
          ![
            'what',
            'according',
            'newspaper',
            'report',
            'about',
            'does',
            'happened',
            'text',
            'only',
            'from',
            'that',
            'this'
          ].includes(term)
      )
    )
  ]
  const chunks = chunkPages(pages)
  return chunks
    .map((chunk) => {
      const text = chunk.content.toLowerCase()
      const score = terms.reduce((sum, term) => {
        const occurrence = chunks.filter((candidate) =>
          candidate.content.toLowerCase().includes(term)
        ).length
        return (
          sum +
          (text.includes(term)
            ? Math.log(1 + chunks.length / (1 + occurrence))
            : 0)
        )
      }, 0)
      return { ...chunk, score }
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}
