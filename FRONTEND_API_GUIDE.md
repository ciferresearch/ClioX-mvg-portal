# 🌐 Frontend API Integration Guide

Complete guide for integrating with the RAG Chatbot Backend APIs. This document provides everything frontend developers need to build a chat interface that leverages the RAG (Retrieval-Augmented Generation) capabilities.

## 📋 Quick Overview

- **Backend URL**: `http://localhost:8001`
- **API Documentation**: `http://localhost:8001/docs` (Interactive Swagger UI)
- **Required Headers**: `Content-Type: application/json`, `X-Session-ID`
- **Rate Limiting**: 20 requests/minute per endpoint
- **CORS**: Configured for `localhost:8000` and `localhost:3000`

## 🔗 Base Configuration

### API Base URL

```javascript
const API_BASE_URL = 'http://localhost:8001'
```

### Required Headers

```javascript
const headers = {
  'Content-Type': 'application/json',
  'X-Session-ID': 'your_unique_session_id' // Generate unique ID per user/session
}
```

### Session ID Generation

```javascript
// Generate a unique session ID for each user/chat session
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Example: "session_1672531200000_k3j5h7a9x"
const sessionId = generateSessionId()
```

## 📡 API Endpoints

### 1. Health Check

**Purpose**: Check if the backend is running and get system status

```javascript
// GET /api/health
const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Example Response:
{
  "status": "healthy",
  "timestamp": 1672531200.123,
  "ollama_connected": true,
  "available_models": ["llama3.2:1b"],
  "active_sessions": 5,
  "uptime_seconds": 3600.45
}
```

### 2. Upload Knowledge Base

**Purpose**: Upload documents/content that the AI can reference during conversations

```javascript
// POST /api/v1/session/knowledge/upload
const uploadKnowledge = async (sessionId, knowledgeChunks, domains = []) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/session/knowledge/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        session_id: sessionId,
        knowledge_chunks: knowledgeChunks,
        domains: domains
      })
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Knowledge upload failed:', error);
    throw error;
  }
};

// Example Usage:
const knowledgeChunks = [
  {
    id: "doc_001",
    content: "Ocean Protocol is a decentralized data exchange protocol that enables data sharing while preserving privacy...",
    metadata: {
      source: "ocean_protocol_docs.pdf",
      category: "protocol_overview",
      tags: ["blockchain", "data", "privacy"]
    }
  },
  {
    id: "doc_002",
    content: "Data NFTs represent datasets as non-fungible tokens on the blockchain...",
    metadata: {
      source: "data_nft_guide.md",
      category: "nfts",
      tags: ["nft", "datasets", "blockchain"]
    }
  }
];

const result = await uploadKnowledge(sessionId, knowledgeChunks, ["blockchain", "web3"]);

// Example Response:
{
  "success": true,
  "session_id": "session_1672531200000_k3j5h7a9x",
  "chunks_processed": 2,
  "domains": ["blockchain", "web3"],
  "message": null
}
```

### 3. Check Knowledge Status

**Purpose**: Verify what knowledge has been uploaded for a session

```javascript
// GET /api/v1/session/knowledge/status
const getKnowledgeStatus = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/session/knowledge/status`, {
      headers: {
        'X-Session-ID': sessionId
      }
    });

    return await response.json();
  } catch (error) {
    console.error('Knowledge status check failed:', error);
    throw error;
  }
};

// Example Response:
{
  "has_knowledge": true,
  "chunk_count": 2,
  "domains": ["blockchain", "web3"],
  "session_id": "session_1672531200000_k3j5h7a9x"
}
```

### 4. Chat with RAG (Main Feature)

**Purpose**: Send user messages and get AI responses based on uploaded knowledge

```javascript
// POST /api/v1/session/chat
const sendChatMessage = async (sessionId, message, config = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/session/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message,
        config: {
          max_tokens: config.maxTokens || 500,
          temperature: config.temperature || 0.7,
          model: config.model || undefined // Uses default model
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat request failed:', error);
    throw error;
  }
};

// Example Usage:
const response = await sendChatMessage(
  sessionId,
  "What is Ocean Protocol and how do Data NFTs work?",
  { maxTokens: 400, temperature: 0.6 }
);

// Example Response:
{
  "success": true,
  "response": "Based on the uploaded knowledge base, Ocean Protocol is a decentralized data exchange protocol that enables data sharing while preserving privacy. It allows data owners to monetize their data without giving up control...",
  "sources": [
    {
      "source": "ocean_protocol_docs.pdf",
      "relevance_score": 3.8571,
      "content_preview": "Ocean Protocol is a decentralized data exchange protocol that enables data sharing..."
    },
    {
      "source": "data_nft_guide.md",
      "relevance_score": 3.5443,
      "content_preview": "Data NFTs represent datasets as non-fungible tokens on the blockchain..."
    }
  ],
  "metadata": {
    "chunks_retrieved": 2,
    "processing_time_ms": 2845,
    "model_used": "llama3.2:1b"
  },
  "error": null,
  "message": null
}
```

## 🔧 Complete Integration Example

Here's a complete example of how to implement a RAG chatbot in your frontend:

```javascript
class RAGChatbot {
  constructor(baseUrl = 'http://localhost:8001') {
    this.baseUrl = baseUrl
    this.sessionId = this.generateSessionId()
    this.isHealthy = false
    this.hasKnowledge = false
  }

