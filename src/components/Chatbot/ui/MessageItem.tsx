import { ReactElement, memo } from 'react'
import { motion } from 'motion/react'
import type { ChatMessage } from '../_types'
import MessageActions from './MessageActions'

function MessageItem({
  message,
  index,
  animateIn = true,
  onRetry
}: {
  message: ChatMessage
  index: number
  animateIn?: boolean
  onRetry?: () => void
}): ReactElement {
  const isAssistant = message.role === 'assistant'

  return (
    <motion.div
      initial={animateIn ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex mb-6 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] p-2 ${
          message.role === 'user'
            ? 'bg-[#E5E7EB] text-[#0d0d0d] rounded-2xl rounded-br-md'
            : 'text-[#0d0d0d]'
        }`}
      >
        <div className="text-[16px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {isAssistant && (
          <MessageActions
            visible={Boolean(message.metadata?.isComplete)}
            content={message.content}
            onRetry={onRetry}
            disabled={false}
            className=""
          />
        )}
      </div>
    </motion.div>
  )
}

export default memo(MessageItem)
