import { ReactElement, ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IconChevronUp } from '@tabler/icons-react'
import Badge from '@shared/atoms/Badge'

export default function Accordion({
  title,
  defaultExpanded = false,
  badgeNumber,
  compact,
  action,
  children
}: {
  title: string
  defaultExpanded?: boolean
  badgeNumber?: number
  compact?: boolean
  action?: ReactNode
  children: ReactNode
}): ReactElement {
  const [open, setOpen] = useState(!!defaultExpanded)

  function handleClick() {
    setOpen(!open)
  }

  return (
    <div className="border-b border-gray-200 last:border-b-0 cursor-pointer">
      <motion.h3
        className={`flex items-center justify-between ${
          compact ? 'text-sm' : 'text-2xl font-bold'
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-1">
          <span className="text-emerald-700">{title}</span>
          {badgeNumber > 0 && <Badge label={badgeNumber} />}
        </div>
        <motion.button
          className="p-1 text-gray-600 cursor-pointer"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <IconChevronUp className="w-5 h-5 cursor" strokeWidth={5} />
        </motion.button>
      </motion.h3>

      {action}

      <AnimatePresence>
        {open && (
          <motion.div
            className={`${compact ? 'pb-4' : 'pb-6'}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
