import { ReactElement, useState, useMemo } from 'react'
import { motion } from 'motion/react'

interface LessonCard {
  id: string
  title: string
  subject: string
  videoId: string
  featured: boolean
  popular: boolean
  duration?: string
  stats: string
}

interface FilterPill {
  id: string
  label: string
  value: string
}

// Sample lesson data - in real app this would come from props or API
const sampleLessons: LessonCard[] = [
  {
    id: '1',
    title: 'Blockchain From an Archival Science Perspective',
    subject: 'blockchain',
    videoId: 'EmHBY3BuzLE',
    featured: true,
    popular: true,
    stats: 'Video lesson'
  },
  {
    id: '2',
    title: 'The Blockchain Genesis Story',
    subject: 'blockchain',
    videoId: 'dX-x4RQdI14',
    featured: true,
    popular: true,
    stats: 'Video lesson'
  }
]

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

export default function Academy({
  lessons = sampleLessons
}: AcademyProps): ReactElement {
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredLessons = useMemo(() => {
    if (activeFilter === 'all') return lessons

    return lessons.filter((lesson) => {
      if (activeFilter === 'featured') return lesson.featured
      if (activeFilter === 'popular') return lesson.popular
      return lesson.subject === activeFilter
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
        {filteredLessons.map((lesson) => (
          <motion.a
            key={lesson.id}
            href={`https://www.youtube.com/watch?v=${lesson.videoId}`}
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
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${lesson.videoId}?rel=0&modestbranding=1&playsinline=1`}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 w-full h-full border-0 rounded-t-xl"
              />
            </div>

            {/* Lesson Info */}
            <div className="px-3 py-2.5 flex flex-col flex-grow space-y-1.5">
              {/* Subject Badge */}
              <div className="self-start">
                <span className="inline-block bg-[var(--button-secondary-background)] text-[var(--color-primary)] text-xs font-bold uppercase px-1.5 py-0.5 rounded-lg">
                  {lesson.subject.charAt(0).toUpperCase() +
                    lesson.subject.slice(1)}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base md:text-lg font-extrabold text-gray-900 leading-snug line-clamp-2 max-w-[28ch]">
                {lesson.title}
              </h3>

              {/* Stats */}
              <div className="mt-auto pt-0.5">
                <span className="text-xs text-gray-400">{lesson.stats}</span>
              </div>
            </div>
          </motion.a>
        ))}
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
