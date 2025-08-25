import { ReactElement, useState, useMemo } from 'react'
import { motion } from 'motion/react'

interface LessonCard {
  id: string
  title: string
  description: string
  image: string
  link: string
  content?: string
  tags?: string[]
  category: string
  tag: string
}

interface FilterPill {
  id: string
  label: string
  value: string
}

const filterPills: FilterPill[] = [
  { id: 'all', label: 'All', value: 'all' },
  { id: 'featured', label: 'Featured Lessons', value: 'featured' },
  { id: 'popular', label: 'Popular Lessons', value: 'popular' },
  { id: 'ai', label: 'Artificial Intelligence', value: 'technology' },
  { id: 'data', label: 'Data', value: 'data' },
  { id: 'design', label: 'Design', value: 'design' },
  {
    id: 'accessibility',
    label: 'Digital Accessibility',
    value: 'accessibility'
  },
  { id: 'preservation', label: 'Digital Preservation', value: 'preservation' },
  { id: 'heritage', label: 'Cultural Heritage', value: 'heritage' },
  { id: 'cybersecurity', label: 'Cybersecurity', value: 'governance' },
  { id: 'governance', label: 'Information Governance', value: 'governance' },
  { id: 'viz', label: 'Information Visualization', value: 'viz' },
  { id: 'analytics', label: 'Text Analytics', value: 'text-analytics' },
  { id: 'privacy', label: 'Privacy', value: 'privacy' },
  { id: 'blockchain', label: 'Blockchain', value: 'blockchain' }
]

interface AcademyProps {
  lessons?: LessonCard[]
}

export default function Academy({ lessons = [] }: AcademyProps): ReactElement {
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredLessons = useMemo(() => {
    if (activeFilter === 'all') return lessons

    return lessons.filter((lesson) => {
      if (activeFilter === 'featured') {
        return lesson.tags?.includes('Featured Lessons') || false
      }
      if (activeFilter === 'popular') {
        return lesson.tags?.includes('Popular Lessons') || false
      }

      // Check if any of the lesson's tags match the filter
      return (
        lesson.tags?.some((tag) => {
          const filterValue = filterPills.find(
            (pill) => pill.value === activeFilter
          )?.label
          return filterValue && tag === filterValue
        }) || false
      )
    })
  }, [lessons, activeFilter])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  // Extract video ID from YouTube link
  const getVideoId = (link: string): string => {
    const match = link.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    )
    return match ? match[1] : ''
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Heading */}
      <motion.h2
        className="text-2xl font-bold text-gray-900 mb-6"
        variants={itemVariants}
      >
        What would you like to learn about?
      </motion.h2>

      {/* Filter Pills */}
      <motion.div
        className="flex flex-wrap gap-2 md:gap-3 py-2 mb-6"
        variants={itemVariants}
      >
        {filterPills.map((pill) => (
          <button
            key={pill.id}
            onClick={() => setActiveFilter(pill.value)}
            className={`
              flex-shrink-0 px-3 py-1.5 text-sm font-semibold rounded-full cursor-pointer 
              whitespace-nowrap transition-all duration-200 hover:scale-105
              ${
                activeFilter === pill.value
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {pill.label}
          </button>
        ))}
      </motion.div>

      {/* Lesson Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        variants={containerVariants}
      >
        {filteredLessons.map((lesson) => {
          const videoId = getVideoId(lesson.link)
          return (
            <motion.a
              key={lesson.id}
              href={lesson.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${lesson.title} — open video in a new tab`}
              className="block cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ring-offset-2 ring-offset-white flex flex-col"
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                y: -4
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Video Thumbnail */}
              <div className="relative w-full aspect-video">
                {videoId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 w-full h-full border-0 rounded-t-xl"
                  />
                ) : (
                  <img
                    src={lesson.image}
                    alt={lesson.title}
                    className="absolute inset-0 w-full h-full object-cover rounded-t-xl"
                  />
                )}
              </div>

              {/* Lesson Info */}
              <div className="px-3 py-2.5 flex flex-col flex-grow space-y-1.5">
                {/* Subject Badge */}
                <div className="self-start">
                  <span className="inline-block bg-[var(--button-secondary-background)] text-[var(--color-primary)] text-xs font-bold uppercase px-1.5 py-0.5 rounded-lg">
                    {lesson.tag}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base md:text-lg font-extrabold text-gray-900 leading-snug line-clamp-2 max-w-[28ch]">
                  {lesson.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {lesson.description}
                </p>

                {/* Tags */}
                {lesson.tags && lesson.tags.length > 0 && (
                  <div className="mt-auto pt-0.5">
                    <div className="flex flex-wrap gap-1.5">
                      {lesson.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full truncate max-w-30"
                          title={tag}
                        >
                          {tag}
                        </span>
                      ))}
                      {lesson.tags.length > 2 && (
                        <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                          +{lesson.tags.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.a>
          )
        })}
      </motion.div>

      {/* Empty State */}
      {filteredLessons.length === 0 && (
        <motion.div className="text-center py-16" variants={itemVariants}>
          <p className="text-gray-500 text-lg mb-2">
            No lessons found for this filter.
          </p>
          <p className="text-gray-400 text-sm">
            Try selecting a different category or clear your filter.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
