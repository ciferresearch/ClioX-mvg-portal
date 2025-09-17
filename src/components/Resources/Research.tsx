import { ReactElement, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
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

// (removed) Manual height measurement replaced by layout animations

export default function Research(): ReactElement {
  const [sortBy, setSortBy] = useState<ResearchSortBy>('date-desc')
  const [filterGroup, setFilterGroup] = useState<ResearchGroup>('all')
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set())

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

  // Toggle list expansion within a topic box (show 3 by default)
  const toggleListExpand = (topicId: string) => {
    setExpandedLists((prev) => {
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
        className="flex flex-wrap gap-2 sm:gap-6 items-center justify-start"
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
        {processedTopics.map((topic) => {
          const isListExpanded = expandedLists.has(topic.id)
          const hasMoreThanThree = topic.papers.length > 3

          const TopicDetails = (): ReactElement => {
            const alwaysVisiblePapers = topic.papers.slice(0, 3)
            const extraPapers = hasMoreThanThree ? topic.papers.slice(3) : []

            return (
              <div className="antialiased">
                {topic.comingSoon ? (
                  <p className="text-gray-500 italic text-base">
                    Coming soon...
                  </p>
                ) : topic.papers.length === 0 ? (
                  <p className="text-gray-500 italic text-base">
                    {filterGroup !== 'all'
                      ? 'No papers match your filter criteria.'
                      : 'No papers available.'}
                  </p>
                ) : (
                  <>
                    <ul className="space-y-4">
                      {alwaysVisiblePapers.map((paper) => (
                        <li key={paper.id} className="text-base">
                          <a
                            href={paper.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 hover:text-amber-700 hover:underline transition-colors duration-200 leading-relaxed"
                          >
                            {paper.authors.join(', ')} ({paper.year}).{' '}
                            {paper.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                    {hasMoreThanThree && (
                      <AnimatePresence initial={false}>
                        {isListExpanded && (
                          <motion.div
                            key={`${topic.id}-extra`}
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            transition={{
                              duration: 0.32,
                              ease: [0.22, 1, 0.36, 1]
                            }}
                            style={{ overflow: 'hidden' }}
                          >
                            <motion.ul
                              className="space-y-4 mt-4"
                              initial="hidden"
                              animate="visible"
                              variants={{
                                hidden: {},
                                visible: {
                                  transition: {
                                    staggerChildren: 0.04,
                                    delayChildren: 0.06
                                  }
                                }
                              }}
                            >
                              {extraPapers.map((paper) => (
                                <motion.li
                                  key={paper.id}
                                  className="text-base"
                                  variants={{
                                    hidden: { opacity: 0, y: 6 },
                                    visible: { opacity: 1, y: 0 }
                                  }}
                                  transition={{
                                    duration: 0.18,
                                    ease: [0.4, 0, 0.2, 1]
                                  }}
                                >
                                  <a
                                    href={paper.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-900 hover:text-amber-700 hover:underline transition-colors duration-200 leading-relaxed"
                                  >
                                    {paper.authors.join(', ')} ({paper.year}).{' '}
                                    {paper.title}
                                  </a>
                                </motion.li>
                              ))}
                            </motion.ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </>
                )}
                {!topic.comingSoon && hasMoreThanThree && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => toggleListExpand(topic.id)}
                      aria-expanded={isListExpanded}
                      className="text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                    >
                      {isListExpanded
                        ? 'Show less'
                        : `Show more (${topic.papers.length - 3})`}
                    </button>
                  </div>
                )}
              </div>
            )
          }

          return (
            <motion.div
              key={topic.id}
              className="bg-white border border-gray-200 border-t-4 rounded-lg p-6 transition-[box-shadow] duration-200"
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

              <div className="hidden md:block">
                <TopicDetails />
              </div>

              <AnimatePresence initial={false}>
                {expandedTopics.has(topic.id) && (
                  <motion.div
                    key={`${topic.id}-mobile`}
                    className="md:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <TopicDetails />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
