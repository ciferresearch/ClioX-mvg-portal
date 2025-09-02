import { ReactElement, useCallback, useState } from 'react'
import { motion } from 'motion/react'
import Tooltip from './Tooltip'
import { IconCopy, IconRefresh } from '@tabler/icons-react'

export default function MessageActions({
  visible,
  content,
  onCopy,
  onRetry,
  disabled = false,
  className
}: {
  visible: boolean
  content: string
  onCopy?: (content: string) => void
  onRetry?: () => void
  disabled?: boolean
  className?: string
}): ReactElement | null {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      if (onCopy) {
        await onCopy(content)
      } else {
        await navigator.clipboard.writeText(content)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = content
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {}
    }
  }, [content, onCopy])

  if (!visible) return null

  return (
    <div className={`mt-3 ${className || ''}`}>
      {/* Animated border (top of actions) */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
        className="h-[1px] bg-[#d0d2dd]"
      />

      {/* Buttons row below the border */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="flex items-center gap-2 pt-2"
      >
        <Tooltip label={copied ? 'Copied' : 'Copy'} placement="bottom">
          <button
            type="button"
            aria-label="Copy"
            onClick={handleCopy}
            className="inline-flex items-center justify-center rounded-md bg-white hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-8 h-8"
            disabled={disabled}
          >
            <IconCopy className="h-4 w-4 text-[#4c5167]" />
          </button>
        </Tooltip>

        <Tooltip
          label={disabled ? 'Generating…' : 'Try again'}
          placement="bottom"
        >
          <button
            type="button"
            aria-label="Try again"
            onClick={() => onRetry && onRetry()}
            className="inline-flex items-center justify-center rounded-md bg-white hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-8 h-8"
            disabled={disabled || !onRetry}
          >
            <IconRefresh className="h-4 w-4 text-[#4c5167]" />
          </button>
        </Tooltip>
      </motion.div>
    </div>
  )
}
