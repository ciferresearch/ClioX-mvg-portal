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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! 👋 I'm your AI assistant. I'm here to help answer questions and have conversations with you.\n\nHow can I help you today?",
      timestamp: new Date()
    }
  ])
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
      setIsTyping(true)

      try {
        const apiResponse = await chatbotApi.chat(userMessage, {
          maxTokens: 500,
          temperature: 0.7
        })

        if (apiResponse?.success && apiResponse?.response) {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: apiResponse.response,
            timestamp: new Date(),
            metadata: {
              sources:
                apiResponse.sources?.map((s) => s?.source).filter((s) => s) ||
                [],
              confidence: apiResponse.metadata?.chunks_retrieved
            }
          }
          setMessages((prev) => [...prev, assistantMessage])
        } else {
          console.error('❌ API response failed or empty:', {
            success: apiResponse?.success,
            response: apiResponse?.response,
            error: apiResponse?.error,
            message: apiResponse?.message
          })
          throw new Error(
            apiResponse?.message || apiResponse?.error || 'Unknown API error'
          )
        }
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
        setIsTyping(false)
      }
    },
    [hasKnowledge]
  )

  return { messages, isTyping, sendMessage }
}

export default useChat
