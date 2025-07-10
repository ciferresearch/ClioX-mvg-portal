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
