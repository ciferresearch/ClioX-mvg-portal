import { ReactElement, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { IconBrandLinkedin } from '@tabler/icons-react'
import { ResearchSortBy, ResearchGroup } from './types'
import {
  getResearchTopics,
  sortResearchPapers,
  filterResearchPapers,
  getSortOptions,
  getResearchGroups
} from '@/utils/loadResearch'
import FeaturedResearchCard from './shared/FeaturedResearchCard'
import CustomDropdown from './shared/CustomDropdown'

export default function Research(): ReactElement {
  const [sortBy, setSortBy] = useState<ResearchSortBy>('date-desc')
  const [filterGroup, setFilterGroup] = useState<ResearchGroup>('all')
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  const researchTopics = getResearchTopics()
  const sortOptions = getSortOptions()
  const filterOptions = getResearchGroups()

  // Toggle accordion for mobile
  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(topicId)) {
        newSet.delete(topicId)
      } else {
        newSet.add(topicId)
      }
      return newSet
    })
  }

  // Process papers with sort and filter
  const processedTopics = useMemo(() => {
    return researchTopics.map((topic) => {
      let papers = [...topic.papers]

      // Apply group filter
      papers = filterResearchPapers(papers, filterGroup)

      // Apply sorting
      papers = sortResearchPapers(papers, sortBy)

      return {
        ...topic,
        papers
      }
    })
  }, [researchTopics, sortBy, filterGroup])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.7, staggerChildren: 0.12 }
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

  // Helper: format ISO date → Month D, YYYY
  const formatPrettyDate = (iso?: string) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return iso
    }
  }

  // Helper: shorter date for compact list (e.g., "Oct 28, 2025")
  const formatShortDate = (iso?: string) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return iso
    }
  }

  // Build compact meta line for presentations with authors first
  // Order: Authors • Event • Location • Date [Role]
  const buildPresentationMeta = (paper: any) => {
    const segs: string[] = []
    if (paper?.authors && paper.authors.length > 0) {
      segs.push(
        paper.authors.length > 2
          ? `${paper.authors[0]} et al.`
          : paper.authors.join(', ')
      )
    }
    if (paper?.eventName) segs.push(paper.eventName)
    if (paper?.location) segs.push(paper.location)
    if (paper?.date) segs.push(formatShortDate(paper.date))
    return segs.join(' • ') + (paper?.role ? ` [${paper.role}]` : '')
  }

  // Topic cards: use fade only to avoid any perceived parent shift after animation
  const topicCardVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
    }
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Featured Research Card */}
      <motion.div variants={itemVariants}>
        <FeaturedResearchCard
          title="Clio-X: A Web3 Solution for Privacy-Preserving AI Access to Digital Archives"
          description="By integrating technical safeguards with community-based oversight, Clio-X offers a novel model to ethically deploy AI in cultural heritage contexts."
          paperMeta={{
            type: 'arXiv preprint',
            year: '2025',
            authors: [
              'Lemieux',
              'Gil',
              'Molosiwa',
              'Zhou',
              'Li',
              'Garcia',
              'Cubillo',
              'Wang'
            ]
          }}
          ctaLink="https://arxiv.org/pdf/2507.08853"
          imageSrc="/content/resources/research/clio.jpg"
          imageAlt="Classical relief sculpture of Clio, the muse of history, in flowing robes with a scroll"
        />
      </motion.div>

      {/* Sort & Filter Controls */}
      <motion.div
        className="flex flex-wrap gap-6 items-center justify-start"
        variants={itemVariants}
      >
        <CustomDropdown
          label="Sort by:"
          value={sortBy}
          options={sortOptions}
          onChange={(value) => setSortBy(value as ResearchSortBy)}
          id="sort-select"
        />

        <CustomDropdown
          label="Filter by:"
          value={filterGroup}
          options={filterOptions}
          onChange={(value) => setFilterGroup(value as ResearchGroup)}
          id="filter-select"
        />
      </motion.div>

      {/* Research Topics Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={containerVariants}
      >
        {processedTopics.map((topic) => (
          <motion.div
            key={topic.id}
            className="bg-white border border-gray-200 border-t-4 rounded-lg p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            style={{ borderTopColor: '#c8794d' }}
            variants={topicCardVariants}
          >
            {/* Topic Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 m-0">
                {topic.title}
              </h3>
              {/* Mobile accordion toggle */}
              <button
                onClick={() => toggleTopic(topic.id)}
                className="md:hidden p-1 text-gray-500 hover:text-gray-700"
                aria-label={`Toggle ${topic.title} section`}
              >
                {expandedTopics.has(topic.id) ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Topic Content */}
            <div
              className={`
              transition-all duration-300 overflow-hidden
              ${expandedTopics.has(topic.id) ? 'max-h-96' : 'max-h-0'}
              md:max-h-none
            `}
            >
              {topic.comingSoon ? (
                <p className="text-gray-500 italic text-base">Coming soon...</p>
              ) : topic.papers.length === 0 ? (
                <p className="text-gray-500 italic text-base">
                  {filterGroup !== 'all'
                    ? 'No papers match your filter criteria.'
                    : 'No papers available.'}
                </p>
              ) : (
                <ul className="space-y-4">
                  {(topic.id === 'presentations'
                    ? topic.papers.slice(0, 3)
                    : topic.papers
                  ).map((paper) => (
                    <li key={paper.id} className="text-base">
                      {topic.id === 'public-relations' ? (
                        <a
                          href={paper.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex w-full items-start gap-2 text-gray-900 hover:text-amber-700 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700/40 rounded-md"
                          title={`${paper.title} (${paper.year})`}
                        >
                          <IconBrandLinkedin
                            size={16}
                            className="text-amber-700 opacity-80 group-hover:opacity-100 self-start mt-[3px]"
                            aria-hidden="true"
                          />
                          <span
                            className="min-w-0 flex-1 leading-snug underline-offset-2 group-hover:underline after:ml-1 after:content-['↗'] after:text-gray-400 group-hover:after:text-amber-700"
                            aria-label={paper.title}
                          >
                            <span className="text-sm md:text-base">
                              {paper.title}
                            </span>{' '}
                            <span className="text-xs text-gray-400 group-hover:text-amber-700">
                              {paper.year}
                            </span>
                          </span>
                        </a>
                      ) : (
                        <a
                          href={paper.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block text-gray-900 transition-colors duration-200 leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700/40 rounded-md"
                          title={
                            topic.id === 'presentations'
                              ? `${paper.authors.join(', ')}. ${
                                  paper.title
                                } — ${paper.eventName}${
                                  paper.location ? `, ${paper.location}` : ''
                                }${
                                  paper.date
                                    ? `, ${formatPrettyDate(paper.date)}`
                                    : ''
                                }${paper.role ? ` [${paper.role}]` : ''}`
                              : `${paper.authors.join(', ')} (${paper.year}). ${
                                  paper.title
                                }`
                          }
                        >
                          {topic.id === 'presentations' ? (
                            <>
                              <div className="truncate transition-colors duration-200 group-hover:text-amber-700 group-hover:underline">
                                {paper.title}
                              </div>
                              <div className="text-gray-600 text-sm transition-colors duration-200 group-hover:text-amber-700/80 group-hover:underline">
                                {buildPresentationMeta(paper)}
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="transition-colors duration-200 group-hover:text-amber-700 group-hover:underline">
                                {paper.authors.join(', ')} ({paper.year}).{' '}
                                {paper.title}
                              </span>
                            </>
                          )}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
