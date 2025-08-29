import { ReactElement, memo } from 'react'
import { motion } from 'motion/react'
import type { ChatMessage } from '../_types'

function MessageItem({
  message,
  index
}: {
  message: ChatMessage
  index: number
}): ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`flex mb-6 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] p-2 rounded-2xl border ${
          message.role === 'user'
            ? 'bg-[#c8794d] text-white rounded-br-md'
            : 'text-[#2b2e3b] border-none'
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
