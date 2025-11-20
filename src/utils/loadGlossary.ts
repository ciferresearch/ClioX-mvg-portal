import { GlossaryTerm } from '@/components/Resources/types'
import v1 from '../../content/resources/glossary/terminology.v1.json'

// Normalize the first-letter grouping for a term
function normalizeLetter(term: string): string {
  const first = term?.trim()?.charAt(0) || '#'
  const upper = first.toUpperCase()
  return /[A-Z]/.test(upper) ? upper : '#'
}

type V1Term = {
  id: string
  url: string
  language?: string
  labels: Array<{
    lang: string
    text: string
    kind: 'pref' | 'alt' | 'acronym' | 'expanded' | 'variant'
    preferred: boolean
  }>
  interpares_definition?: string | null
  other_definitions?: Array<{
    lang: string
    text: string
    source_id?: string
    source_id_raw?: string
    source_label?: string
    source_text?: string
    source_url?: string
  }>
  scope_notes?: string[]
  general_notes?: string | null
  relationships_skos?: Array<{
    type:
      | 'narrower'
      | 'broader'
      | 'related'
      | 'equivalent'
      | 'used_for'
      | 'see'
      | 'see_also'
      | 'abbr'
    to: string
  }>
  citations?: Array<{
    source_id?: string
    source_id_raw?: string
    text: string
  }>
  redirect_to?: string | null
}

type V1Json = {
  version: string
  source: string
  scraped_at: string
  termsById: Record<string, V1Term>
  sourcesById: Record<
    string,
    {
      id: string
      id_raw: string
      citation: string
      label?: string
      url: string
    }
  >
}

const data = v1 as unknown as V1Json

type RelType =
  | 'broader'
  | 'narrower'
  | 'related'
  | 'equivalent'
  | 'used_for'
  | 'see'
  | 'see_also'
  | 'abbr'
type ResolvedRel = { id: string; term: string; type?: RelType }

function pickDisplayLabel(labels: V1Term['labels']): string {
  if (!labels || labels.length === 0) return ''
  const enPref = labels.find(
    (l) => l.lang.toLowerCase() === 'en' && l.preferred && l.kind === 'pref'
  )
  if (enPref) return enPref.text
  const enPreferred = labels.find(
    (l) => l.lang.toLowerCase() === 'en' && l.preferred
  )
  if (enPreferred) return enPreferred.text
  const anyPreferred = labels.find((l) => l.preferred)
  if (anyPreferred) return anyPreferred.text
  return labels[0].text
}

function labelBySlug(slug: string): string {
  const t = data.termsById[slug]
  if (!t) return slug
  return pickDisplayLabel(t.labels)
}

export const glossaryData: GlossaryTerm[] = Object.values(data.termsById).map(
  (item) => {
    const termDisplay = pickDisplayLabel(item.labels)
    const letter = normalizeLetter(termDisplay)
    const interparesDef = (item.interpares_definition || '').trim()
    const firstOther = (item.other_definitions || []).find(
      (d) => (d?.text || '').trim().length > 0
    )

    const definition =
      interparesDef.length > 0 ? interparesDef : String(firstOther?.text || '')

    const source =
      interparesDef.length > 0
        ? 'InterPARES Trust AI'
        : firstOther?.source_label || undefined

    const byType: Record<'BT' | 'NT' | 'RT' | 'SEE', ResolvedRel[]> = {
      BT: [],
      NT: [],
      RT: [],
      SEE: []
    }
    for (const r of item.relationships_skos || []) {
      const target = r.to
      const label = labelBySlug(target)
      switch (r.type) {
        case 'broader':
          byType.BT.push({ id: target, term: label, type: 'broader' })
          break
        case 'narrower':
          byType.NT.push({ id: target, term: label, type: 'narrower' })
          break
        case 'related':
          byType.RT.push({ id: target, term: label, type: 'related' })
          break
        case 'equivalent':
        case 'used_for':
        case 'see':
        case 'see_also':
        case 'abbr':
          byType.SEE.push({ id: target, term: label, type: r.type })
          break
        default:
          break
      }
    }

    const otherDefs = (item.other_definitions || []).map((d) => {
      const src = d.source_id ? data.sourcesById[d.source_id] : undefined
      return {
        source: d.source_label || src?.label || undefined,
        sourceUrl: d.source_url || src?.url || undefined,
        definition: d.text
      }
    })

    const otherLangs = (item.labels || [])
      .filter((l) => l.lang.toLowerCase() !== 'en')
      .map((l) => ({ language: l.lang, term: l.text }))

    const citations = (item.citations || []).map((c) => {
      const src = c.source_id ? data.sourcesById[c.source_id] : undefined
      return {
        source: src?.label || src?.citation || undefined,
        sourceUrl: src?.url,
        citationId: c.source_id,
        text: c.text
      }
    })

    const redirectTo = item.redirect_to || null

    return {
      id: item.id,
      term: termDisplay,
      definition,
      link: item.url,
      letter,
      source,
      otherDefinitions: otherDefs,
      relationships: {
        BT: byType.BT.map((x) => x.term),
        NT: byType.NT.map((x) => x.term),
        RT: byType.RT.map((x) => x.term),
        SEE: byType.SEE.map((x) => x.term)
      },
      relationshipsResolved: byType,
      otherLanguages: otherLangs,
      citations,
      scopeNotes: item.scope_notes || [],
      generalNotes: item.general_notes || null,
      redirectTo
    } as GlossaryTerm
  }
)

