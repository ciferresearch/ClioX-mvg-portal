import { ReactElement } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { ResearchGroup, ResearchTopic } from './types'

export default function ResearchTopicCard({
  topic,
  isExpandedTopic,
  isListExpanded,
  onToggleTopic,
  onToggleListExpand,
  filterGroup,
  onViewAll
}: {
  topic: ResearchTopic
  isExpandedTopic: boolean
  isListExpanded: boolean
  onToggleTopic: (topicId: string) => void
  onToggleListExpand: (topicId: string) => void
  filterGroup: ResearchGroup
  onViewAll: (topicId: string) => void
}): ReactElement {
  const hasMoreThanThree = topic.papers.length > 3

  const topicCardVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
    }
  }

  const TopicDetails = (): ReactElement => {
    const alwaysVisiblePapers = topic.papers.slice(0, 3)
    const extraPapers = hasMoreThanThree ? topic.papers.slice(3) : []

    return (
      <div className="antialiased">
        {topic.comingSoon ? (
          <p className="text-gray-500 italic text-base">Coming soon...</p>
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
                    {paper.authors.join(', ')} ({paper.year}). {paper.title}
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
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => onToggleListExpand(topic.id)}
              aria-expanded={isListExpanded}
              className="text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
            >
              {isListExpanded
                ? 'Show less'
                : `Show more (${topic.papers.length - 3})`}
            </button>
            <button
              type="button"
              onClick={() => onViewAll(topic.id)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 underline"
            >
              View all
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      className="bg-white border border-gray-200 border-t-4 rounded-lg p-6 transition-[box-shadow] duration-200 hover:shadow-lg hover:-translate-y-1  transition-all duration-200"
      style={{ borderTopColor: '#c8794d' }}
      variants={topicCardVariants}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 m-0">{topic.title}</h3>
        <button
          onClick={() => onToggleTopic(topic.id)}
          className="md:hidden p-1 text-gray-500 hover:text-gray-700"
          aria-label={`Toggle ${topic.title} section`}
        >
          {isExpandedTopic ? (
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
        {isExpandedTopic && (
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
}
