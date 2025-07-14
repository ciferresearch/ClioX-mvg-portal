# Chatbot Component Documentation

## Overview

AI assistant interface that will process user-uploaded data through compute jobs and create a searchable knowledge base for chat interactions.

## Current Implementation (All Mocked)

### What's Mocked

1. **Knowledge Base** - 5 sample Enron email chunks with metadata
2. **AI Responses** - Simple keyword matching with templated responses
3. **Compute Jobs** - Mock job metadata instead of real Ocean Protocol jobs
4. **Search** - Basic text search instead of vector/semantic search

### Mock Data Location

- **Knowledge chunks**: `JobList.tsx` → `autoLoadMockData()` function
- **AI responses**: `ChatInterface.tsx` → `generateMockResponse()` function
- **Job metadata**: `_constants.ts` → `MOCK_CHATBOT_COMPUTE_JOB`

## Future Integration Notes

### To Replace with Real Implementation:

1. **LLM Integration** - Replace mock responses with Ollama API calls
2. **Vector Search** - Replace text search with semantic/embedding search
3. **Real Data** - Connect to actual Ocean Protocol compute results
4. **Knowledge Processing** - Build pipeline to process uploaded documents

### Key Integration Points:

- `generateMockResponse()` → Real LLM API calls
- `searchKnowledgeBase()` → Vector similarity search
- `autoLoadMockData()` → Real compute job results
- Add environment variables for configuration

---

**Current Status**: Fully functional mock interface for testing and development.  
**Next**: Replace components gradually when ready to integrate real services.
