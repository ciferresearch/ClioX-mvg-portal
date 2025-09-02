import { ReactElement, useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  IconSettings,
  IconSend,
  IconCopy,
  IconPlayerStopFilled
} from '@tabler/icons-react'
import type { KnowledgeStatus } from '../../../@utils/chatbot'
import type { AssistantState } from '../hooks/useChat'

interface InputContainerProps {
  inputMessage: string
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  disabled: boolean
  isStreaming?: boolean
  isTyping?: boolean
  onPause?: () => void
  placeholder: string
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onToggleInfo: () => void
  isInfoOpen: boolean
  sessionId?: string | null
  assistantStatus?: AssistantState
  knowledgeStatus?: KnowledgeStatus | null
  backendError?: string | null
  isHero: boolean
}

function InputContainer({
  inputMessage,
  onInputChange,
  onKeyDown,
  onSubmit,
  disabled,
  isStreaming,
  isTyping,
  onPause,
  placeholder,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onToggleInfo,
  isInfoOpen,
  sessionId,
  assistantStatus,
  knowledgeStatus,
  backendError,
  isHero
}: InputContainerProps): ReactElement {
  const anchorRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on outside click or ESC
  useEffect(() => {
    if (!isInfoOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleInfo()
    }
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (popoverRef.current?.contains(t)) return
      if (anchorRef.current?.contains(t)) return
      onToggleInfo()
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [isInfoOpen, onToggleInfo])

  return (
    <div className="bg-[#F8F7F5] rounded-2xl p-3 space-y-4 relative">
      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          value={inputMessage}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full min-h-20 max-h-96 px-4 py-2 bg-white border-0 rounded-xl focus:outline-none resize-none overflow-y-auto transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          style={{
            height: '60px',
            minHeight: '60px',
            maxHeight: '288px'
          }}
        />

        <div className="flex justify-between items-center mb-0">
          <div className="flex items-center relative" ref={anchorRef}>
            <button
              type="button"
              onClick={onToggleInfo}
              className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Show session info"
            >
              <IconSettings className="h-4 w-4 text-gray-700" />
            </button>
            {isInfoOpen && (
              <motion.div
                ref={popoverRef}
                role="dialog"
                aria-label="Session and knowledge status"
                initial={{ opacity: 0, y: isHero ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18 }}
                className={`absolute ${
                  isHero ? 'top-full mt-2' : 'bottom-full mb-2'
                } left-0 w-80 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 ring-1 ring-black/5 shadow-xl p-4 z-30`}
              >
                <div className="mb-3">
                  <div className="text-sm font-semibold text-[#2b2e3b] mb-1">
                    Session
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-[#4c5167] truncate">
                      {sessionId || 'Unknown'}
                    </code>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-white/50 transition-colors text-[#c8794d] cursor-pointer"
                      onClick={() =>
                        sessionId && navigator.clipboard.writeText(sessionId)
                      }
                      aria-label="Copy session id"
                      title="Copy"
                    >
                      <IconCopy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm font-semibold text-[#2b2e3b] mb-1">
                    Assistant
                  </div>
                  <div className="text-xs text-[#4c5167]">
                    Status: {assistantStatus || 'unknown'}
                  </div>
                  {backendError && (
                    <div className="text-xs text-red-600 mt-1">
                      {backendError}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-semibold text-[#2b2e3b] mb-1">
                    Knowledge
                  </div>
                  <div className="text-xs text-[#4c5167]">
                    has_knowledge:{' '}
                    {knowledgeStatus?.has_knowledge ? 'Yes' : 'No'}
                  </div>
                  <div className="text-xs text-[#4c5167] mt-1">
                    chunks: {knowledgeStatus?.chunk_count ?? 0}
                  </div>
                  {knowledgeStatus?.domains &&
                    knowledgeStatus.domains.length > 0 && (
                      <div className="text-xs text-[#4c5167] mt-1 truncate">
                        domains:{' '}
                        {knowledgeStatus.domains.slice(0, 3).join(', ')}
                        {knowledgeStatus.domains.length > 3 && '…'}
                      </div>
                    )}
                </div>
              </motion.div>
            )}
          </div>

          {isStreaming || isTyping ? (
            <motion.button
              type="button"
              disabled={disabled}
              className="w-8 h-8 text-white rounded-lg flex items-center justify-center focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={
                {
                  backgroundColor:
                    isHovered && !disabled ? '#4b5563' : '#6b7280',
                  '--tw-ring-color': '#6b7280'
                } as React.CSSProperties
              }
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              aria-label="Pause generation"
              onClick={onPause}
            >
              <IconPlayerStopFilled className="h-4 w-4" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              disabled={disabled || !inputMessage.trim()}
              className="w-8 h-8 text-white rounded-lg flex items-center justify-center focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={
                {
                  backgroundColor:
                    isHovered && !disabled ? '#b56a3e' : '#c8794d',
                  '--tw-ring-color': '#c8794d'
                } as React.CSSProperties
              }
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              aria-label="Send message"
            >
              <IconSend className="h-4 w-4" />
            </motion.button>
          )}
        </div>

        {/* Popover is anchored next to the Settings button (above in normal mode, below in hero) */}
      </form>
    </div>
  )
}

export default function Composer({
  onSendMessage,
  disabled,
  variant = 'default',
  sessionId,
  assistantStatus,
  knowledgeStatus,
  backendError,
  isTyping = false,
  isStreaming = false,
  onPause
}: {
  onSendMessage: (message: string) => void
  disabled: boolean
  variant?: 'default' | 'hero'
  sessionId?: string | null
  assistantStatus?: AssistantState
  knowledgeStatus?: KnowledgeStatus | null
  backendError?: string | null
  isTyping?: boolean
  isStreaming?: boolean
  onPause?: () => void
}): ReactElement {
  const [inputMessage, setInputMessage] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const pauseGuardRef = useRef<number>(0)
  const PAUSE_GUARD_MS = 250

  const handlePause = useCallback(() => {
    pauseGuardRef.current = Date.now()
    onPause?.()
  }, [onPause])
  const greetings = [
    'Hello. Ready to dive in?',
    'What can I help you explore today?',
    "Got something in mind? Let's start.",
    'Curious today? Ask me anything.',
    'Ready when you are.',
    'How can I help you today?',
    'What are we exploring today?',
    "Bring your question—I'll fetch answers.",
    "Need a hand? I'm here.",
    "Let's get something done."
  ]
  const [greetingFull, setGreetingFull] = useState<string>(greetings[0])
  const [greetingTyped, setGreetingTyped] = useState('')
  const isHeroVariant = variant === 'hero'
  const [cursorVisible, setCursorVisible] = useState(true)
  const [hideCursor, setHideCursor] = useState(false)
  const [typingPhase, setTypingPhase] = useState<'gathering' | 'preparing'>(
    'gathering'
  )
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null)

  // Generate appropriate placeholder based on status
  const getPlaceholder = () => {
    if (backendError) return 'Service temporarily unavailable...'
    if (isTyping) {
      return typingPhase === 'gathering'
        ? 'Gathering details to give you the best response...'
        : 'Preparing your answer...'
    }
    if (!knowledgeStatus?.has_knowledge)
      return 'Please add a knowledge base to start chatting...'
    if (assistantStatus === 'connecting') return 'Connecting to assistant...'
    if (assistantStatus === 'uploading') return 'Uploading files...'
    if (assistantStatus === 'processing') return 'Processing...'
    if (assistantStatus === 'backend-error') return 'Assistant unavailable...'

    // Default placeholders when everything is working
    return isHeroVariant ? 'How can I help you today?' : 'Ask me anything...'
  }

  useEffect(() => {
    // Pick a random greeting once on mount
    setGreetingFull(greetings[Math.floor(Math.random() * greetings.length)])
    // greetings is stable (defined inline), safe to ignore exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isHeroVariant) return
    let timer: ReturnType<typeof setInterval> | null = null
    let index = 0
    setGreetingTyped('')
    timer = setInterval(() => {
      index += 1
      setGreetingTyped(greetingFull.slice(0, index))
      if (index >= greetingFull.length && timer) {
        clearInterval(timer)
      }
    }, 35)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isHeroVariant, greetingFull])

  useEffect(() => {
    if (!isHeroVariant) return
    const typingDone = greetingTyped.length === greetingFull.length
    if (!typingDone) {
      setHideCursor(false)
      setCursorVisible(true)
      return
    }
    setCursorVisible(false)
    setHideCursor(false)
    let visibleCount = 0
    const id = setInterval(() => {
      setCursorVisible((prev) => {
        const next = !prev
        if (next) visibleCount += 1
        if (visibleCount >= 7) {
          clearInterval(id)
          setHideCursor(true)
          return false
        }
        return next
      })
    }, 500)
    return () => clearInterval(id)
  }, [isHeroVariant, greetingTyped.length, greetingFull.length])

  // Handle typing phase transitions
  useEffect(() => {
    if (isTyping && typingStartTime === null) {
      // Starting to type - record start time and reset to gathering phase
      setTypingStartTime(Date.now())
      setTypingPhase('gathering')
    } else if (!isTyping) {
      // Stopped typing - reset state
      setTypingStartTime(null)
      setTypingPhase('gathering')
    }
  }, [isTyping, typingStartTime])

  useEffect(() => {
    if (!isTyping || typingStartTime === null) return

    // Generate random delay between 10-15 seconds (10000-15000ms)
    const randomDelay = Math.random() * 5000 + 10000

    const timer = setTimeout(() => {
      setTypingPhase('preparing')
    }, randomDelay)

    return () => clearTimeout(timer)
  }, [isTyping, typingStartTime])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    const { scrollHeight } = textarea
    const lineHeight = 24
    const minHeight = lineHeight * 2
    const maxHeight = lineHeight * 12

    if (scrollHeight <= maxHeight) {
      textarea.style.height = Math.max(scrollHeight, minHeight) + 'px'
    } else {
      textarea.style.height = maxHeight + 'px'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isStreaming || isTyping) {
      // During streaming/typing, ignore submit; only manual pause button should pause
      return
    }
    // Guard: ignore immediate send right after pause DOM swap
    if (Date.now() - pauseGuardRef.current < PAUSE_GUARD_MS) return
    if (inputMessage.trim() && !disabled) {
      onSendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  const onKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isStreaming || isTyping) {
        // Do nothing on Enter while streaming/typing; pause only via button
        return
      }
      if (Date.now() - pauseGuardRef.current < PAUSE_GUARD_MS) return
      if (inputMessage.trim() && !disabled) {
        onSendMessage(inputMessage.trim())
        setInputMessage('')
      }
    }
  }

  if (variant === 'hero') {
    return (
      <div className="px-6 w-[820px] flex items-center min-h-[700px]">
        <div className="w-full relative">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none text-[28px] md:text-[40px] leading-tight font-serif text-[#2b2e3b] whitespace-nowrap">
            <span className="inline-block relative align-middle">
              {greetingTyped}
              {!hideCursor && (
                <span
                  className={`absolute left-full -top-1.5 pl-1 ${
                    cursorVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  |
                </span>
              )}
            </span>
          </div>
          <InputContainer
            inputMessage={inputMessage}
            onInputChange={handleInputChange}
            onKeyDown={onKeyDown}
            onSubmit={handleSubmit}
            disabled={disabled}
            isStreaming={isStreaming}
            isTyping={isTyping}
            onPause={handlePause}
            placeholder={getPlaceholder()}
            isHovered={isHovered}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onToggleInfo={() => setIsInfoOpen((v) => !v)}
            isInfoOpen={isInfoOpen}
            sessionId={sessionId}
            assistantStatus={assistantStatus}
            knowledgeStatus={knowledgeStatus}
            backendError={backendError}
            isHero
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-white">
      <InputContainer
        inputMessage={inputMessage}
        onInputChange={handleInputChange}
        onKeyDown={onKeyDown}
        onSubmit={handleSubmit}
        disabled={disabled}
        isStreaming={isStreaming}
        isTyping={isTyping}
        onPause={handlePause}
        placeholder={getPlaceholder()}
        isHovered={isHovered}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onToggleInfo={() => setIsInfoOpen((v) => !v)}
        isInfoOpen={isInfoOpen}
        sessionId={sessionId}
        assistantStatus={assistantStatus}
        knowledgeStatus={knowledgeStatus}
        backendError={backendError}
        isHero={false}
      />
    </div>
  )
}
