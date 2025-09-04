import { ReactElement, ReactNode, useEffect, useId, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { createPortal } from 'react-dom'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  type Placement
} from '@floating-ui/react-dom'

export default function Tooltip({
  label,
  children,
  placement = 'top'
}: {
  label: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}): ReactElement {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)

  const { x, y, strategy, refs, update } = useFloating({
    placement: placement as Placement,
    strategy: 'fixed',
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  })

  useEffect(() => {
    if (!open) return
    if (!refs.reference.current || !refs.floating.current) return
    return autoUpdate(refs.reference.current, refs.floating.current, update)
  }, [open, refs.reference, refs.floating, update])

  const floating = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={refs.setFloating}
          role="tooltip"
          id={tooltipId}
          initial={{ opacity: 0, scale: 0.96, y: 2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 2 }}
          transition={{ duration: 0.15 }}
          style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-black/90 backdrop-blur shadow-lg whitespace-nowrap z-[999] pointer-events-none`}
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div
      ref={refs.setReference}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {typeof window !== 'undefined'
        ? createPortal(floating, document.body)
        : floating}
    </div>
  )
}
