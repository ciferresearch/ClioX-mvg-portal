import { ReactElement, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { IconX } from '@tabler/icons-react'

export default function IdeasPanel({
  open,
  suggestions,
  onClose,
  onPick,
  toggleRef
}: {
  open: boolean
  suggestions: string[]
  onClose: () => void
  onPick: (s: string) => void
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
      if (t.closest('[data-idea-toggle]')) return
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
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className="absolute left-0 right-0 top-[calc(100%+12px)] z-20 rounded-2xl bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="text-[13px] font-semibold text-[#2b2e3b]">Ideas</div>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-50 transition-colors text-[#4c5167] cursor-pointer"
          aria-label="Close ideas"
          onClick={onClose}
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
      <div className="border-t border-gray-200" />
      <ul className="divide-y divide-gray-200">
        {suggestions.map((s) => (
          <li key={s}>
            <button
              type="button"
              className="w-full text-left px-4 py-2.5 text-sm text-[#2b2e3b] hover:bg-gray-50 focus:outline-none cursor-pointer"
              onClick={() => onPick(s)}
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