  generateSessionId() {
    return (
      'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    )
  }

  async initialize() {
    try {
      // Check backend health
      const health = await this.checkHealth()
      this.isHealthy = health.status === 'healthy'

      console.log('✅ RAG Chatbot initialized:', {
        sessionId: this.sessionId,
        backendHealthy: this.isHealthy,
        ollamaConnected: health.ollama_connected
      })

      return this.isHealthy
    } catch (error) {
      console.error('❌ Failed to initialize RAG Chatbot:', error)
      return false
    }
  }

  async checkHealth() {
    const response = await fetch(`${this.baseUrl}/api/health`)
    return await response.json()
  }

  async uploadDocuments(documents) {
    try {
      const knowledgeChunks = documents.map((doc, index) => ({
        id: doc.id || `doc_${index + 1}`,
        content: doc.content,
        metadata: {
          source: doc.filename || `document_${index + 1}`,
          category: doc.category || 'general',
          tags: doc.tags || [],
          ...doc.metadata
        }
      }))

      const result = await fetch(
        `${this.baseUrl}/api/v1/session/knowledge/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId
          },
          body: JSON.stringify({
            session_id: this.sessionId,
            knowledge_chunks: knowledgeChunks,
            domains: documents.flatMap((doc) => doc.domains || [])
          })
        }
      )

      const data = await result.json()

      if (data.success) {
        this.hasKnowledge = true
        console.log(`✅ Uploaded ${data.chunks_processed} knowledge chunks`)
      }

      return data
    } catch (error) {
      console.error('❌ Document upload failed:', error)
      throw error
    }
  }

  async sendMessage(message, options = {}) {
    if (!this.hasKnowledge) {
      throw new Error(
        'No knowledge base uploaded. Please upload documents first.'
      )
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/session/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          message: message,
          config: {
            max_tokens: options.maxTokens || 500,
            temperature: options.temperature || 0.7
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log(
          `✅ Response generated in ${data.metadata.processing_time_ms}ms`
        )
        console.log(
          `📚 Used ${data.metadata.chunks_retrieved} knowledge chunks`
        )
      }

      return data
    } catch (error) {
      console.error('❌ Chat message failed:', error)
      throw error
    }
  }

  async getKnowledgeStatus() {
    const response = await fetch(
      `${this.baseUrl}/api/v1/session/knowledge/status`,
      {
        headers: { 'X-Session-ID': this.sessionId }
      }
    )
    return await response.json()
  }
}

// Usage Example:
async function initializeChatbot() {
  const chatbot = new RAGChatbot()

  // Initialize the chatbot
  const isReady = await chatbot.initialize()
  if (!isReady) {
    throw new Error('Backend not available')
  }

  // Upload knowledge documents
  const documents = [
    {
      id: 'ocean_guide',
      content: 'Ocean Protocol enables decentralized data exchange...',
      filename: 'ocean_protocol_guide.pdf',
      category: 'protocol',
      domains: ['blockchain', 'data'],
      tags: ['ocean', 'protocol', 'web3']
    }
  ]

  await chatbot.uploadDocuments(documents)

  // Send a chat message
  const response = await chatbot.sendMessage('How does Ocean Protocol work?', {
    maxTokens: 400,
    temperature: 0.6
  })

  console.log('🤖 AI Response:', response.response)
  console.log('📖 Sources:', response.sources)

  return chatbot
}

// Initialize when your app loads
initializeChatbot().catch(console.error)
```

## 🎨 React/Vue Component Examples

### React Hook Example

```javascript
import { useState, useEffect } from 'react'

const useRAGChatbot = () => {
  const [chatbot, setChatbot] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [isHealthy, setIsHealthy] = useState(false)

  useEffect(() => {
    const initChatbot = async () => {
      const bot = new RAGChatbot()
      const healthy = await bot.initialize()
      setIsHealthy(healthy)
      setChatbot(bot)
    }

    initChatbot()
  }, [])

  const uploadDocuments = async (documents) => {
    if (!chatbot) return
    setIsLoading(true)
    try {
      await chatbot.uploadDocuments(documents)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (message) => {
    if (!chatbot) return

    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    }
    setMessages((prev) => [...prev, userMessage])

    setIsLoading(true)
    try {
      const response = await chatbot.sendMessage(message)

      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        metadata: response.metadata,
        timestamp: Date.now()
      }

      setMessages((prev) => [...prev, aiMessage])
      return response
    } catch (error) {
      console.error('Send message error:', error)
      const errorMessage = {
        role: 'error',
        content: 'Sorry, I encountered an error processing your message.',
        timestamp: Date.now()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    chatbot,
    isHealthy,
    isLoading,
    messages,
    uploadDocuments,
    sendMessage,
    clearMessages: () => setMessages([])
  }
}

// Component usage
const ChatInterface = () => {
  const { isHealthy, isLoading, messages, sendMessage, uploadDocuments } =
    useRAGChatbot()
  const [inputMessage, setInputMessage] = useState('')

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    await sendMessage(inputMessage)
    setInputMessage('')
  }

  if (!isHealthy) {
    return <div>⚠️ Connecting to chatbot backend...</div>
  }

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            {msg.sources && (
              <div className="sources">
                <strong>Sources:</strong>
                {msg.sources.map((source, i) => (
                  <span key={i} className="source">
                    {source.source} (score: {source.relevance_score.toFixed(2)})
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputMessage.trim()}>
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
```

## ⚠️ Error Handling

### Common Error Responses

```javascript
// Session not found / No knowledge base
{
  "success": false,
  "response": null,
  "sources": null,
  "metadata": null,
  "error": "no_knowledge",
  "message": "No knowledge base found for this session"
}

// Rate limit exceeded
{
  "detail": "Rate limit exceeded: 20 per 1 minute"
}

// Missing session ID
{
  "detail": {
    "success": false,
    "error": "missing_session_id"
  }
}

// Backend/Ollama connection error
{
  "success": false,
  "response": null,
  "sources": null,
  "metadata": null,
  "error": "processing_error",
  "message": "Cannot connect to host localhost:11434"
}
```

### Error Handling Implementation

```javascript
const handleAPIError = (error, response) => {
  if (response?.status === 429) {
    return 'Rate limit exceeded. Please wait a moment before trying again.'
  }

  if (response?.status === 400) {
    return 'Invalid request. Please check your input.'
  }

  if (response?.status === 500) {
    return 'Server error. Please try again later.'
  }

  if (error.message.includes('fetch')) {
    return 'Cannot connect to the chatbot backend. Please check if the server is running.'
  }

  return 'An unexpected error occurred. Please try again.'
}

// Usage in your API calls:
try {
  const response = await sendChatMessage(sessionId, message)
  // Handle success
} catch (error) {
  const errorMessage = handleAPIError(error)
  // Show error to user
  console.error('Chat error:', errorMessage)
}
```

## 🔧 Configuration Options

### Chat Configuration

```javascript
const chatConfig = {
  maxTokens: 500, // Maximum response length (50-2000)
  temperature: 0.7, // Creativity level (0.0-1.0)
  model: undefined // Use default model (llama3.2:1b)
}

await sendChatMessage(sessionId, message, chatConfig)
```

### Document Upload Best Practices

```javascript
// Optimal chunk size: 200-1000 words
// Include relevant metadata for better retrieval
const optimizedDocument = {
  id: 'unique_doc_id',
  content: 'Well-structured content with clear context...',
  metadata: {
    source: 'filename.pdf',
    category: 'specific_category',
    tags: ['relevant', 'keywords'],
    date: '2024-01-15',
    author: 'Author Name'
  }
}
```

## 🚀 Performance Tips

1. **Session Management**: Reuse session IDs for related conversations
2. **Chunking**: Break large documents into logical chunks (200-1000 words)
3. **Caching**: Cache health check results to avoid unnecessary requests
4. **Error Recovery**: Implement retry logic with exponential backoff
5. **User Feedback**: Show loading states and processing times to users

## 🔍 Testing & Debugging

### Test the Backend Connection

```javascript
// Quick connection test
const testConnection = async () => {
  try {
    const response = await fetch('http://localhost:8001/api/health')
    const data = await response.json()
    console.log('✅ Backend Status:', data.status)
    console.log('🦙 Ollama Connected:', data.ollama_connected)
    console.log('🤖 Available Models:', data.available_models)
    return data.status === 'healthy'
  } catch (error) {
    console.error('❌ Backend connection failed:', error)
    return false
  }
}

testConnection()
```

### Debug Knowledge Upload

```javascript
const debugKnowledgeUpload = async (sessionId) => {
  // Check status before upload
  console.log(
    '📊 Knowledge Status Before:',
    await getKnowledgeStatus(sessionId)
  )

  // Upload test document
  const testDoc = [
    {
      id: 'test_doc',
      content: 'This is a test document for debugging purposes.',
      metadata: { source: 'test.txt', category: 'debug' }
    }
  ]

  const uploadResult = await uploadKnowledge(sessionId, testDoc, ['test'])
  console.log('📤 Upload Result:', uploadResult)

  // Check status after upload
  console.log('📊 Knowledge Status After:', await getKnowledgeStatus(sessionId))
}
```

## 📞 Support & Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your frontend runs on `localhost:8000` or `localhost:3000`
2. **Connection Refused**: Check if the backend server is running on port 8001
3. **Model Not Found**: Verify Ollama is running and has the llama3.2:1b model
4. **Rate Limiting**: Implement proper request throttling in your frontend

### Getting Help

- **Interactive API Docs**: Visit `http://localhost:8001/docs` when the server is running
- **Health Endpoint**: `http://localhost:8001/api/health` for real-time status
- **GitHub Issues**: [Report bugs or request features](https://github.com/augustmood/rag_chatbot_backend/issues)

---

**🎉 Happy coding! Your RAG chatbot frontend integration is ready to go!**
