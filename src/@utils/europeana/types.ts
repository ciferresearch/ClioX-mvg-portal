import type { CorpusOrigin, CorpusProvenance } from './corpus-source'

export interface NewspaperPage {
  id: string
  recordId: string
  title: string
  date: string
  language: string
  page: string
  source: string
  fulltextUrl: string
  rights: string
  attribution: string
  text: string
  retrievedAt: string
}

export interface NewspaperChunk {
  id: string
  content: string
  metadata: {
    source: string
    title: string
    date: string
    language: string
    page: string
    recordId: string
    rights: string
    category: string
  }
}

export interface Corpus {
  pages: NewspaperPage[]
  chunks: NewspaperChunk[]
  warnings: string[]
  origin: CorpusOrigin
  provenance?: CorpusProvenance
}

export interface SentimentResult {
  pageId: string
  label: 'negative' | 'neutral' | 'positive' | 'uncertain'
  evidence: string
  explanation: string
}
