import { ReactElement } from 'react'
import { motion } from 'motion/react'
import NetworkItem from './NetworkItem'

export default function NetworksList({
  title,
  networks
}: {
  title: string
  networks: number[]
}): ReactElement {
  const content = networks.map((chainId, index) => (
    <motion.div
      key={chainId}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.3,
        ease: 'easeOut'
      }}
    >
      <NetworkItem chainId={chainId} />
    </motion.div>
  ))

  return content.length ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h4
        className="text-xs text-gray-500 dark:text-gray-400 mb-1 mt-2 font-medium uppercase tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {title}
      </motion.h4>

      <motion.div
        className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        whileHover={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          scale: 1.005
        }}
      >
        {content}
      </motion.div>
    </motion.div>
  ) : null
}
