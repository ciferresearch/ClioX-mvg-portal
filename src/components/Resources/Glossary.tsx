import { ReactElement, useState, useMemo, useEffect } from 'react'
import { motion } from 'motion/react'
import SearchIcon from '@images/search.svg'
import { GlossaryTerm, GlossarySection } from './types'
import { loadGlossaryTerms } from '@/utils/loadGlossary'
import { useRouter } from 'next/router'

const alphabet = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  '#'
]

export default function Glossary(): ReactElement {
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [glossaryData, setGlossaryData] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null)
  const router = useRouter()

  // Navigation helpers must be defined before any effects that use them
  const openTermDetail = (termId: string) => {
    setSelectedTermId(termId)
    const nextQuery = { ...router.query, term: termId }
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
      shallow: true
    })
  }

  const closeTermDetail = () => {
    setSelectedTermId(null)
    const { term, ...rest } = router.query
    router.replace({ pathname: router.pathname, query: rest }, undefined, {
      shallow: true
    })
  }

  // Load glossary data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadGlossaryTerms()
        setGlossaryData(data)
      } catch (error) {
        console.error('Error loading glossary data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Sync selected term with query param ?term=
  useEffect(() => {
    const termFromQuery = (router.query.term as string) || null
    if (termFromQuery && termFromQuery !== selectedTermId) {
      setSelectedTermId(termFromQuery)
    }
    if (!termFromQuery && selectedTermId) {
      // If query cleared externally, close the detail view
      setSelectedTermId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.term])

  const allTermsSorted = useMemo(() => {
    return [...glossaryData].sort((a, b) => a.term.localeCompare(b.term))
  }, [glossaryData])

  const selectedTerm = useMemo(() => {
    return glossaryData.find((t) => t.id === selectedTermId) || null
  }, [glossaryData, selectedTermId])

  // Do not auto-redirect alias terms; show SEE/links in detail

  // Map from term name (lowercased) to id for quick relationship navigation
  const termIndex = useMemo(() => {
    const map = new Map<string, string>()
    glossaryData.forEach((t) => map.set(t.term.toLowerCase(), t.id))
    return map
  }, [glossaryData])

  // Fast lookups to avoid repeated scans
  const idSet = useMemo(
    () => new Set(glossaryData.map((t) => t.id)),
    [glossaryData]
  )
  const idToTerm = useMemo(() => {
    const m = new Map<string, string>()
    glossaryData.forEach((t) => m.set(t.id, t.term))
    return m
  }, [glossaryData])

  // openTermDetail/closeTermDetail are defined above

  // Use local search query
  const effectiveSearchQuery = localSearchQuery

  // Group terms by letter and filter based on search
  const glossarySections: GlossarySection[] = useMemo(() => {
    const query = effectiveSearchQuery.trim().toLowerCase()

    let filteredTerms: GlossaryTerm[]

    if (query !== '') {
      // When searching, include aliases; do not collapse to canonical
      filteredTerms = glossaryData.filter(
        (t) =>
          t.term.toLowerCase().includes(query) ||
          t.definition.toLowerCase().includes(query)
      )
    } else {
      // No search: show all, including aliases
      filteredTerms = glossaryData
    }

    // Apply letter filter
    if (activeFilter && activeFilter !== '#') {
      filteredTerms = filteredTerms.filter(
        (term) => term.letter === activeFilter
      )
    } else if (activeFilter === '#') {
      filteredTerms = filteredTerms.filter((term) => /^[0-9]/.test(term.term))
    }

    // Group by letter
    const sections: GlossarySection[] = []
    const groupedTerms = filteredTerms.reduce((acc, term) => {
      const { letter } = term
      if (!acc[letter]) {
        acc[letter] = []
      }
      acc[letter].push(term)
      return acc
    }, {} as Record<string, GlossaryTerm[]>)

    // Convert to sections array and sort
    Object.keys(groupedTerms)
      .sort()
      .forEach((letter) => {
        sections.push({
          letter,
          terms: groupedTerms[letter].sort((a, b) =>
            a.term.localeCompare(b.term)
          )
        })
      })

    return sections
  }, [effectiveSearchQuery, activeFilter, glossaryData])

  // Get available letters (letters that have terms)
  const availableLetters = useMemo(() => {
    return new Set(glossaryData.map((term) => term.letter))
  }, [glossaryData])

  const handleLetterClick = (letter: string) => {
    // If a detail view is open, close it when changing letter
    if (selectedTermId) {
      closeTermDetail()
    }
    if (activeFilter === letter) {
      setActiveFilter(null) // Clear filter if same letter clicked
    } else {
      setActiveFilter(letter)
      // Scroll to section if it exists
      setTimeout(() => {
        const section = document.getElementById(`section-${letter}`)
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  const searchResultsText = useMemo(() => {
    if (effectiveSearchQuery.trim() === '' && !activeFilter) return null

    const count = glossarySections.reduce(
      (total, section) => total + section.terms.length,
      0
    )

    if (effectiveSearchQuery.trim() !== '') {
      if (count === 0) return `No terms found for "${effectiveSearchQuery}"`
      if (count === 1) return `1 term found for "${effectiveSearchQuery}"`
      return `${count} terms found for "${effectiveSearchQuery}"`
    }

    if (activeFilter) {
      if (count === 0) return `No terms found for letter "${activeFilter}"`
      if (count === 1) return `1 term found for letter "${activeFilter}"`
      return `${count} terms found for letter "${activeFilter}"`
    }

    return null
  }, [glossarySections, effectiveSearchQuery, activeFilter])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Loading glossary...</p>
        </div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.75, staggerChildren: 0.12 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Local search bar */}
      {
        <div className="max-w-md mx-auto mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search Terms"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 text-base"
            />
          </div>
        </div>
      }

      {/* Alphabet Navigation */}
      <nav className="sticky top-0 bg-white z-10 border-b border-gray-200 py-3 mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          {alphabet.map((letter) => {
            const hasTerms =
              availableLetters.has(letter) ||
              (letter === '#' &&
                glossaryData.some((term) => /^[0-9]/.test(term.term)))
            const isActive = activeFilter === letter

            return (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                disabled={!hasTerms}
                className={`px-2 py-1 text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? 'text-amber-700 cursor-pointer'
                    : hasTerms
                    ? 'text-gray-700 hover:text-amber-700 cursor-pointer'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                {letter}
              </button>
            )
          })}
          {(activeFilter || effectiveSearchQuery.trim() !== '') && (
            <button
              onClick={() => {
                setActiveFilter(null)
                setLocalSearchQuery('')
              }}
              className="ml-4 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors duration-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </nav>

      {/* Search Results Text */}
      {searchResultsText && (
        <div className="mb-6 text-sm text-gray-600 text-center">
          {searchResultsText}
        </div>
      )}

      {/* Glossary Content Area: list view or detail subpage */}
      {selectedTerm ? (
        <motion.div
          className="max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={closeTermDetail}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
            >
              ← Back to Glossary
            </button>
            <div className="text-sm text-gray-500">{selectedTerm.letter}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {selectedTerm.term}
            </h2>
            <div className="mt-2 text-sm text-gray-500">
              {selectedTerm.source && (
                <span>Source: {selectedTerm.source}</span>
              )}
              {selectedTerm.link && (
                <>
                  {selectedTerm.source ? <span className="mx-2">·</span> : null}
                  <a
                    href={selectedTerm.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline hover:text-amber-800"
                  >
                    Open external reference ↗
                  </a>
                </>
              )}
            </div>
            <div className="mt-5 text-gray-800 leading-relaxed text-lg font-serif">
              {selectedTerm.definition}
            </div>

            {/* Enhanced: Notes */}
            {(selectedTerm.generalNotes ||
              (selectedTerm.scopeNotes &&
                selectedTerm.scopeNotes.length > 0)) && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Notes
                </h3>
                {selectedTerm.generalNotes && (
                  <p className="text-gray-800 font-serif">
                    {selectedTerm.generalNotes}
                  </p>
                )}
                {selectedTerm.scopeNotes &&
                  selectedTerm.scopeNotes.length > 0 && (
                    <ul className="mt-3 list-disc list-inside space-y-1 text-gray-800 font-serif">
                      {selectedTerm.scopeNotes.map((sn, idx) => (
                        <li key={idx}>{sn}</li>
                      ))}
                    </ul>
                  )}
              </div>
            )}

            {/* Enhanced: Other Definitions */}
            {selectedTerm.otherDefinitions &&
              selectedTerm.otherDefinitions.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Other definitions
                  </h3>
                  <div className="space-y-4">
                    {selectedTerm.otherDefinitions.map((d, idx) => (
                      <div
                        key={idx}
                        className="border-l-4 border-amber-200 pl-3"
                      >
                        <p className="text-gray-800 font-serif">
                          {d.definition}
                        </p>
                        {(d.source || d.sourceUrl) && (
                          <div className="mt-1 text-sm text-gray-500 italic">
                            — {d.source}{' '}
                            {d.sourceUrl && (
                              <a
                                href={d.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-700 hover:underline hover:text-amber-800"
                              >
                                (link)
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Enhanced: Relationships */}
            {selectedTerm.relationships &&
              Object.values(selectedTerm.relationships).some(
                (arr) => Array.isArray(arr) && arr.length > 0
              ) && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Relationships
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {(['BT', 'NT', 'RT', 'SEE'] as const).map((key) => {
                      const list = selectedTerm.relationships?.[key] || []
                      if (!list || list.length === 0) return null
                      const labels: Record<'BT' | 'NT' | 'RT' | 'SEE', string> =
                        {
                          BT: 'Broader terms (BT)',
                          NT: 'Narrower terms (NT)',
                          RT: 'Related terms (RT)',
                          SEE: 'See'
                        }
                      return (
                        <div
                          key={key}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="text-sm font-semibold text-gray-700 mb-2">
                            {labels[key]}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              type RelT =
                                | 'equivalent'
                                | 'used_for'
                                | 'see'
                                | 'see_also'
                                | 'abbr'
                                | 'broader'
                                | 'narrower'
                                | 'related'
                              type Resolved = {
                                id: string
                                term: string
                                type?: RelT
                              }
                              const fallback: Resolved[] = list.map((n) => ({
                                id: termIndex.get(n.toLowerCase()) || '',
                                term: n
                              }))
                              const resolvedList: Resolved[] =
                                (selectedTerm.relationshipsResolved?.[key] as
                                  | Resolved[]
                                  | undefined) ?? fallback
                              return resolvedList.map((rel) => {
                                const { id, term: name, type } = rel
                                const canOpen =
                                  Boolean(id) &&
                                  glossaryData.some((t) => t.id === id)
                                const handleClick = () => {
                                  if (canOpen) {
                                    openTermDetail(id)
                                  } else {
                                    setActiveFilter(null)
                                    setLocalSearchQuery(name)
                                    closeTermDetail()
                                  }
                                }
                                return (
                                  <button
                                    key={name}
                                    onClick={handleClick}
                                    title={
                                      canOpen ? 'Open term' : 'Search term'
                                    }
                                    className="px-2 py-1 text-xs rounded-full bg-white border border-gray-200 text-gray-700 hover:border-amber-300 hover:text-amber-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    {name}
                                  </button>
                                )
                              })
                            })()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            {/* Enhanced: Other Languages */}
            {selectedTerm.otherLanguages &&
              selectedTerm.otherLanguages.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Other languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTerm.otherLanguages.map((ol, idx) => (
                      <span
                        key={`${ol.language}-${idx}`}
                        className="px-2 py-1 text-xs rounded-full bg-gray-50 border border-gray-200 text-gray-700"
                      >
                        {ol.language}: {ol.term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Enhanced: Citations */}
            {selectedTerm.citations && selectedTerm.citations.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Citations
                </h3>
                <div className="space-y-4">
                  {selectedTerm.citations.map((c, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-3 border-gray-200 bg-gray-50"
                    >
                      <div className="text-sm text-gray-700">
                        {c.source}{' '}
                        {c.sourceUrl && (
                          <a
                            href={c.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-700 hover:underline hover:text-amber-800"
                          >
                            (link)
                          </a>
                        )}
                      </div>
                      {c.text && (
                        <p className="mt-2 text-gray-700 text-sm whitespace-pre-line">
                          {c.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prev/Next navigation */}
            <div className="mt-8 flex items-center justify-between">
              {(() => {
                const idx = allTermsSorted.findIndex(
                  (t) => t.id === selectedTerm.id
                )
                const prev = idx > 0 ? allTermsSorted[idx - 1] : null
                const next =
                  idx >= 0 && idx < allTermsSorted.length - 1
                    ? allTermsSorted[idx + 1]
                    : null
                return (
                  <>
                    <button
                      disabled={!prev}
                      onClick={() => prev && openTermDetail(prev.id)}
                      className={`px-3 py-1.5 text-sm rounded-md border ${
                        prev
                          ? 'border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 cursor-pointer'
                          : 'border-gray-200 text-gray-300 cursor-not-allowed'
                      } transition-colors`}
                    >
                      ← {prev ? prev.term : 'Previous'}
                    </button>
                    <button
                      disabled={!next}
                      onClick={() => next && openTermDetail(next.id)}
                      className={`px-3 py-1.5 text-sm rounded-md border ${
                        next
                          ? 'border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 cursor-pointer'
                          : 'border-gray-200 text-gray-300 cursor-not-allowed'
                      } transition-colors`}
                    >
                      {next ? next.term : 'Next'} →
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div className="space-y-12" variants={containerVariants}>
          {glossarySections.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                {effectiveSearchQuery.trim() !== '' || activeFilter
                  ? 'No terms found matching your criteria.'
                  : 'No glossary terms available.'}
              </p>
              {(effectiveSearchQuery.trim() !== '' || activeFilter) && (
                <p className="text-gray-400 text-sm mt-2">
                  Try using different keywords or browse all terms.
                </p>
              )}
            </div>
          ) : (
            glossarySections.map((section) => (
              <motion.section
                key={section.letter}
                id={`section-${section.letter}`}
                className="grid grid-cols-[80px_1fr] gap-5"
                variants={itemVariants}
              >
                {/* Large Letter */}
                <div className="flex justify-center">
                  <h2 className="text-6xl font-bold text-gray-200 leading-none select-none">
                    {section.letter}
                  </h2>
                </div>

                {/* Terms */}
                <div className="space-y-8">
                  {section.terms.map((term) => (
                    <motion.div
                      key={term.id}
                      className="glossary-term"
                      variants={itemVariants}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => openTermDetail(term.id)}
                          className="text-left text-lg font-semibold text-gray-900 hover:text-amber-700 transition-colors duration-200 border-b-2 border-transparent hover:border-amber-700 inline-block cursor-pointer"
                        >
                          {term.term}
                        </button>
                        {term.link && (
                          <a
                            href={term.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-500 hover:text-amber-700"
                            title="Open external reference"
                          >
                            ↗
                          </a>
                        )}
                      </div>
                      <p className="mt-2 text-gray-700 leading-relaxed max-w-2xl font-serif">
                        {term.definition}
                        {term.source && (
                          <span className="block mt-1 text-sm text-gray-500 italic">
                            — {term.source}
                          </span>
                        )}
                        {term.redirectTo && (
                          <span className="block mt-1 text-xs text-gray-500">
                            Alias of{' '}
                            {(() => {
                              const targetName = idToTerm.get(term.redirectTo)
                              return targetName || term.redirectTo
                            })()}
                          </span>
                        )}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
