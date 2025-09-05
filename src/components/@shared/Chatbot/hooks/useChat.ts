import { useCallback, useMemo, useRef, useState } from 'react'
import { chatbotApi, KnowledgeStatus } from '../../../../@utils/chatbot'
import type { ChatMessage } from '../_types'

export type AssistantState =
  | 'connecting'
  | 'backend-error'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'no-knowledge'

export function useChat(
  status: AssistantState,
  knowledgeStatus: KnowledgeStatus | null
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const streamingAssistantIdRef = useRef<string | null>(null)
  const streamAbortRef = useRef<AbortController | null>(null)

  const hasKnowledge = useMemo(() => {
    return status === 'ready' || (knowledgeStatus?.has_knowledge ?? false)
  }, [status, knowledgeStatus])

  const generateId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as any).randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const cancelStream = useCallback(() => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort()
      streamAbortRef.current = null
      // Mark current assistant bubble as aborted (not complete)
      const id = streamingAssistantIdRef.current
      if (id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  metadata: {
                    ...(m.metadata || {}),
                    isAborted: true,
                    isComplete: false
                  }
                }
              : m
          )
        )
      }
      streamingAssistantIdRef.current = null
      setIsTyping(false)
      setIsStreaming(false)
    }
  }, [])

  // Trim all messages after the given message (keep it)
  const pruneAfterMessage = useCallback(
    (messageId: string) => {
      // If currently streaming a later assistant bubble, cancel
      if (streamingAssistantIdRef.current) {
        if (streamingAssistantIdRef.current !== messageId) {
          cancelStream()
        }
      }
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === messageId)
        if (idx === -1) return prev
        return prev.slice(0, idx + 1)
      })
    },
    [cancelStream]
  )

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!hasKnowledge) {
        const noKnowledgeMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content:
            "I don't have any information loaded yet. Please add some compute job results first using the 'Add' button above.",
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, noKnowledgeMessage])
        return
      }

      // Add user message immediately
      const userChatMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, userChatMessage])

      // Start typing indicator
      setIsTyping(true)

      // Create a placeholder assistant message for streaming updates
      const assistantId = generateId()
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          metadata: { isComplete: false, isAborted: false }
        }
      ])

      // Prepare abort controller for this stream
      const controller = new AbortController()
      streamAbortRef.current = controller
      streamingAssistantIdRef.current = assistantId

      try {
        let buffered = ''
        let hasStartedStreaming = false

        const result = await chatbotApi.streamChat(
          userMessage,
          { maxTokens: 500, temperature: 0.7 },
          (evt) => {
            if (typeof evt.content === 'string' && evt.content.length > 0) {
              if (!hasStartedStreaming) {
                hasStartedStreaming = true
                // Hide typing indicator once streaming starts
                setIsTyping(false)
                setIsStreaming(true)
              }
              buffered += evt.content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: buffered } : m
                )
              )
            }
          },
          { signal: controller.signal }
        )

        // Finalize assistant message with metadata (sources/confidence)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: result.fullResponse,
                  metadata: {
                    ...(m.metadata || {}),
                    isComplete: true,
                    sources: result.sources?.map((s) => s.source) || [],
                    confidence: result.metadata?.chunks_retrieved
                  }
                }
              : m
          )
        )
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          // Stream cancelled by user; keep partial content
        } else {
          console.error('❌ Chat message failed:', error)

          let errorContent =
            'Sorry, I encountered an error processing your message.'
          const errorMsg = error?.message || 'Unknown error'

          if (errorMsg.includes('no_knowledge')) {
            errorContent =
              "I don't have access to any information for this session. Please add some compute job results first."
          } else if (errorMsg.includes('Cannot connect')) {
            errorContent =
              'Cannot connect to the chatbot backend. Please ensure the backend server is running on port 8001.'
          } else if (errorMsg.includes('fetch')) {
            errorContent =
              'Network error: Unable to reach the chatbot backend. Please check your connection.'
          }

          // Update the placeholder assistant message with error content and mark as complete
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: errorContent,
                    metadata: { ...(m.metadata || {}), isComplete: true }
                  }
                : m
            )
          )
        }
      } finally {
        setIsTyping(false)
        setIsStreaming(false)
        streamingAssistantIdRef.current = null
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null
        }
      }
    },
    [hasKnowledge]
  )

  const retryMessage = useCallback(
    async (assistantId: string, userMessage: string) => {
      // Cancel any existing stream first if it's the same bubble
      if (streamingAssistantIdRef.current === assistantId) {
        cancelStream()
      }

      // Reset existing assistant message content and mark as incomplete
      setIsTyping(true)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: '',
                metadata: {
                  ...(m.metadata || {}),
                  isComplete: false,
                  isAborted: false,
                  sources: [],
                  confidence: undefined
                }
              }
            : m
        )
      )

      const controller = new AbortController()
      streamAbortRef.current = controller
      streamingAssistantIdRef.current = assistantId

      try {
        let buffered = ''
        let hasStartedStreaming = false

        const result = await chatbotApi.streamChat(
          userMessage,
          { maxTokens: 500, temperature: 0.7 },
          (evt) => {
            if (typeof evt.content === 'string' && evt.content.length > 0) {
              if (!hasStartedStreaming) {
                hasStartedStreaming = true
                setIsTyping(false)
                setIsStreaming(true)
              }
              buffered += evt.content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: buffered } : m
                )
              )
            }
          },
          { signal: controller.signal }
        )

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: result.fullResponse,
                  metadata: {
                    ...(m.metadata || {}),
                    isComplete: true,
                    sources: result.sources?.map((s) => s.source) || [],
                    confidence: result.metadata?.chunks_retrieved
                  }
                }
              : m
          )
        )
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          // cancelled
        } else {
          console.error('❌ Retry failed:', error)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      'Sorry, I encountered an error retrying the response. Please try again.',
                    metadata: { ...(m.metadata || {}), isComplete: true }
                  }
                : m
            )
          )
        }
      } finally {
        setIsTyping(false)
        setIsStreaming(false)
        streamingAssistantIdRef.current = null
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null
        }
      }
    },
    [cancelStream]
  )

  const updateUserMessage = useCallback(
    (messageId: string, newContent: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.role === 'user'
            ? { ...m, content: newContent }
            : m
        )
      )
    },
    []
  )

  return {
    messages,
    isTyping,
    isStreaming,
    sendMessage,
    retryMessage,
    cancelStream,
    updateUserMessage,
    pruneAfterMessage
  }
}

export default useChat
