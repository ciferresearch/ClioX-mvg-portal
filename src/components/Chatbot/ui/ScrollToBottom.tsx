import { ReactElement } from 'react'
import { motion } from 'framer-motion'

export default function ScrollToBottom({
  onClick
}: {
  onClick: () => void
}): ReactElement {
  return (
    <motion.button
      onClick={onClick}
      className="absolute left-1/2 -translate-x-1/2 bottom-30 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-20"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Scroll to latest"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </motion.button>
  )
}
