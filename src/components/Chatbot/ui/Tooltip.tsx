import { ReactElement, ReactNode, useId, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

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

  const positions: Record<string, string> = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            role="tooltip"
            id={tooltipId}
            initial={{ opacity: 0, scale: 0.96, y: 2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 2 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 px-3 py-1.5 rounded-md text-xs text-white bg-black/90 backdrop-blur shadow-lg whitespace-nowrap ${positions[placement]}`}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
