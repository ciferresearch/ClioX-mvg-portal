import { ReactElement, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { ChatMessage, KnowledgeBase } from './_types'
import { chatbotApi, KnowledgeStatus } from '../../services/chatbotApi'

interface ChatInterfaceProps {
  // Remove unused knowledgeBase prop
}

// Animated typing indicator
function TypingIndicator(): ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start mb-4"
    >
      <div className="flex items-center space-x-2 bg-white shadow-sm px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200">
        <span className="text-sm text-gray-600">Assistant is typing</span>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Individual message component with animations
function ChatMessageComponent({
  message,
  index
}: {
  message: ChatMessage
  index: number
}): ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`flex mb-6 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] px-6 py-4 rounded-2xl shadow-sm border ${
          message.role === 'user'
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
            : 'bg-white text-gray-800 rounded-bl-md border-gray-200'
        }`}
      >
        {/* Message content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Sources and backend metadata - Hidden for cleaner UX */}
        {/* 
        {message.role === 'assistant' && message.metadata && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.3 }}
            className="mt-3 pt-3 border-t border-gray-100"
          >
            {message.metadata.sources && (
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  📚 Sources:
                </div>
                <div className="flex flex-wrap gap-1">
                  {message.metadata.sources.map((source, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {message.metadata.confidence !== undefined && (
              <div className="text-xs text-gray-400 flex items-center space-x-3">
                <span>🤖 Backend Response</span>
                <span>📊 Chunks: {message.metadata.confidence}</span>
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
              </div>
            )}
          </motion.div>
        )}
        */}

        {/* Timestamp - Hidden for cleaner interface */}
        {/*
        <div
          className={`text-xs mt-2 ${
            message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
          }`}
        >
          {message.timestamp.toLocaleTimeString()}
        </div>
        */}
      </div>
    </motion.div>
  )
}

// Chat input component
function ChatInput({
  onSendMessage,
  disabled
}: {
  onSendMessage: (message: string) => void
  disabled: boolean
}): ReactElement {
  const [inputMessage, setInputMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() && !disabled) {
      onSendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  return (
    <motion.div
      className="relative border-t border-gray-200 bg-white p-4"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              disabled ? 'Assistant is thinking...' : 'Ask me anything...'
            }
            disabled={disabled}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <motion.button
          type="submit"
          disabled={disabled || !inputMessage.trim()}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </motion.button>
      </form>
    </motion.div>
  )
}

