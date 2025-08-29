import { ReactElement, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { KnowledgeStatus } from '../../@utils/chatbot'
import { useSmartScroll } from './hooks/useSmartScroll'
import { useChat, AssistantState } from './hooks/useChat'
import MessageList from './ui/MessageList'
import Composer from './ui/Composer'
import ScrollToBottom from './ui/ScrollToBottom'

export default function ChatShell({
  status,
  knowledgeStatus,
  backendError
}: {
  status: AssistantState
  knowledgeStatus: KnowledgeStatus | null
  backendError: string | null
}): ReactElement {
  const { messages, isTyping, sendMessage } = useChat(status, knowledgeStatus)
  const { messagesEndRef, shouldAutoScroll, handleScroll, scrollToBottom } =
    useSmartScroll(messages.length)
  const [isFirstInteraction, setIsFirstInteraction] = useState(false)

  const isHero = !isFirstInteraction && messages.length === 0

  return (
    <motion.div
      className={`relative flex flex-col w-[820px] mx-auto max-h-[1080px] ${
        isHero ? 'min-h-[460px]' : 'min-h-[700px]'
      } bg-transparent rounded-2xl overflow-hidden`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
    >
      <div
        className="flex-1 overflow-y-auto px-6 py-4 bg-transparent relative"
        onScroll={handleScroll}
        aria-live="polite"
      >
        {/* Hero prompt - only before first interaction */}
        {isHero && (
          <div className="flex items-center justify-center h-full w-full">
            <Composer
              onSendMessage={(m) => {
                setIsFirstInteraction(true)
                sendMessage(m)
              }}
              disabled={isTyping || backendError !== null}
              variant="hero"
            />
          </div>
        )}

        {/* Chat messages - shown after first interaction */}
        <AnimatePresence>
          {!isHero && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <MessageList messages={messages} isTyping={isTyping} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          ref={messagesEndRef}
          layout
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Scroll to bottom button - positioned above input */}
      {!isHero && !shouldAutoScroll && (
        <ScrollToBottom onClick={scrollToBottom} />
      )}

      {!isHero && (
        <Composer
          onSendMessage={(message) => {
            if (!isFirstInteraction) setIsFirstInteraction(true)
            sendMessage(message)
          }}
          disabled={
            isTyping ||
            backendError !== null ||
            status === 'connecting' ||
            status === 'uploading' ||
            status === 'processing' ||
            status === 'backend-error'
          }
        />
      )}
    </motion.div>
  )
}
