import { ReactElement, memo, useCallback, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { ChatMessage } from '../_types'
import UserMessageActions from './UserMessageActions'
import AssistantMessageActions from './AssistantMessageActions'

function MessageItem({
  message,
  index,
  animateIn = true,
  onRetry,
  onUpdateUserMessage,
  assistantIdForUser,
  onResendFromEdit
}: {
  message: ChatMessage
  index: number
  animateIn?: boolean
  onRetry?: () => void
  onUpdateUserMessage?: (messageId: string, newContent: string) => void
  assistantIdForUser?: string
  onResendFromEdit?: (assistantId: string, newMessage: string) => void
}): ReactElement {
  const isAssistant = message.role === 'assistant'
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draftContent, setDraftContent] = useState(message.content)

  const canShowAssistantActions = useMemo(() => {
    return (
      isAssistant &&
      (message.metadata?.isComplete || message.metadata?.isAborted)
    )
  }, [isAssistant, message.metadata])

  const handleEdit = useCallback(() => {
    setDraftContent(message.content)
    setIsEditing(true)
  }, [message.content])

  const handleSaveEdit = useCallback(() => {
    const content = draftContent.trim()
    if (!content) {
      setIsEditing(false)
      return
    }
    // Update user message content in state
    onUpdateUserMessage?.(message.id, content)
    setIsEditing(false)
    // If we have a mapped assistant bubble, trigger resend like Try Again
    if (assistantIdForUser && onResendFromEdit) {
      onResendFromEdit(assistantIdForUser, content)
    }
  }, [
    assistantIdForUser,
    draftContent,
    message.id,
    onResendFromEdit,
    onUpdateUserMessage
  ])

  const handleCancelEdit = useCallback(() => {
    setDraftContent(message.content)
    setIsEditing(false)
  }, [message.content])

  const columnAlign = message.role === 'user' ? 'items-end' : 'items-start'
  const columnMaxWidth = isAssistant ? 'max-w-[80%]' : 'w-full'
  const bubbleMaxWidth = !isAssistant
    ? isEditing
      ? 'w-full'
      : 'max-w-[80%]'
    : ''

  return (
    <motion.div
      initial={animateIn ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex ${
        message.role === 'user' ? 'justify-end' : 'mb-6 justify-start'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex flex-col ${columnAlign} ${columnMaxWidth}`}>
        {/* Bubble */}
        <div
          className={`${bubbleMaxWidth} px-3 py-2 ${
            message.role === 'user'
              ? 'bg-[#E5E7EB] text-[#0d0d0d] rounded-2xl rounded-br-md'
              : 'text-[#0d0d0d]'
          }`}
        >
          {!isEditing ? (
            <div className="text-[16px] leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          ) : (
            <div className="mt-1">
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="w-full min-h-20 max-h-96 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none resize-none overflow-y-auto text-base"
                style={{
                  height: '80px',
                  minHeight: '80px',
                  maxHeight: '288px'
                }}
              />
              <div className="flex items-center gap-2 mt-2 justify-end font-medium">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-colors cursor-pointer h-10 px-4 text-sm"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="inline-flex items-center justify-center rounded-full bg-black text-white hover:bg-black/90 transition-colors cursor-pointer h-10 px-4 text-sm"
                  aria-label="Save"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {isAssistant ? (
          <AssistantMessageActions
            visible={Boolean(canShowAssistantActions)}
            content={message.content}
            onRetry={onRetry}
            disabled={false}
          />
        ) : (
          <UserMessageActions
            visible={!isEditing && isHovered}
            content={message.content}
            onEdit={handleEdit}
            disabled={false}
            className="mb-0"
          />
        )}
      </div>
    </motion.div>
  )
}

export default memo(MessageItem)