/**
 * Generate a custom SVG image for a glossary term (optimized for list view)
 */
export function generateGlossaryTermImageForList(term: string): string {
  // Truncate term if too long for display
  const displayTerm = term.length > 20 ? term.substring(0, 17) + '...' : term

  // Get first character using destructuring to satisfy ESLint
  const [firstChar] = term

  const svg = `
    <svg width="192" height="128" viewBox="0 0 192 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="192" height="128" fill="#f2e5d5"/>
      
      <!-- Decorative large letter in background -->
      <text x="160" y="100" font-family="IBM Plex Sans, sans-serif" font-size="80" font-weight="700" fill="#e0d5c7" text-anchor="end">
        ${firstChar.toUpperCase()}
      </text>
      
      <!-- GLOSSARY label -->
      <text x="16" y="25" font-family="IBM Plex Sans, sans-serif" font-size="10" font-weight="600" fill="#8b7355" text-transform="uppercase" letter-spacing="1px">
        GLOSSARY
      </text>
      
      <!-- Term name -->
      <text x="16" y="45" font-family="IBM Plex Sans, sans-serif" font-size="14" font-weight="600" fill="#4a3f36" text-anchor="start">
        ${displayTerm
          .split(' ')
          .map(
            (word, i) =>
              `<tspan x="16" dy="${i === 0 ? 0 : 16}">${word}</tspan>`
          )
          .join('')}
      </text>
    </svg>
  `.trim()

  // Convert to base64 data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Generate a custom SVG image for a glossary term (original for grid view)
 */
export function generateGlossaryTermImage(term: string): string {
  // Truncate term if too long for display
  const displayTerm = term.length > 25 ? term.substring(0, 22) + '...' : term

  // Get first character using destructuring to satisfy ESLint
  const [firstChar] = term

  const svg = `
    <svg width="320" height="160" viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="320" height="160" fill="#f2e5d5"/>
      
      <!-- Decorative large letter in background -->
      <text x="280" y="140" font-family="IBM Plex Sans, sans-serif" font-size="120" font-weight="700" fill="#e0d5c7" text-anchor="end">
        ${firstChar.toUpperCase()}
      </text>
      
      <!-- GLOSSARY label -->
      <text x="20" y="35" font-family="IBM Plex Sans, sans-serif" font-size="12" font-weight="600" fill="#8b7355" text-transform="uppercase" letter-spacing="1px">
        GLOSSARY
      </text>
      
      <!-- Term name -->
      <text x="20" y="65" font-family="IBM Plex Sans, sans-serif" font-size="18" font-weight="600" fill="#4a3f36" text-anchor="start">
        ${displayTerm
          .split(' ')
          .map(
            (word, i) =>
              `<tspan x="20" dy="${i === 0 ? 0 : 22}">${word}</tspan>`
          )
          .join('')}
      </text>
      
      <!-- Decorative dots (uncomment to enable) -->
      <!-- <circle cx="25" cy="130" r="3" fill="#c8794d"/> -->
      <!-- <circle cx="35" cy="130" r="2" fill="#d4956b"/> -->
      <!-- <circle cx="43" cy="130" r="1.5" fill="#e0b187"/> -->

    </svg>
  `.trim()

  // Convert to base64 data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Load all glossary terms
 */
export async function loadGlossaryTerms(): Promise<GlossaryTerm[]> {
  // In the future, this could load from a CMS, API, or JSON files
  return Promise.resolve([...glossaryData])
}

// centralize matching logic for search (used by global search and can be reused)
function termMatches(t: GlossaryTerm, searchTerm: string): boolean {
  if (t.term.toLowerCase().includes(searchTerm)) return true
  if (t.definition.toLowerCase().includes(searchTerm)) return true
  // Other definitions (text + source)
  if (
    t.otherDefinitions?.some(
      (d) =>
        d.definition.toLowerCase().includes(searchTerm) ||
        (d.source || '').toLowerCase().includes(searchTerm)
    )
  )
    return true
  // Other language labels
  if (
    t.otherLanguages?.some((ol) =>
      `${ol.language} ${ol.term}`.toLowerCase().includes(searchTerm)
    )
  )
    return true
  // Relationships (BT/NT/RT/SEE)
  const relVals = t.relationships
    ? (Object.values(t.relationships).flat().filter(Boolean) as string[])
    : []
  if (relVals.some((r) => r.toLowerCase().includes(searchTerm))) return true
  // Citations
  if (
    t.citations?.some(
      (c) =>
        (c.text || '').toLowerCase().includes(searchTerm) ||
        (c.source || '').toLowerCase().includes(searchTerm)
    )
  )
    return true
  // Notes
  if (
    (t.generalNotes || '').toLowerCase().includes(searchTerm) ||
    (t.scopeNotes || []).some((sn) => sn.toLowerCase().includes(searchTerm))
  )
    return true
  return false
}

/**
 * Search glossary terms for global search functionality
 */
export function searchGlossaryTerms(query: string): GlossaryTerm[] {
  if (!query.trim()) return []

  const searchTerm = query.toLowerCase()

  const matches = glossaryData.filter((t) => termMatches(t, searchTerm))

  // Return matches as-is (include aliases)
  return matches
}
