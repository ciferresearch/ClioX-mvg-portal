import { ReactElement, useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import type { ChatMessage } from '../_types'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'

export default function MessageList({
  messages,
  isTyping,
  animateItems = true,
  onRetry,
  onUpdateUserMessage,
  onResendFromEdit
}: {
  messages: ChatMessage[]
  isTyping: boolean
  animateItems?: boolean
  onRetry?: (userMessage: string, assistantId: string) => void
  onUpdateUserMessage?: (messageId: string, newContent: string) => void
  onResendFromEdit?: (assistantId: string, newMessage: string) => void
}): ReactElement {
  // Map assistant -> previous user content AND user -> next assistant id
  const { assistantToPrevUser, userToNextAssistant } = useMemo(() => {
    let lastUser: { id: string; content: string } | null = null
    const a2u: Record<string, string> = {}
    const u2a: Record<string, string> = {}
    for (const msg of messages) {
      if (msg.role === 'user') {
        lastUser = { id: msg.id, content: msg.content }
      } else if (msg.role === 'assistant' && lastUser) {
        a2u[msg.id] = lastUser.content
        if (!u2a[lastUser.id]) u2a[lastUser.id] = msg.id
        lastUser = null
      }
    }
    return { assistantToPrevUser: a2u, userToNextAssistant: u2a }
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
                ? () => onRetry(assistantToPrevUser[message.id], message.id)
                : undefined
            }
            onUpdateUserMessage={onUpdateUserMessage}
            assistantIdForUser={
              message.role === 'user'
                ? userToNextAssistant[message.id]
                : undefined
            }
            onResendFromEdit={onResendFromEdit}
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
    </>
  )
}