export default function ChatInterface(): ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! 👋 I'm your AI assistant. I'm here to help answer questions and have conversations with you.\n\nHow can I help you today?`,
      timestamp: new Date()
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [knowledgeStatus, setKnowledgeStatus] =
    useState<KnowledgeStatus | null>(null)
  const [hasKnowledge, setHasKnowledge] = useState(false)
  const [backendError, setBackendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Test function to verify backend connection
  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing backend connection...')

      // Test health endpoint
      const health = await chatbotApi.healthCheck()
      console.log('✅ Health check response:', health)

      // Test knowledge status
      const status = await chatbotApi.getKnowledgeStatus()
      console.log('✅ Knowledge status response:', status)

      // Add test message to chat
      const testMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🔍 **Backend Connection Test Results:**\n\n✅ **Health Status:** ${
          health.status
        }\n🦙 **Ollama Connected:** ${
          health.ollama_connected
        }\n�� **Available Models:** ${health.available_models?.join(
          ', '
        )}\n📊 **Active Sessions:** ${
          health.active_sessions
        }\n⏱️ **Uptime:** ${Math.round(
          health.uptime_seconds
        )}s\n🆔 **Session ID:** ${chatbotApi.getSessionId()}\n🌐 **API URL:** ${chatbotApi.getBaseUrl()}\n📚 **Knowledge Status:** ${
          status.has_knowledge
            ? `${status.chunk_count} chunks`
            : 'No knowledge loaded'
        }`,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, testMessage])
    } catch (error) {
      console.error('❌ Backend test failed:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ **Backend Connection Test Failed:**\n\nError: ${
          error.message
        }\n\nPlease ensure the RAG backend is running on ${chatbotApi.getBaseUrl()}`,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check knowledge status and backend health
  useEffect(() => {
    const checkKnowledgeAndHealth = async () => {
      try {
        // Check backend health first
        await chatbotApi.healthCheck()
        setBackendError(null)

        // Check knowledge status
        const status = await chatbotApi.getKnowledgeStatus()
        setKnowledgeStatus(status)
        setHasKnowledge(status.has_knowledge)

        console.log('✅ Knowledge status:', status)
      } catch (error) {
        console.error('❌ Backend or knowledge check failed:', error)
        setBackendError(error.message)
        setHasKnowledge(false)
      }
    }

    checkKnowledgeAndHealth()

    // Check periodically (every 30 seconds)
    const interval = setInterval(checkKnowledgeAndHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async (userMessage: string) => {
    // Check if knowledge is available
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

      console.log('🔄 Frontend received API response:', {
        success: apiResponse.success,
        hasResponse: !!apiResponse.response,
        responseContent: apiResponse.response,
        responseType: typeof apiResponse.response,
        responseLength: apiResponse.response?.length || 0,
        sources: apiResponse.sources,
        metadata: apiResponse.metadata,
        error: apiResponse.error,
        message: apiResponse.message
      })

      if (apiResponse.success && apiResponse.response) {
        console.log(
          '✅ Creating assistant message with content:',
          apiResponse.response
        )

        // Always use the backend response - let the LLM handle all types of questions
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: apiResponse.response,
          timestamp: new Date(),
          metadata: {
            sources: apiResponse.sources?.map((s) => s.source),
            confidence: apiResponse.metadata?.chunks_retrieved
          }
        }

        console.log('📝 Assistant message object:', assistantMessage)
        console.log(
          '🔍 About to add message to state. Current messages count:',
          messages.length
        )

        setMessages((prev) => {
          const newMessages = [...prev, assistantMessage]
          console.log(
            '📊 Updated messages array:',
            newMessages.map((m) => ({
              id: m.id,
              role: m.role,
              contentPreview: m.content.substring(0, 50) + '...',
              contentLength: m.content.length
            }))
          )
          return newMessages
        })

        console.log(
          `✅ Response generated in ${apiResponse.metadata?.processing_time_ms}ms`
        )
        console.log(
          `📚 Used ${apiResponse.metadata?.chunks_retrieved} knowledge chunks`
        )
        console.log('🔍 Backend response details:', {
          model_used: apiResponse.metadata?.model_used,
          processing_time: apiResponse.metadata?.processing_time_ms,
          chunks_retrieved: apiResponse.metadata?.chunks_retrieved,
          sources_found: apiResponse.sources?.length || 0
        })
      } else {
        console.error('❌ API response failed or empty:', {
          success: apiResponse.success,
          response: apiResponse.response,
          error: apiResponse.error,
          message: apiResponse.message
        })
        throw new Error(
          apiResponse.message || apiResponse.error || 'Unknown API error'
        )
      }
    } catch (error) {
      console.error('❌ Chat message failed:', error)

      let errorContent =
        'Sorry, I encountered an error processing your message.'

      if (error.message.includes('no_knowledge')) {
        errorContent =
          "I don't have access to any information for this session. Please add some compute job results first."
      } else if (error.message.includes('Cannot connect')) {
        errorContent =
          'Cannot connect to the chatbot backend. Please ensure the backend server is running on port 8001.'
      } else if (error.message.includes('fetch')) {
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
  }

  // Show backend status in UI
  const getBackendStatusDisplay = () => {
    if (backendError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">❌</span>
            <span className="text-red-700 text-sm font-medium">
              Backend Connection Error
            </span>
          </div>
          <p className="text-red-600 text-xs mt-1">{backendError}</p>
          <p className="text-red-500 text-xs mt-1">
            Please ensure the RAG backend is running on http://localhost:8001
          </p>
        </div>
      )
    }

    if (knowledgeStatus) {
      return (
        <div
          className={`border rounded-lg p-3 mb-4 ${
            hasKnowledge
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>{hasKnowledge ? '✅' : '⚠️'}</span>
              <span
                className={`text-sm font-medium ${
                  hasKnowledge ? 'text-green-700' : 'text-yellow-700'
                }`}
              >
                {hasKnowledge ? `AI Assistant Ready` : 'No Information Loaded'}
              </span>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                hasKnowledge
                  ? 'bg-green-100 text-green-600'
                  : 'bg-yellow-100 text-yellow-600'
              }`}
            >
              Session: {chatbotApi.getSessionId().slice(-8)}
            </span>
          </div>
          {hasKnowledge && (
            <div className="mt-2 text-xs text-green-600">
              📚 {knowledgeStatus.chunk_count} chunks from domains:{' '}
              {knowledgeStatus.domains.join(', ')}
            </div>
          )}
          {!hasKnowledge && (
            <p className="text-yellow-600 text-xs mt-1">
              Add compute job results above to enable enhanced chat features
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">🔄</span>
          <span className="text-blue-700 text-sm font-medium">
            Connecting to Backend...
          </span>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col h-[700px] bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
    >
      {/* Knowledge base info header */}
      <motion.div
        className="relative p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-100"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">AI Assistant</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={testBackendConnection}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-md transition-colors"
              title="Test backend connection and show debug info"
            >
              🔍 Test Backend
            </button>
            <button
              onClick={async () => {
                // Quick verification by asking the backend a simple question
                try {
                  const response = await chatbotApi.chat(
                    'Can you confirm you are the RAG backend?'
                  )
                  const testMessage: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `✅ **Backend Verification:** ${
                      response.response
                    }\n\n🔍 **Proof this is from backend:**\n- Processing time: ${
                      response.metadata?.processing_time_ms
                    }ms\n- Model: ${
                      response.metadata?.model_used
                    }\n- URL: ${chatbotApi.getBaseUrl()}`,
                    timestamp: new Date(),
                    metadata: {
                      confidence: response.metadata?.chunks_retrieved
                    }
                  }
                  setMessages((prev) => [...prev, testMessage])
                } catch (error) {
                  const errorMessage: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `❌ Backend verification failed: ${error.message}`,
                    timestamp: new Date()
                  }
                  setMessages((prev) => [...prev, errorMessage])
                }
              }}
              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded-md transition-colors"
              title="Quick test by asking the backend a question"
            >
              💬 Test Chat
            </button>
            <button
              onClick={() => {
                console.log('🔧 Debug Info:', {
                  sessionId: chatbotApi.getSessionId(),
                  baseUrl: chatbotApi.getBaseUrl(),
                  hasKnowledge,
                  knowledgeStatus,
                  currentMessages: messages.map((m) => ({
                    id: m.id,
                    role: m.role,
                    contentLength: m.content.length,
                    content: m.content
                  })),
                  backendError
                })

                // Also test the current session directly
                fetch('http://localhost:8001/api/v1/session/knowledge/status', {
                  headers: { 'X-Session-ID': chatbotApi.getSessionId() }
                })
                  .then((r) => r.json())
                  .then((status) =>
                    console.log('📊 Direct session status check:', status)
                  )
                  .catch((err) =>
                    console.error('❌ Direct session check failed:', err)
                  )

                // Test direct chat call
                fetch('http://localhost:8001/api/v1/session/chat', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': chatbotApi.getSessionId()
                  },
                  body: JSON.stringify({
                    session_id: chatbotApi.getSessionId(),
                    message: 'test direct call',
                    config: { max_tokens: 500, temperature: 0.7 }
                  })
                })
                  .then((r) => r.json())
                  .then((response) =>
                    console.log('🧪 Direct API call result:', response)
                  )
                  .catch((err) =>
                    console.error('❌ Direct API call failed:', err)
                  )
              }}
              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded-md transition-colors"
              title="Dump debug information to console"
            >
              🐛 Debug
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    'Clear all messages and reset session? This will help if there are caching issues.'
                  )
                ) {
                  console.log(
                    '🧹 Clearing frontend state and generating new session...'
                  )

                  // Clear messages
                  setMessages([
                    {
                      id: '1',
                      role: 'assistant',
                      content: `Hello! 👋 I'm your AI assistant. I'm here to help answer questions and have conversations with you.\n\nHow can I help you today?`,
                      timestamp: new Date()
                    }
                  ])

                  // Reset states
                  setHasKnowledge(false)
                  setKnowledgeStatus(null)
                  setBackendError(null)

                  console.log(
                    '✅ Frontend state cleared. New session will be created on next API call.'
                  )
                }
              }}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-md transition-colors"
              title="Clear frontend cache and reset session"
            >
              🧹 Reset
            </button>
          </div>
        </div>

        {/* Backend status indicator */}
        {getBackendStatusDisplay()}

        {/* Decorative gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400"></div>
      </motion.div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_rgb(0,0,0)_1px,_transparent_0)] bg-[length:24px_24px]"></div>

        <AnimatePresence>
          {messages.map((message, index) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              index={index}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>

        <motion.div
          ref={messagesEndRef}
          layout
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Input area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isTyping || backendError !== null}
      />
    </motion.div>
  )
}
