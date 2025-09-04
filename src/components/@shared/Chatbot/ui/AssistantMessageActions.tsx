import { ReactElement } from 'react'
import { motion } from 'motion/react'
import Tooltip from './Tooltip'
import { IconCopy, IconRefresh } from '@tabler/icons-react'

export default function AssistantMessageActions({
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
  if (!visible) return null

  return (
    <div className={`mt-3 w-full ${className || ''}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
        className="h-[1px] bg-[#d0d2dd]"
      />
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className={`flex items-center pt-2`}
      >
        <Tooltip label={'Copy'} placement="bottom">
          <button
            type="button"
            aria-label="Copy"
            onClick={async () =>
              onCopy
                ? await onCopy(content)
                : await navigator.clipboard.writeText(content)
            }
            className="inline-flex items-center justify-center rounded-md bg-white hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-8 h-8"
            disabled={disabled}
          >
            <IconCopy className="h-5 w-5 text-[#4c5167]" strokeWidth={1.75} />
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
            <IconRefresh
              className="h-5 w-5 text-[#4c5167]"
              strokeWidth={1.75}
            />
          </button>
        </Tooltip>
      </motion.div>
    </div>
  )
}
