import { useCallback, useMemo, useState } from 'react'
import { chatbotApi, KnowledgeStatus } from '../../../@utils/chatbot'
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

  const hasKnowledge = useMemo(() => {
    return status === 'ready' || (knowledgeStatus?.has_knowledge ?? false)
  }, [status, knowledgeStatus])

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!hasKnowledge) {
        const noKnowledgeMessage: ChatMessage = {
          id: Date.now().toString(),
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
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, userChatMessage])

      // Start typing indicator
      setIsTyping(true)

      // Create a placeholder assistant message for streaming updates
      const assistantId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          metadata: { isComplete: false }
        }
      ])

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
              }
              buffered += evt.content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: buffered } : m
                )
              )
            }
          }
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

        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorContent,
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        // Ensure typing indicator is hidden
        setIsTyping(false)
      }
    },
    [hasKnowledge]
  )

  const retryMessage = useCallback(
    async (assistantId: string, userMessage: string) => {
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
                  sources: [],
                  confidence: undefined
                }
              }
            : m
        )
      )

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
              }
              buffered += evt.content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: buffered } : m
                )
              )
            }
          }
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
      } catch (error) {
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
      } finally {
        setIsTyping(false)
      }
    },
    []
  )

  return { messages, isTyping, sendMessage, retryMessage }
}

export default useChat
