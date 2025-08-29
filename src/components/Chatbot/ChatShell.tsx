import { ReactElement, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { KnowledgeStatus, chatbotApi } from '../../@utils/chatbot'
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
  const [suppressFirstMessageAnimation, setSuppressFirstMessageAnimation] =
    useState(false)

  const isHero = !isFirstInteraction && messages.length === 0
  const sessionId = chatbotApi.getSessionId()

  useEffect(() => {
    if (!isHero && suppressFirstMessageAnimation) {
      const id = setTimeout(() => setSuppressFirstMessageAnimation(false), 0)
      return () => clearTimeout(id)
    }
  }, [isHero, suppressFirstMessageAnimation])

  return (
    <motion.div
      className={`relative flex flex-col w-[820px] mx-auto max-h-[1080px] ${
        isHero ? 'min-h-[700px]' : 'min-h-[700px] border-t border-[#d0d2dd]'
      } bg-transparent overflow-hidden`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
    >
      <div
        className={`flex-1 overflow-y-auto px-6 py-4 bg-transparent relative`}
        onScroll={handleScroll}
        aria-live="polite"
      >
        {/* Chat messages when not in hero mode */}
        {!isHero && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <MessageList
                messages={messages}
                isTyping={isTyping}
                animateItems={!suppressFirstMessageAnimation}
              />
            </motion.div>
          </AnimatePresence>
        )}

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

      {/* Single Composer that slides from center to bottom */}
      <motion.div
        className="px-6"
        animate={{
          position: isHero ? 'absolute' : 'static',
          top: isHero ? '50%' : 'auto',
          left: isHero ? '0' : 'auto',
          right: isHero ? '0' : 'auto',
          y: isHero ? '-50%' : 0,
          zIndex: isHero ? 10 : 'auto'
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
          duration: 0.6
        }}
      >
        <Composer
          onSendMessage={(message) => {
            if (isHero) {
              setIsFirstInteraction(true)
              setSuppressFirstMessageAnimation(true)
            }
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
          variant={isHero ? 'hero' : 'default'}
          sessionId={sessionId}
          assistantStatus={status}
          knowledgeStatus={knowledgeStatus}
          backendError={backendError}
        />
      </motion.div>
    </motion.div>
  )
}
