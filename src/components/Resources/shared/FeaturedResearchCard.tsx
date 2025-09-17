import { ReactElement } from 'react'
import { motion } from 'motion/react'

interface FeaturedResearchCardProps {
  title: string
  description: string
  paperMeta: {
    type: string
    year: string
    authors: string[]
  }
  ctaLink: string
  ctaText?: string
  imageSrc: string
  imageAlt?: string
}

export default function FeaturedResearchCard({
  title,
  description,
  paperMeta,
  ctaLink,
  ctaText = 'Read Full Paper',
  imageSrc,
  imageAlt = ''
}: FeaturedResearchCardProps): ReactElement {
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
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <motion.section
      className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-center bg-gradient-to-b from-white to-amber-50/30 border border-gray-200 rounded-2xl p-10 mb-7 shadow-sm hover:shadow-lg transition-shadow duration-300"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      aria-labelledby="featured-research-heading"
    >
      {/* Left Content */}
      <div className="space-y-4 text-left">
        <motion.div variants={itemVariants}>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-tight text-[var(--color-primary)] bg-[var(--button-secondary-background)] px-3 py-2 rounded-full mb-3">
            <span>Featured Research</span>
          </div>
        </motion.div>

        <motion.h2
          id="featured-research-heading"
          className="text-2xl lg:text-3xl font-bold leading-tight text-gray-900 mb-3"
          variants={itemVariants}
        >
          {title}
        </motion.h2>

        <motion.p
          className="text-gray-600 text-lg leading-relaxed font-serif max-w-[48ch] mb-4"
          variants={itemVariants}
        >
          {description}
        </motion.p>

        {/* Paper Meta Info */}
        <motion.div
          className="flex flex-col items-start gap-2 mb-4"
          variants={itemVariants}
        >
          <div className="flex items-center text-gray-500 text-base">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="mr-1.5 flex-shrink-0"
            >
              <path d="M6 4h12v16H6z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 4v4h6V4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>
              {paperMeta.type} ({paperMeta.year})
            </span>
          </div>

          <div className="flex items-center text-gray-500 text-base">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              role="img"
              className="mr-1.5 flex-shrink-0"
            >
              <circle
                cx="12"
                cy="8"
                r="3.25"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M5 19c0-3.2 3.1-5 7-5s7 1.8 7 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span>{paperMeta.authors.join(' · ')}</span>
          </div>
        </motion.div>

        <motion.a
          href={ctaLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-bold text-[var(--color-primary)] border-b-2 border-transparent pb-1 hover:text-[#a25e3c] hover:border-[#f2e5d5] transition-colors duration-200"
          variants={itemVariants}
          whileHover={{
            gap: 12,
            transition: { duration: 0.2 }
          }}
        >
          {ctaText}
          <motion.span
            aria-hidden="true"
            whileHover={{
              x: 4,
              transition: { duration: 0.2 }
            }}
          >
            →
          </motion.span>
        </motion.a>
      </div>

      {/* Right Image */}
      <motion.div
        className="relative w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] lg:w-[420px] lg:h-[420px] border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 order-first lg:order-last mx-auto lg:mx-0 flex-shrink-0"
        variants={itemVariants}
      >
        <motion.img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover transition-all duration-[6000ms] ease-out hover:saturate-105"
          initial={{ scale: 1.02 }}
          whileHover={{
            scale: 1.05,
            transition: { duration: 6 }
          }}
          onError={(e) => {
            e.currentTarget.src =
              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+UmVzZWFyY2ggSW1hZ2U8L3RleHQ+Cjwvc3ZnPg=='
          }}
        />
      </motion.div>
    </motion.section>
  )
}
