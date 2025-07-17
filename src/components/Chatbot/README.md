# Chatbot Component

A complete RAG (Retrieval-Augmented Generation) chatbot interface integrated with Ocean Protocol compute jobs.

## Current Implementation (API-Integrated)

### What's Real ✅

1. **AI Responses** - Real LLM responses via backend API (Ollama)
2. **Knowledge Upload** - Actual RAG pipeline with vector search
3. **Backend Integration** - Real API calls to RAG chatbot backend on port 8001
4. **Session Management** - Proper session handling and knowledge persistence

### What's Demo/Mock ⚠️

1. **Compute Jobs** - Demo job shown for testing (clearly labeled as "🔧 Demo Job")
2. **Knowledge Content** - Demo knowledge chunks for API testing
3. **Job Metadata** - Mock job structure for development

### File Structure

- **ChatInterface.tsx** - Main chat UI with real API integration
- **JobList.tsx** - Compute job management with demo data available
- **useDataLoader.ts** - Local state management for UI display
- **chatbotApi.ts** - API service layer for backend communication
- **\_types.ts** - TypeScript interfaces
- **\_constants.ts** - Configuration and demo data

## Integration Status

### ✅ Fully Integrated

- Real RAG pipeline (Retrieval → Augmentation → Generation)
- Vector search and knowledge retrieval
- Session-based knowledge management
- Conversational AI with fallback responses
- Error handling and backend health monitoring

### 🔄 Next Steps

1. **Real Compute Jobs** - Replace demo jobs with actual Ocean Protocol compute results
2. **Production Data** - Process real compute job outputs into knowledge chunks
3. **Advanced Features** - Multi-domain knowledge bases, better embeddings

## Usage

1. **Start Backend**: Ensure RAG chatbot backend is running on port 8001
2. **Add Knowledge**: Click "Add" on the demo job to upload knowledge to API
3. **Chat**: Ask questions about the uploaded knowledge or general topics
4. **Monitor**: Check backend status indicators for health and knowledge status

**Current Status**: ✅ Production-ready API integration with demo data for testing
