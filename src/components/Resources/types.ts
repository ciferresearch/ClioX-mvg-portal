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
