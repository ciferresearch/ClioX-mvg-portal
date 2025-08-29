import { ReactElement } from 'react'
import { AnimatePresence } from 'motion/react'
import type { ChatMessage } from '../_types'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'

export default function MessageList({
  messages,
  isTyping,
  animateItems = true
}: {
  messages: ChatMessage[]
  isTyping: boolean
  animateItems?: boolean
}): ReactElement {
  return (
    <>
      <AnimatePresence>
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            index={index}
            animateIn={animateItems}
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
    </>
  )
}
