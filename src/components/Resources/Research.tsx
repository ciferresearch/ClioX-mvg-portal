import { ReactElement, useState, useMemo } from 'react'
import { motion } from 'motion/react'
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

interface CustomDropdownProps {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  id: string
}

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  id
}: CustomDropdownProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-base font-medium text-gray-700">
          {label}
        </label>
        <div className="relative">
          <button
            id={id}
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center w-36 px-3 py-2.5 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-500 transition-all duration-200 text-base font-medium relative"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="truncate text-gray-900 pr-8">
              {selectedOption?.label}
            </span>
            <ChevronDownIcon
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 absolute right-3 top-1/2 transform -translate-y-1/2 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown Menu */}
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                <div className="py-1">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onChange(option.value)
                        setIsOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-base hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:bg-gray-50 focus:text-gray-900 transition-colors duration-150 ${
                        option.value === value
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-700'
                      }`}
                      role="option"
                      aria-selected={option.value === value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

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
                  {topic.papers.map((paper) => (
                    <li key={paper.id} className="text-base">
                      <a
                        href={paper.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-900 hover:text-amber-700 hover:underline transition-colors duration-200 leading-relaxed"
                      >
                        {paper.authors.join(', ')} ({paper.year}). {paper.title}
                      </a>
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
