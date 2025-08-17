import { ReactElement } from 'react'
import { motion } from 'motion/react'
import { ResourceCard } from './types'
import ResourceGridCard from './shared/ResourceGridCard'

interface ResourceArticlesProps {
  cards: ResourceCard[]
  loading?: boolean
  gridClassName?: string
}

export default function ResourceArticles({
  cards,
  loading = false,
  gridClassName = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-5 pb-16'
}: ResourceArticlesProps): ReactElement {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.7, staggerChildren: 0.12 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  return (
    <motion.div
      className={gridClassName}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      viewport={{ once: true, margin: '-10%' }}
    >
      {loading ? (
        <div className="col-span-full text-center py-16">
          <p className="text-gray-500 text-lg">Loading resources...</p>
        </div>
      ) : (
        cards.map((card) => (
          <motion.div key={card.id} variants={itemVariants}>
            <ResourceGridCard card={card} />
          </motion.div>
        ))
      )}

      {!loading && cards.length === 0 && (
        <div className="col-span-full text-center py-16">
          <p className="text-gray-500 text-lg">No resource articles found.</p>
        </div>
      )}
    </motion.div>
  )
}
