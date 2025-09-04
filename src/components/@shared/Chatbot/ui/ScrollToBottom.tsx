import { ReactElement } from 'react'
import { motion } from 'motion/react'
import { IconArrowDown } from '@tabler/icons-react'

export default function ScrollToBottom({
  onClick
}: {
  onClick: () => void
}): ReactElement {
  return (
    <motion.button
      onClick={onClick}
      className="absolute left-1/2 -translate-x-1/2 bottom-40 bg-white/90 backdrop-blur-sm text-gray-600 rounded-full shadow-lg hover:bg-white hover:text-gray-800 hover:shadow-xl border border-gray-200/50 transition-all duration-200 z-20 cursor-pointer w-11 h-11 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Scroll to latest"
    >
      <IconArrowDown className="w-6 h-6" strokeWidth={1.75} />
    </motion.button>
  )
}
