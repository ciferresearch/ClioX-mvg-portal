import { ReactElement, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { ChatMessage, KnowledgeBase } from './_types'
import { searchKnowledgeBase } from './useDataLoader'

interface ChatInterfaceProps {
  knowledgeBase: KnowledgeBase
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
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {/* Message bubble */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`px-4 py-3 rounded-2xl shadow-sm max-w-xs lg:max-w-md ${
          isUser
            ? 'bg-gray-100 text-gray-800 rounded-br-md'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {message.content}
        </p>
      </motion.div>
    </motion.div>
  )
}

// Enhanced chat input component
function ChatInput({
  onSendMessage,
  disabled
}: {
  onSendMessage: (message: string) => void
  disabled: boolean
}): ReactElement {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  return (
    <motion.div
      className="p-4 bg-white border-t border-gray-200"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything"
            disabled={disabled}
            className={`w-full px-4 py-3 rounded-xl border transition-colors duration-200 outline-none text-sm ${
              isFocused
                ? 'border-gray-400 bg-white'
                : 'border-gray-300 bg-gray-50'
            } hover:bg-white disabled:opacity-50`}
          />
        </div>

        <motion.button
          type="submit"
          disabled={disabled || !inputValue.trim()}
          className={`p-3 rounded-xl transition-all duration-200 ${
            disabled || !inputValue.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-700 text-white hover:bg-gray-800'
          }`}
          whileHover={!disabled && inputValue.trim() ? { scale: 1.02 } : {}}
          whileTap={!disabled && inputValue.trim() ? { scale: 0.98 } : {}}
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </motion.button>
      </form>
    </motion.div>
  )
}

// Main chat interface component
export default function ChatInterface({
  knowledgeBase
}: ChatInterfaceProps): ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Welcome! 👋 I'm your AI assistant with access to Enron email communications. I can help you explore ${knowledgeBase.totalChunks} documents covering:\n\n📧 Executive communications\n💼 Trading strategies\n📊 Financial reporting\n🏛️ Corporate governance\n👥 Employee benefits\n\nTry asking questions like:\n• "What did Jeff Skilling say about earnings?"\n• "Tell me about energy trading strategies"\n• "What accounting practices were discussed?"\n\nWhat would you like to explore?`,
      timestamp: new Date()
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mock response generation using knowledge base search (replace with real Ollama integration later)
  const generateMockResponse = (
    userMessage: string,
    kb: KnowledgeBase
  ): string => {
    const lowerMessage = userMessage.toLowerCase()

    // Handle greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      const domains = Object.keys(kb.domains)
      return `Hello! 👋 I'm your AI assistant powered by your Enron email knowledge base. I have access to ${kb.totalChunks} documents covering topics like corporate communications, trading strategies, and financial reporting. What would you like to know?`
    }

    // Handle thanks
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return `You're welcome! I'm here to help you explore your knowledge base. Feel free to ask about any aspect of the Enron communications - from executive decisions to trading strategies.`
    }

    // Handle questions about the system itself
    if (
      lowerMessage.includes('how do you work') ||
      lowerMessage.includes('what can you do')
    ) {
      return `I analyze your knowledge base of ${kb.totalChunks} documents and can answer questions about:\n\n📧 Corporate communications\n💼 Trading strategies\n📊 Financial reporting\n🏛️ Governance and board decisions\n👥 Employee benefits and HR\n\nTry asking specific questions like "What did Jeff Skilling say about earnings?" or "Tell me about energy trading strategies."`
    }

    // Search the knowledge base for relevant content
    const relevantChunks = searchKnowledgeBase(userMessage, kb)

    if (relevantChunks.length === 0) {
      // Provide helpful suggestions when no results found
      const suggestions = [
        'What did Jeff Skilling discuss in his emails?',
        "Tell me about Enron's trading strategies",
        'What accounting practices were mentioned?',
        'How were employee benefits structured?',
        'What governance issues were discussed?'
      ]
      const randomSuggestion =
        suggestions[Math.floor(Math.random() * suggestions.length)]

      return `I couldn't find specific information about "${userMessage}" in your knowledge base. 🤔\n\nYour knowledge base contains information about corporate communications, trading, accounting, governance, and benefits.\n\n💡 Try asking: "${randomSuggestion}"`
    }

    // Build response using the most relevant chunks
    const topChunk = relevantChunks[0]

    // Add some variety to response formats
    const responseFormats = [
      `Here's what I found in your knowledge base:\n\n📄 ${topChunk.content}`,
      `Based on the Enron communications, I can tell you:\n\n${topChunk.content}`,
      `I found relevant information:\n\n${topChunk.content}`,
      `According to the documents:\n\n${topChunk.content}`
    ]

    let response =
      responseFormats[Math.floor(Math.random() * responseFormats.length)]

    // Add source information with emojis
    if (topChunk.metadata.source) {
      response += `\n\n📎 *Source: ${topChunk.metadata.source}*`
      if (topChunk.metadata.date) {
        response += `\n📅 *Date: ${topChunk.metadata.date}*`
      }
    }

    // Add entities if available
    if (topChunk.metadata.entities && topChunk.metadata.entities.length > 0) {
      response += `\n🏷️ *Key entities: ${topChunk.metadata.entities.join(
        ', '
      )}*`
    }

    // Add additional context if available
    if (relevantChunks.length > 1) {
      response += `\n\n🔍 I found ${
        relevantChunks.length - 1
      } other related documents. Would you like me to explore those as well?`
    }

    // Add follow-up suggestions based on topic
    if (topChunk.metadata.topic) {
      const followUps = {
        earnings: [
          'What other financial metrics were discussed?',
          'Tell me about revenue growth'
        ],
        trading: [
          'What risk management strategies were used?',
          'How did they analyze market positions?'
        ],
        accounting: [
          'What were the main accounting concerns?',
          'Tell me about financial reporting'
        ],
        governance: [
          'What strategic decisions were made?',
          'How did the board operate?'
        ],
        benefits: [
          'What other employee policies existed?',
          'How were stock options managed?'
        ]
      }

      const suggestions = followUps[topChunk.metadata.topic]
      if (suggestions) {
        const randomFollowUp =
          suggestions[Math.floor(Math.random() * suggestions.length)]
        response += `\n\n💭 *You might also ask: "${randomFollowUp}"*`
      }
    }

    return response
  }

  const handleSendMessage = async (userMessage: string) => {
    // Add user message
    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, userChatMessage])

    // Show typing indicator
    setIsTyping(true)

    // Mock response generation (replace with real logic later)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(userMessage, knowledgeBase),
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000)
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
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">AI Assistant</h3>
          </div>
        </div>

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
      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </motion.div>
  )
}
