import { ReactElement } from 'react'
import { motion } from 'framer-motion'
import { KnowledgeStatus } from '../../@utils/chatbot'
import { useSmartScroll } from './hooks/useSmartScroll'
import { useChat, AssistantState } from './hooks/useChat'
import MessageList from './ui/MessageList'
import Composer from './ui/Composer'
import ScrollToBottom from './ui/ScrollToBottom'
import StatusBanner from './ui/StatusBanner'

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

  return (
    <motion.div
      className="relative flex flex-col h-[700px] bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
    >
      <motion.div
        className="relative px-6 py-4 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-100"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center mb-2">
          <h3 className="font-bold text-gray-800 text-lg">AI Assistant</h3>
        </div>
        <StatusBanner
          status={status}
          knowledgeStatus={knowledgeStatus}
          backendError={backendError}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400"></div>
      </motion.div>

      <div
        className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-gray-50 to-white relative"
        onScroll={handleScroll}
        aria-live="polite"
      >
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_rgb(0,0,0)_1px,_transparent_0)] bg-[length:24px_24px]"></div>
        <MessageList messages={messages} isTyping={isTyping} />
        <motion.div
          ref={messagesEndRef}
          layout
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Scroll to bottom button - positioned above input */}
      {!shouldAutoScroll && <ScrollToBottom onClick={scrollToBottom} />}

      <Composer
        onSendMessage={sendMessage}
        disabled={
          isTyping ||
          backendError !== null ||
          status === 'connecting' ||
          status === 'uploading' ||
          status === 'processing' ||
          status === 'backend-error'
        }
      />
    </motion.div>
  )
}
