import { ReactElement, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IconSettings, IconChevronDown } from '@tabler/icons-react'
import Debug from './Debug'
import ExternalContent from './ExternalContent'
import AutomationWalletMode from './AutomationWalletMode'
import Onboarding from './Onboarding'
import { useMarketMetadata } from '@context/MarketMetadata'

export default function UserPreferences(): ReactElement {
  const { appConfig } = useMarketMetadata()
  const [isHovered, setIsHovered] = useState(false)
  const [isClickedOpen, setIsClickedOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>(
    'left'
  )
  const containerRef = useRef<HTMLDivElement>(null)

  // Combined open state: open if clicked OR hovering
  const isOpen = isClickedOpen || isHovering

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsClickedOpen(false)
      }
    }

    if (isClickedOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isClickedOpen])

  // Handle dropdown positioning
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const windowWidth = window.innerWidth
      const dropdownWidth = 256 // min-w-[16rem] = 256px

      // If there's not enough space on the right, position to the left
      if (rect.right + dropdownWidth > windowWidth - 20) {
        setDropdownPosition('right')
      } else {
        setDropdownPosition('left')
      }
    }
  }, [isOpen])

  // Handle mouse enter/leave for the entire container
  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  // Handle button click
  const handleClick = () => {
    setIsClickedOpen(!isClickedOpen)
  }

  return (
    <div
      className="relative flex-shrink-0"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.button
        className="group relative flex items-center space-x-2 px-3 border rounded-lg transition-all duration-200 cursor-pointer min-w-[4rem] text-sm font-medium h-9"
        style={{
          background: isHovered
            ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          borderColor: isHovered ? '#0ea5e9' : '#f1f5f9',
          boxShadow: isHovered
            ? '0 4px 12px rgba(14, 165, 233, 0.15)'
            : '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icons Container */}
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Cog Icon */}
          <motion.div
            animate={{
              scale: isHovered ? 1.1 : 1,
              rotate: isHovered ? 45 : 0
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <IconSettings
              aria-label="Preferences"
              className="w-4 h-4 transition-colors duration-200"
              stroke={2.5}
              style={{
                color: isHovered ? '#0ea5e9' : '#6b7280'
              }}
            />
          </motion.div>

          {/* Chevron Icon */}
          <motion.div
            animate={{
              rotate: isOpen ? 180 : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <IconChevronDown
              size={14}
              className="transition-colors duration-200"
              stroke={2.5}
              style={{
                color: isHovered ? '#0ea5e9' : '#9ca3af'
              }}
            />
          </motion.div>
        </motion.div>
      </motion.button>

      {/* Custom Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute top-full mt-2 z-50 min-w-[16rem] bg-white border border-gray-100 rounded-xl shadow-2xl ${
              dropdownPosition === 'right' ? 'right-0' : 'left-0'
            }`}
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              transformOrigin:
                dropdownPosition === 'right' ? 'top right' : 'top left'
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <div className="p-4 space-y-4">
                <motion.h3
                  className="font-semibold text-sm text-gray-800 mb-3"
                  style={{
                    background:
                      'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  Preferences
                </motion.h3>

                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <ExternalContent />
                  {appConfig.automationConfig.enableAutomation === 'true' && (
                    <AutomationWalletMode />
                  )}
                  <Onboarding />
                  <Debug />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
