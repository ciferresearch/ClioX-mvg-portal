export interface ResourceCard {
  id: string
  title: string
  description: string
  image: string
  link: string
  tag: string
  category: string
  content?: string
  tags?: string[]
}

export interface Tab {
  id: string
  label: string
}

// New glossary types
export interface GlossaryTerm {
  id: string
  term: string
  definition: string
  link?: string
  letter: string
  source?: string
  // Enhanced optional fields (from InterPARES JSON)
  otherDefinitions?: Array<{
    source?: string
    sourceUrl?: string
    definition: string
  }>
  relationships?: {
    BT?: string[]
    NT?: string[]
    RT?: string[]
    SEE?: string[]
  }
  relationshipsResolved?: {
    BT?: Array<{ id: string; term: string; type?: 'broader' }>
    NT?: Array<{ id: string; term: string; type?: 'narrower' }>
    RT?: Array<{ id: string; term: string; type?: 'related' }>
    SEE?: Array<{
      id: string
      term: string
      type?: 'equivalent' | 'used_for' | 'see' | 'see_also' | 'abbr'
    }>
  }
  otherLanguages?: Array<{
    language: string
    term: string
  }>
  citations?: Array<{
    source?: string
    sourceUrl?: string
    citationId?: string
    text?: string
  }>
  scopeNotes?: string[]
  generalNotes?: string | null
  redirectTo?: string | null
}

export interface GlossarySection {
  letter: string
  terms: GlossaryTerm[]
}

// Research types
export interface ResearchPaper {
  id: string
  title: string
  authors: string[]
  year: number
  link: string
  group: string
  topic: string
  abstract?: string
  doi?: string
  // Optional fields primarily for presentations
  date?: string
  endDate?: string
  eventName?: string
  location?: string
  role?: string
}

export interface ResearchTopic {
  id: string
  title: string
  papers: ResearchPaper[]
  comingSoon?: boolean
}

export type ResearchSortBy =
  | 'date-desc'
  | 'date-asc'
  | 'title-asc'
  | 'title-desc'
  | 'author-asc'
  | 'author-desc'

export type ResearchGroup =
  | 'all'
  | 'privacy'
  | 'governance'
  | 'education'
  | 'presentations'
  | 'public-relations'
