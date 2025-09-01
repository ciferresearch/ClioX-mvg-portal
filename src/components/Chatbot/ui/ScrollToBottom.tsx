import { ReactElement } from 'react'
import { motion } from 'motion/react'

export default function ScrollToBottom({
  onClick
}: {
  onClick: () => void
}): ReactElement {
  return (
    <motion.button
      onClick={onClick}
      className="absolute left-1/2 -translate-x-1/2 bottom-40 bg-white/90 backdrop-blur-sm text-gray-600 p-3 rounded-full shadow-lg hover:bg-white hover:text-gray-800 hover:shadow-xl border border-gray-200/50 transition-all duration-200 z-20 cursor-pointer"
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
