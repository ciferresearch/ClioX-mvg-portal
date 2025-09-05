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
  const { assistantToPrevUser, userToNextAssistant, idToMessage } =
    useMemo(() => {
      let lastUser: { id: string; content: string } | null = null
      const a2u: Record<string, string> = {}
      const u2a: Record<string, string> = {}
      const idMap: Record<string, ChatMessage> = {}
      for (const msg of messages) {
        idMap[msg.id] = msg
        if (msg.role === 'user') {
          lastUser = { id: msg.id, content: msg.content }
        } else if (msg.role === 'assistant' && lastUser) {
          a2u[msg.id] = lastUser.content
          if (!u2a[lastUser.id]) u2a[lastUser.id] = msg.id
          lastUser = null
        }
      }
      return {
        assistantToPrevUser: a2u,
        userToNextAssistant: u2a,
        idToMessage: idMap
      }
    }, [messages])

  return (
    <>
      <AnimatePresence>
        {messages.map((message, index) => {
          // Determine if we should hide user actions for this message based on its corresponding assistant state
          const assistantId =
            message.role === 'user'
              ? userToNextAssistant[message.id]
              : undefined
          const lockUserActions = Boolean(
            message.role === 'user' &&
              assistantId &&
              (() => {
                const assistantMsg = assistantId
                  ? idToMessage[assistantId]
                  : undefined
                if (!assistantMsg) return false
                const meta = assistantMsg.metadata
                // Hide while assistant is not complete and not aborted (i.e., generating/streaming)
                return !(meta?.isComplete || meta?.isAborted)
              })()
          )

          return (
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
              lockUserActions={lockUserActions}
            />
          )
        })}
      </AnimatePresence>
      <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
    </>
  )
}
