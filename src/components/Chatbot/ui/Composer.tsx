import { ReactElement, useState } from 'react'
import { motion } from 'motion/react'
import { IconSettings, IconSend } from '@tabler/icons-react'

interface InputContainerProps {
  inputMessage: string
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  disabled: boolean
  placeholder: string
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function InputContainer({
  inputMessage,
  onInputChange,
  onKeyDown,
  onSubmit,
  disabled,
  placeholder,
  isHovered,
  onMouseEnter,
  onMouseLeave
}: InputContainerProps): ReactElement {
  return (
    <div className="bg-[#F8F7F5] rounded-2xl shadow-lg p-3 space-y-4">
      <form onSubmit={onSubmit} className="mb-3">
        <textarea
          value={inputMessage}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full min-h-20 max-h-96 px-4 py-2 bg-white border-0 rounded-xl focus:outline-none resize-none overflow-y-auto transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          style={{
            height: '60px',
            minHeight: '60px',
            maxHeight: '288px'
          }}
        />
      </form>

      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button
            type="button"
            className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <IconSettings className="h-4 w-4 text-gray-700" />
          </button>
        </div>

        <motion.button
          type="submit"
          disabled={disabled || !inputMessage.trim()}
          className="w-8 h-8 text-white rounded-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={
            {
              backgroundColor: isHovered && !disabled ? '#b56a3e' : '#c8794d',
              '--tw-ring-color': '#c8794d'
            } as React.CSSProperties
          }
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          aria-label="Send message"
        >
          <IconSend className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  )
}

export default function Composer({
  onSendMessage,
  disabled,
  variant = 'default'
}: {
  onSendMessage: (message: string) => void
  disabled: boolean
  variant?: 'default' | 'hero'
}): ReactElement {
  const [inputMessage, setInputMessage] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    const { scrollHeight } = textarea
    const lineHeight = 24
    const minHeight = lineHeight * 2
    const maxHeight = lineHeight * 12

    if (scrollHeight <= maxHeight) {
      textarea.style.height = Math.max(scrollHeight, minHeight) + 'px'
    } else {
      textarea.style.height = maxHeight + 'px'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() && !disabled) {
      onSendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  const onKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputMessage.trim() && !disabled) {
        onSendMessage(inputMessage.trim())
        setInputMessage('')
      }
    }
  }

  if (variant === 'hero') {
    return (
      <motion.div
        className="px-6 py-8 w-[820px]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="w-full">
          <InputContainer
            inputMessage={inputMessage}
            onInputChange={handleInputChange}
            onKeyDown={onKeyDown}
            onSubmit={handleSubmit}
            disabled={disabled}
            placeholder={
              disabled
                ? 'Assistant is thinking...'
                : 'How can I help you today?'
            }
            isHovered={isHovered}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="relative bg-white"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <InputContainer
        inputMessage={inputMessage}
        onInputChange={handleInputChange}
        onKeyDown={onKeyDown}
        onSubmit={handleSubmit}
        disabled={disabled}
        placeholder={
          disabled ? 'Assistant is thinking...' : 'Ask me anything...'
        }
        isHovered={isHovered}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </motion.div>
  )
}
