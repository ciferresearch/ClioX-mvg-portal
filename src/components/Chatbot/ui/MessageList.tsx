import { ReactElement, useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import type { ChatMessage } from '../_types'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'

export default function MessageList({
  messages,
  isTyping,
  animateItems = true,
  onRetry
}: {
  messages: ChatMessage[]
  isTyping: boolean
  animateItems?: boolean
  onRetry?: (userMessage: string) => void
}): ReactElement {
  // Map each assistant message to its nearest previous user message content
  const assistantToPrevUser: Record<string, string> = useMemo(() => {
    let lastUser: string | null = null
    const mapping: Record<string, string> = {}
    for (const msg of messages) {
      if (msg.role === 'user') lastUser = msg.content
      else if (msg.role === 'assistant' && lastUser) mapping[msg.id] = lastUser
    }
    return mapping
  }, [messages])

  return (
    <>
      <AnimatePresence>
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            index={index}
            animateIn={animateItems}
            onRetry={
              message.role === 'assistant' &&
              onRetry &&
              assistantToPrevUser[message.id]
                ? () => onRetry(assistantToPrevUser[message.id])
                : undefined
            }
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
    </>
  )
}
