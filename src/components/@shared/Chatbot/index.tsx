import { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import JobList from './JobList'
import ChatShell from './ChatShell'
import { ChatbotUseCaseData } from '../../../@context/UseCases/models/Chatbot.model'
import { chatbotApi, KnowledgeStatus } from '../../../@utils/chatbot'

export default function ChatbotViz({
  algoDidsByChain,
  namespace
}: {
  algoDidsByChain: Record<number, string>
  namespace: string
}): ReactElement {
  // Get chatbot data from IndexedDB through useUseCases hook
  const [, setChatbotData] = useState<ChatbotUseCaseData[]>([])

  type AssistantState =
    | 'connecting'
    | 'backend-error'
    | 'uploading'
    | 'processing'
    | 'ready'
    | 'no-knowledge'

  const [assistantStatus, setAssistantStatus] =
    useState<AssistantState>('connecting')
  const [knowledgeStatus, setKnowledgeStatus] =
    useState<KnowledgeStatus | null>(null)
  const [backendError, setBackendError] = useState<string | null>(null)

  // Poller controls
  const inFlightRef = useRef<boolean>(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const processingBackoffMsRef = useRef<number>(2000)
  const assistantStatusRef = useRef<AssistantState>('connecting')
  const backendErrorRef = useRef<string | null>(null)

  const pollOnce = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true

    let nextDelay = 30000 // default cadence

    try {
      // Always verify backend health first
      await chatbotApi.healthCheck()
      if (backendErrorRef.current) setBackendError(null)

      // Check knowledge status with auto-sync capability
      // This will automatically upload IndexedDB data if backend has no knowledge
      const status = await chatbotApi.checkAndAutoSync()
      setKnowledgeStatus(status)

      const hasKnowledge = Boolean(status?.has_knowledge)

      // Derive assistant state
      // Preserve 'uploading' while an upload is in-flight so UI shows correct status.
      if (assistantStatusRef.current === 'uploading') {
        setAssistantStatus('uploading')
      } else if (assistantStatusRef.current === 'processing') {
        setAssistantStatus(hasKnowledge ? 'ready' : 'processing')
      } else {
        setAssistantStatus(hasKnowledge ? 'ready' : 'no-knowledge')
      }

      // Adjust delay while processing (exponential backoff, capped at 30s)
      if (
        assistantStatusRef.current === 'uploading' ||
        assistantStatusRef.current === 'processing'
      ) {
        nextDelay = processingBackoffMsRef.current
        processingBackoffMsRef.current = Math.min(
          processingBackoffMsRef.current * 2,
          30000
        )
      } else {
        nextDelay = 30000
        processingBackoffMsRef.current = 2000
      }
    } catch (error: unknown) {
      const message = (error as Error)?.message || ''

      // 429 handling
      if (message.includes('429')) {
        nextDelay = 60000
      } else {
        // Other errors -> mark backend error but do not spam requests
        setBackendError(message || 'Unknown backend error')
        setAssistantStatus('backend-error')
        nextDelay = 30000
      }
    } finally {
      inFlightRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        pollOnce()
      }, nextDelay)
    }
  }, [])

  // Expose imperative refresh to children (e.g. after session reset)
  const forceRefresh = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    processingBackoffMsRef.current = 2000
    pollOnce()
  }, [pollOnce])

  // Keep refs in sync with state
  useEffect(() => {
    assistantStatusRef.current = assistantStatus
  }, [assistantStatus])
  useEffect(() => {
    backendErrorRef.current = backendError
  }, [backendError])

  // Initialize connection and start poller
  useEffect(() => {
    setAssistantStatus('connecting')
    processingBackoffMsRef.current = 2000
    // ensure API uses namespace-specific session
    try {
      chatbotApi.setNamespace(namespace)
    } catch {}
    pollOnce()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [pollOnce, namespace])

  return (
    <div className="flex flex-col gap-6">
      <JobList
        algoDidsByChain={algoDidsByChain}
        namespace={namespace}
        setChatbotData={setChatbotData}
        onStatusChange={(s: AssistantState) => {
          setAssistantStatus(s)
          // When switching to processing, kick the poller immediately
          if (s === 'processing' || s === 'uploading') {
            processingBackoffMsRef.current = 2000
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            pollOnce()
          }
        }}
        onForceRefresh={forceRefresh}
      />
      <ChatShell
        status={assistantStatus}
        knowledgeStatus={knowledgeStatus}
        backendError={backendError}
      />
    </div>
  )
}
