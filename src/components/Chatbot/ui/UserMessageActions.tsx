import { ReactElement, useCallback, useState } from 'react'
import { motion } from 'motion/react'
import Tooltip from './Tooltip'
import { IconCopy, IconEdit } from '@tabler/icons-react'

export default function UserMessageActions({
  visible,
  content,
  onCopy,
  onEdit,
  disabled = false,
  className
}: {
  visible: boolean
  content: string
  onCopy?: (content: string) => void
  onEdit?: () => void
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

  // Always reserve space for user actions to avoid layout shift
  const rowVisibilityClass = visible ? '' : 'invisible pointer-events-none'

  return (
    <div className={`mt-0 inline-block ${className || ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className={`flex items-center justify-end pt-0 ${rowVisibilityClass} min-h-8`}
      >
        <Tooltip label={copied ? 'Copied' : 'Copy'} placement="bottom">
          <button
            type="button"
            aria-label="Copy"
            onClick={handleCopy}
            className="inline-flex items-center justify-center rounded-md bg-white hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-8 h-8"
            disabled={disabled}
          >
            <IconCopy className="h-5 w-5 text-[#4c5167]" strokeWidth={1.75} />
          </button>
        </Tooltip>

        <Tooltip label="Edit" placement="bottom">
          <button
            type="button"
            aria-label="Edit"
            onClick={() => onEdit && onEdit()}
            className="inline-flex items-center justify-center rounded-md bg-white hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-8 h-8"
            disabled={disabled || !onEdit}
          >
            <IconEdit className="h-5 w-5 text-[#4c5167]" strokeWidth={1.75} />
          </button>
        </Tooltip>
      </motion.div>
    </div>
  )
}
