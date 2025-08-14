import {
  ReactElement,
  useState,
  useMemo,
  useEffect,
  useRef,
  useLayoutEffect
} from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/router'
import SearchIcon from '@images/search.svg'
import { ResourceCard, Tab } from './types'
import {
  loadResourcesByCategory,
  generateResourceCardImageForList
} from '@/utils/loadResources'
import {
  searchGlossaryTerms,
  generateGlossaryTermImage,
  generateGlossaryTermImageForList
} from '@/utils/loadGlossary'
import {
  searchResearchPapers,
  generateResearchImage,
  generateResearchImageForList
} from '@/utils/loadResearch'
import Glossary from './Glossary'
import Research from './Research'
import Academy from './Academy'
import Events from './Events'
import ResourceGridCard from './shared/ResourceGridCard'
import ResourceArticles from './ResourceArticles'

// Resource card item moved to separate component

const tabs: Tab[] = [
  { id: 'articles', label: 'Resource Articles' },
  { id: 'academy', label: 'Clio-X Academy' },
  { id: 'events', label: 'Events' },
  // { id: 'guides', label: 'Guides' }, // temporarily hidden
  { id: 'glossary', label: 'Glossary' },
  { id: 'research', label: 'Research' }
]

interface ResourcesProps {
  initialArticles?: ResourceCard[]
}

