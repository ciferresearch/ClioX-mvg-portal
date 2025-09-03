import { ReactElement, useCallback, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import Tooltip from './Tooltip'
import { IconCopy, IconRefresh, IconEdit } from '@tabler/icons-react'

export default function MessageActions({
  visible,
  content,
  onCopy,
  onRetry,
  onEdit,
  disabled = false,
  className,
  variant = 'assistant',
  alignment = 'start',
  reserveSpace = false,
  showDivider
}: {
  visible: boolean
  content: string
  onCopy?: (content: string) => void
  onRetry?: () => void
  onEdit?: () => void
  disabled?: boolean
  className?: string
  variant?: 'assistant' | 'user'
  alignment?: 'start' | 'end'
  reserveSpace?: boolean
  showDivider?: boolean
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

  const shouldShowDivider = useMemo(() => {
    if (typeof showDivider === 'boolean') return showDivider
    return variant === 'assistant'
  }, [showDivider, variant])

  // If we don't need to reserve space and not visible, skip rendering entirely
  if (!visible && !reserveSpace) return null

  const rowVisibilityClass = visible ? '' : 'invisible pointer-events-none'
  const rowJustify = alignment === 'end' ? 'justify-end' : ''
  const paddingTopClass = shouldShowDivider ? 'pt-2' : 'pt-0'
  const containerMarginTop = shouldShowDivider ? 'mt-3' : 'mt-0'

  return (
    <div className={`${containerMarginTop} inline-block ${className || ''}`}>
      {shouldShowDivider && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
          className="h-[1px] bg-[#d0d2dd]"
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className={`flex items-center ${paddingTopClass} ${rowJustify} ${rowVisibilityClass} min-h-8`}
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

        {variant === 'assistant' ? (
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
              <IconRefresh
                className="h-5 w-5 text-[#4c5167]"
                strokeWidth={1.75}
              />
            </button>
          </Tooltip>
        ) : (
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
        )}
      </motion.div>
    </div>
  )
}
