import { ReactElement, useEffect, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
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
      <LayoutGroup>
        <div
          className={`flex-1 overflow-y-auto px-6 py-4 bg-transparent relative`}
          onScroll={handleScroll}
          aria-live="polite"
        >
          {/* <div
          className={`flex-1 overflow-y-auto ${
            isHero ? 'px-6 py-0' : 'px-6 py-4'
          } bg-transparent relative`}
          onScroll={handleScroll}
          aria-live="polite"
        > */}
          {/* Hero prompt - only before first interaction */}
          <AnimatePresence mode="wait">
            {isHero ? (
              <motion.div
                key="hero"
                className="flex items-center justify-center h-full w-full"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ y: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
              >
                <motion.div layoutId="composer">
                  <Composer
                    onSendMessage={(m) => {
                      setIsFirstInteraction(true)
                      setSuppressFirstMessageAnimation(true)
                      sendMessage(m)
                    }}
                    disabled={isTyping || backendError !== null}
                    variant="hero"
                    sessionId={sessionId}
                    assistantStatus={status}
                    knowledgeStatus={knowledgeStatus}
                    backendError={backendError}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <div key="chat">
                <MessageList
                  messages={messages}
                  isTyping={isTyping}
                  animateItems={!suppressFirstMessageAnimation}
                />
              </div>
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
          <motion.div layoutId="composer">
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
              sessionId={sessionId}
              assistantStatus={status}
              knowledgeStatus={knowledgeStatus}
              backendError={backendError}
            />
          </motion.div>
        )}
      </LayoutGroup>
    </motion.div>
  )
}
