import { ReactElement, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { IconCopy } from '@tabler/icons-react'
import type { AssistantState } from '../../hooks/useChat'
import type { KnowledgeStatus } from '../../../../../@utils/chatbot'

export default function SessionInfoPanel({
  open,
  sessionId,
  assistantStatus,
  knowledgeStatus,
  backendError,
  onClose,
  toggleRef
}: {
  open: boolean
  sessionId?: string | null
  assistantStatus?: AssistantState
  knowledgeStatus?: KnowledgeStatus | null
  backendError?: string | null
  onClose: () => void
  toggleRef?: React.RefObject<HTMLElement>
}): ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (panelRef.current?.contains(t)) return
      if (toggleRef?.current && toggleRef.current.contains(t)) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open, onClose, toggleRef])

  if (!open) return null

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className="absolute left-0 top-[calc(100%+12px)] w-80 rounded-2xl bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl p-4 z-30"
      role="dialog"
      aria-label="Session and knowledge status"
    >
      <div className="mb-3">
        <div className="text-sm font-semibold text-[#2b2e3b] mb-1">Session</div>
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
          <div className="text-xs text-red-600 mt-1">{backendError}</div>
        )}
      </div>

      <div>
        <div className="text-sm font-semibold text-[#2b2e3b] mb-1">
          Knowledge
        </div>
        <div className="text-xs text-[#4c5167]">
          has_knowledge: {knowledgeStatus?.has_knowledge ? 'Yes' : 'No'}
        </div>
        <div className="text-xs text-[#4c5167] mt-1">
          chunks: {knowledgeStatus?.chunk_count ?? 0}
        </div>
        {knowledgeStatus?.domains && knowledgeStatus.domains.length > 0 && (
          <div className="text-xs text-[#4c5167] mt-1 truncate">
            domains: {knowledgeStatus.domains.slice(0, 3).join(', ')}
            {knowledgeStatus.domains.length > 3 && '…'}
          </div>
        )}
      </div>
    </motion.div>
  )
}
