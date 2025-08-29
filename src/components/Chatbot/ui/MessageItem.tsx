import { ReactElement, memo } from 'react'
import { motion } from 'motion/react'
import type { ChatMessage } from '../_types'

function MessageItem({
  message,
  index,
  animateIn = true
}: {
  message: ChatMessage
  index: number
  animateIn?: boolean
}): ReactElement {
  return (
    <motion.div
      initial={animateIn ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={animateIn ? { delay: index * 0.1, duration: 0.4 } : {}}
      className={`flex mb-6 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] p-2 ${
          message.role === 'user'
            ? 'bg-[#c8794d] text-white rounded-2xl rounded-br-md'
            : 'text-[#2b2e3b] border-b border-[#d0d2dd]'
        }`}
      >
        <div className="text-[16px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </motion.div>
  )
}

export default memo(MessageItem)
