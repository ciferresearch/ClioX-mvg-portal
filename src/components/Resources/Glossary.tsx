import { ReactElement, useState, useMemo, useEffect } from 'react'
import SearchIcon from '@images/search.svg'
import { GlossaryTerm, GlossarySection } from './types'
import { loadGlossaryTerms } from '@/utils/loadGlossary'

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

  // Use local search query
  const effectiveSearchQuery = localSearchQuery

  // Group terms by letter and filter based on search
  const glossarySections: GlossarySection[] = useMemo(() => {
    let filteredTerms = glossaryData

    // Apply search filter
    if (effectiveSearchQuery.trim() !== '') {
      const searchTerm = effectiveSearchQuery.toLowerCase()
      filteredTerms = glossaryData.filter(
        (term) =>
          term.term.toLowerCase().includes(searchTerm) ||
          term.definition.toLowerCase().includes(searchTerm)
      )
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

  return (
    <div className="max-w-6xl mx-auto">
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
              className="ml-4 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors duration-200"
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

      {/* Glossary Sections */}
      <div className="space-y-12">
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
            <section
              key={section.letter}
              id={`section-${section.letter}`}
              className="grid grid-cols-[80px_1fr] gap-5"
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
                  <div key={term.id} className="glossary-term">
                    {term.link ? (
                      <a
                        href={term.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-gray-900 hover:text-amber-700 transition-colors duration-200 border-b-2 border-transparent hover:border-amber-700 inline-block group"
                      >
                        {term.term}
                        <span className="ml-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                          →
                        </span>
                      </a>
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-900">
                        {term.term}
                      </h3>
                    )}
                    <p className="mt-2 text-gray-700 leading-relaxed max-w-2xl font-serif">
                      {term.definition}
                      {term.source && (
                        <span className="block mt-1 text-sm text-gray-500 italic">
                          — {term.source}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
