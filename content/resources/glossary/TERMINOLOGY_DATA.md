# Terminology Data Structure (terminology.v1.json)

## Top Level

- `version`: string
- `source`: string (browse URL)
- `scraped_at`: string (ISO-like)
- `termsById`: Record<slug, Term>
- `sourcesById`: Record<id, Source>
- `stats`: { terms: number; relationships: number; citations: number }
- `validation` (optional): object (sanity report)

## Term

- `id`: string (slug)
- `url`: string (original term page)
- `language`: string (e.g., "en")
- `labels`: Label[]
- `interpares_definition`: string | null
- `other_definitions`: OtherDefinition[]
- `scope_notes`: string[] // texts parsed from “SN:”
- `general_notes`: string | null
- `relationships_raw`: RelationshipRaw[]
- `relationships_skos`: RelationshipSkos[]
- `citations`: Citation[] // each list item under “Citations”
- `redirect_to`: string | null // when page is alias with only “See: …”

## Label

- `lang`: string
- `text`: string
- `kind`: "pref" | "alt" | "acronym" | "expanded" | "variant"
- `preferred`: boolean

## OtherDefinition

- `lang`: string
- `text`: string
- `source_id`: string | undefined // numeric id, e.g., "778"
- `source_id_raw`: string | undefined // "†778"
- `source_label`: string | undefined // short name without parentheses
- `source_text`: string | undefined // full anchor text
- `source_url`: string | undefined

## Relationships

- `relationships_raw` item
  - `type`: "nt" | "bt" | "rt" | "sf" | "st" | "uf" | "see" | "see_also" // canonical lowercase
  - `to`: string (target slug)
  - `label`: string (link text) optional
- `relationships_skos` item
  - `type`: "narrower" | "broader" | "related" | "equivalent" | "used_for" | "see" | "see_also"
  - `to`: string (target slug)

## Citation

- `source_id`: string | undefined // numeric
- `source_id_raw`: string | undefined // with dagger
- `text`: string // the line/paragraph for that citation

## Source

- `id`: string // numeric (string), used as key
- `id_raw`: string // with dagger
- `citation`: string // full anchor text
- `label`: string | undefined // short label
- `url`: string

## Notes

- Slug is derived from URL last segment (normalized) and used as unique key.
- `sourcesById` de-duplicates citation sources globally; keys are numeric strings; `id_raw` retains the dagger.
- `relationships_raw` types are always lowercase for consistency.
- Prefer `relationships_skos` for UI/filters and keep `relationships_raw` for fidelity.