export default function Resources({
  initialArticles = []
}: ResourcesProps): ReactElement {
  const [activeTab, setActiveTab] = useState('articles')
  const [searchQuery, setSearchQuery] = useState('')
  const [resourceCards, setResourceCards] =
    useState<ResourceCard[]>(initialArticles)
  const [allResourceCards, setAllResourceCards] = useState<ResourceCard[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const router = useRouter()

  // Guides tab commented out above; no special filtering needed

  // Sliding underline state
  const tabsContainerRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [underlineStyle, setUnderlineStyle] = useState<{
    left: number
    width: number
    top: number
  }>({ left: 0, width: 0, top: 0 })
  const [underlineReady, setUnderlineReady] = useState(false)

  const updateUnderline = () => {
    const activeEl = tabRefs.current[activeTab]
    const containerEl = tabsContainerRef.current
    if (!activeEl || !containerEl) return

    const activeRect = activeEl.getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()
    const { left: activeLeft, width, bottom: activeBottom } = activeRect
    const { left: containerLeft, top: containerTop } = containerRect
    const left = activeLeft - containerLeft
    const top = activeBottom - containerTop - 2 // just above container bottom
    setUnderlineStyle({ left, width, top })
  }

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/').then(() => {
      // Small delay to ensure page has loaded
      setTimeout(() => {
        const contactSection = document.querySelector('#contact')
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    })
  }

  // Load all resources for search functionality
  useEffect(() => {
    const loadAllResources = async () => {
      try {
        const allResources: ResourceCard[] = []

        // Always load articles from metadata files to get full content
        const articles = await loadResourcesByCategory('articles')
        allResources.push(...articles)

        // Load other resource types
        for (const tab of tabs.filter((t) => t.id !== 'articles')) {
          const resources = await loadResourcesByCategory(tab.id)
          allResources.push(...resources)
        }

        setAllResourceCards(allResources)
      } catch (error) {
        console.error('Error loading all resources:', error)
      }
    }

    loadAllResources()
  }, [initialArticles])

  // Load resources when active tab changes
  useEffect(() => {
    const loadResources = async () => {
      // If we have initial articles and we're on the articles tab, use them
      if (activeTab === 'articles' && initialArticles.length > 0) {
        setResourceCards(initialArticles)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const resources = await loadResourcesByCategory(activeTab)
        setResourceCards(resources)
      } catch (error) {
        console.error('Error loading resources:', error)
        setResourceCards([])
      } finally {
        setLoading(false)
      }
    }

    loadResources()
  }, [activeTab, initialArticles])

  // Recalculate underline when active tab or layout changes
  useLayoutEffect(() => {
    if (searchQuery.trim() !== '') return
    // Measure synchronously before paint to avoid initial slide-in
    updateUnderline()
    setUnderlineReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery])

  useEffect(() => {
    if (searchQuery.trim() !== '') return
    const onResize = () => updateUnderline()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Animations for search results (grid & list)
  const resultsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.7,
        staggerChildren: 0.12
      }
    }
  }

  const resultsItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  // For list view, avoid vertical translate to remove perceived parent shift
  const resultsListItemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const filteredCards = useMemo(() => {
    // If there's a search query, search across all resources
    if (searchQuery.trim() !== '') {
      const searchTerm = searchQuery.toLowerCase()

      // Search regular resource cards and optimize images for list view
      const matchingCards = allResourceCards
        .filter(
          (card) =>
            card.title.toLowerCase().includes(searchTerm) ||
            card.description.toLowerCase().includes(searchTerm) ||
            card.tag.toLowerCase().includes(searchTerm) ||
            // Search through article content
            (card.content && card.content.toLowerCase().includes(searchTerm)) ||
            // Search through tags array
            (card.tags &&
              card.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
        )
        .map((card) => ({
          ...card,
          image:
            viewMode === 'list' &&
            (!card.image || card.image.includes('placeholder'))
              ? generateResourceCardImageForList(card.title, card.category)
              : card.image
        }))

      // Search glossary terms and convert to resource cards for display
      const glossaryMatches = searchGlossaryTerms(searchQuery)
      const glossaryCards: ResourceCard[] = glossaryMatches.map((term) => ({
        id: `glossary-${term.id}`,
        title: term.term,
        description:
          term.definition.substring(0, 150) +
          (term.definition.length > 150 ? '...' : ''),
        image:
          viewMode === 'list'
            ? generateGlossaryTermImageForList(term.term)
            : generateGlossaryTermImage(term.term),
        link: term.link || '#',
        tag: 'GLOSSARY TERM',
        category: 'glossary',
        content: term.definition
      }))

      // Search research papers and convert to resource cards for display
      const researchMatches = searchResearchPapers(searchQuery)
      const researchCards: ResourceCard[] = researchMatches.map((paper) => ({
        id: `research-${paper.id}`,
        title: paper.title,
        description:
          paper.abstract?.substring(0, 150) +
            (paper.abstract && paper.abstract.length > 150 ? '...' : '') ||
          `Research paper by ${paper.authors.join(', ')} (${paper.year})`,
        image:
          viewMode === 'list'
            ? generateResearchImageForList(paper.title)
            : generateResearchImage(paper.title),
        link: paper.link,
        tag: 'RESEARCH',
        category: 'research',
        content: paper.abstract || '',
        tags: [paper.group, ...paper.authors]
      }))

      return [...matchingCards, ...glossaryCards, ...researchCards]
    }

    // Otherwise, filter by current tab and optimize images for list view
    return resourceCards
      .filter((card) => card.category === activeTab)
      .map((card) => ({
        ...card,
        image:
          viewMode === 'list' &&
          (!card.image || card.image.includes('placeholder'))
            ? generateResourceCardImageForList(card.title, card.category)
            : card.image
      }))
  }, [resourceCards, allResourceCards, activeTab, searchQuery, viewMode])

  // Show search results count when searching
  const searchResultsText = useMemo(() => {
    if (searchQuery.trim() === '') return null

    const count = filteredCards.length
    if (count === 0) return `No results found for "${searchQuery}"`
    if (count === 1) return `1 result found for "${searchQuery}"`
    return `${count} results found for "${searchQuery}"`
  }, [filteredCards.length, searchQuery])

  return (
    <div className="bg-white -mb-16">
      {/* Hero Section */}
      <section className="py-16">
        <div className="flex flex-wrap gap-10 items-center justify-center">
          <div className="flex-1 min-w-[280px]">
            <h1 className="text-4xl md:text-5xl font-bold mb-5 text-black">
              The Reading Room
            </h1>
            <p className="max-w-2xl text-lg text-gray-600 leading-relaxed">
              Welcome to your go-to hub for valuable resources and everything
              you need to get the most out of Clio-X. If you don&apos;t see what
              you need, feel free to{' '}
              <a
                href="/#contact"
                onClick={handleContactClick}
                className="text-amber-700 underline hover:text-amber-800"
              >
                get in touch
              </a>
              .
            </p>
          </div>
          <div className="flex-1 min-w-[300px] max-w-[560px]">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-xl">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube-nocookie.com/embed/3v4yBHtCGGk?rel=0&modestbranding=1&playsinline=1"
                title="ClioX Overview"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="mt-4">
              <span className="inline-block bg-amber-50 text-amber-700 text-xs font-semibold uppercase px-3 py-1 rounded-xl">
                Featured
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <div>
        <div className="w-full mb-10">
          <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex items-center">
            <SearchIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search across all resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-base text-gray-700 placeholder-gray-500 border-none outline-none bg-transparent"
            />
          </div>
          {searchResultsText && (
            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="text-sm text-gray-600">{searchResultsText}</div>
              {searchQuery.trim() !== '' && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">View:</span>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-2 py-1 rounded-md border transition-colors ${
                      viewMode === 'grid'
                        ? 'border-amber-700 text-amber-700 bg-amber-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-pressed={viewMode === 'grid'}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-2 py-1 rounded-md border transition-colors ${
                      viewMode === 'list'
                        ? 'border-amber-700 text-amber-700 bg-amber-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-pressed={viewMode === 'list'}
                  >
                    List
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs - hide when searching */}
        {searchQuery.trim() === '' && (
          <div
            ref={tabsContainerRef}
            className="relative flex flex-wrap justify-center gap-4 py-5 mb-10"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[tab.id] = el)}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center px-4 py-2.5 cursor-pointer font-semibold text-base h-12 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'text-amber-700'
                    : 'text-black hover:text-amber-700'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Sliding underline */}
            {underlineReady ? (
              <motion.span
                aria-hidden
                className="absolute bg-amber-700 block rounded"
                initial={false}
                animate={{
                  x: underlineStyle.left,
                  width: underlineStyle.width
                }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 46,
                  mass: 0.7
                }}
                style={{
                  height: 2,
                  left: 0,
                  top: underlineStyle.top,
                  willChange: 'transform,width'
                }}
              />
            ) : (
              <span
                aria-hidden
                className="absolute bg-amber-700 block rounded"
                style={{
                  height: 2,
                  left: underlineStyle.left,
                  width: underlineStyle.width,
                  top: underlineStyle.top,
                  visibility: 'hidden'
                }}
              />
            )}
          </div>
        )}

        {/* Content Area */}
        {searchQuery.trim() !== '' ? (
          viewMode === 'grid' ? (
            /* Grid view for search */
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-5 pb-16"
              variants={resultsContainerVariants}
              initial="hidden"
              animate="visible"
              key={`search-grid-${searchQuery}`}
            >
              {filteredCards.map((card) => (
                <motion.div key={card.id} variants={resultsItemVariants}>
                  <ResourceGridCard card={card} />
                </motion.div>
              ))}
              {filteredCards.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <p className="text-gray-500 text-lg">
                    No resources found matching your search.
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Try using different keywords or clear your search to browse
                    all resources.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            /* List view for search */
            <motion.div
              className="mt-5 pb-16 space-y-4"
              variants={resultsContainerVariants}
              initial="hidden"
              animate="visible"
              key={`search-list-${searchQuery}`}
            >
              {filteredCards.map((card) => (
                <motion.div
                  key={card.id}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                  style={{ minHeight: 180 }}
                  variants={resultsListItemVariants}
                >
                  <div className="flex">
                    <div className="w-56 h-32 flex-shrink-0">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            generateResourceCardImageForList(
                              card.title,
                              card.category
                            )
                        }}
                      />
                    </div>
                    <div className="px-5 pt-5 pb-7 flex flex-col gap-1 flex-1 min-w-0">
                      <div className="text-xs font-semibold uppercase text-gray-600">
                        {card.tag}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-black truncate">
                        {card.title}
                      </h3>
                      <p className="text-base text-gray-600 leading-relaxed line-clamp-3 min-h-[theme(spacing.16)] md:min-h-[theme(spacing.20)]">
                        {card.description}
                      </p>
                      <div className="mt-auto pt-2">
                        <a
                          href={card.link}
                          className="text-amber-700 font-semibold text-sm hover:underline hover:text-amber-800 transition-colors duration-200"
                        >
                          Read more →
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredCards.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-lg">
                    No resources found matching your search.
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Try using different keywords or clear your search to browse
                    all resources.
                  </p>
                </div>
              )}
            </motion.div>
          )
        ) : activeTab === 'glossary' ? (
          <div className="pb-16">
            <Glossary />
          </div>
        ) : activeTab === 'research' ? (
          <div className="pb-16">
            <Research />
          </div>
        ) : activeTab === 'academy' ? (
          <div className="pb-16">
            <Academy />
          </div>
        ) : activeTab === 'events' ? (
          <div className="pb-16">
            <Events />
          </div>
        ) : (
          /* Resource Cards Grid for other tabs */
          <ResourceArticles cards={filteredCards} loading={loading} />
        )}
      </div>
    </div>
  )
}
