import { ReactElement } from 'react'
import { AnimatePresence } from 'motion/react'
import type { ChatMessage } from '../_types'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'

export default function MessageList({
  messages,
  isTyping
}: {
  messages: ChatMessage[]
  isTyping: boolean
}): ReactElement {
  return (
    <>
      <AnimatePresence>
        {messages.map((message, index) => (
          <MessageItem key={message.id} message={message} index={index} />
        ))}
      </AnimatePresence>
      <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
    </>
  )
}
