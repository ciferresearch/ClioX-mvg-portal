import { ReactElement, ReactNode } from 'react'
import { motion } from 'motion/react'

export interface BadgeProps {
  label: string | ReactNode
  className?: string
}

export default function Badge({ label, className }: BadgeProps): ReactElement {
  return (
    <motion.span
      className={`inline-block text-sm font-bold uppercase px-1 py-1 rounded-md text-white bg-emerald-500 ${
        className || ''
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {label}
    </motion.span>
  )
}
