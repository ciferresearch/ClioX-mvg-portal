import { ReactElement, useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IconChevronDown, IconArrowsDiff, IconLock } from '@tabler/icons-react'
import { useAutomation } from '../../../../@context/Automation/AutomationProvider'
import Details from './Details'

export default function Automation(): ReactElement {
  const { autoWallet, isAutomationEnabled, hasValidEncryptedWallet, balance } =
    useAutomation()

  const [hasZeroNetworkTokenBalance, setHasZeroNetworkTokenBalance] =
    useState<boolean>(false)
  const [hasZeroERC20TokenBalances, setHasZeroERC20TokenBalances] =
    useState<boolean>(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isClickedOpen, setIsClickedOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>(
    'left'
  )
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    balance.approved &&
      setHasZeroERC20TokenBalances(
        Object.keys(balance.approved)?.filter(
          (token) => Number(balance.approved[token]) <= 0
        ).length > 0
      )
    setHasZeroNetworkTokenBalance(Number(balance.native.balance) <= 0)
  }, [balance])

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

  // Handle dropdown positioning and visibility
  useEffect(() => {
    if ((isHovering || isClickedOpen) && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const windowWidth = window.innerWidth
      const dropdownWidth = 320 // min-w-[20rem] = 320px

      // If there's not enough space on the right, position to the left
      if (rect.right + dropdownWidth > windowWidth - 20) {
        setDropdownPosition('right')
      } else {
        setDropdownPosition('left')
      }
    }
  }, [isHovering, isClickedOpen])

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

  // Get indicator color based on status
  const getIndicatorColor = () => {
    if (hasZeroNetworkTokenBalance) return 'bg-red-500'
    if (hasZeroERC20TokenBalances) return 'bg-yellow-500'
    return 'bg-emerald-500'
  }

  const getIndicatorShadowColor = () => {
    if (hasZeroNetworkTokenBalance) return 'rgba(239, 68, 68, 0.4)'
    if (hasZeroERC20TokenBalances) return 'rgba(245, 158, 11, 0.4)'
    return 'rgba(16, 185, 129, 0.4)'
  }

  return (
    <div
      className="relative flex-shrink-0"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        <motion.button
          className="group relative flex items-center space-x-2 px-3 border rounded-lg transition-all duration-200 cursor-pointer min-w-[4rem] text-sm font-medium h-9"
          style={{
            background: isAutomationEnabled
              ? isHovered
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #16a085 0%, #0d7c66 100%)'
              : isHovered
              ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            borderColor: isAutomationEnabled
              ? isHovered
                ? '#059669'
                : '#10b981'
              : isHovered
              ? '#e2e8f0'
              : '#f1f5f9',
            boxShadow: isHovered
              ? isAutomationEnabled
                ? '0 8px 25px -8px rgba(16, 185, 129, 0.4)'
                : '0 4px 12px rgba(0, 0, 0, 0.1)'
              : isAutomationEnabled
              ? '0 4px 12px rgba(16, 185, 129, 0.2)'
              : '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
        >
          {/* Lock Icon (when encrypted wallet exists but not unlocked) */}
          {!autoWallet && hasValidEncryptedWallet && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                border: '1px solid #e2e8f0'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <IconLock
                className="w-2 h-2"
                stroke={2.5}
                style={{
                  color: isAutomationEnabled ? '#ffffff' : '#6b7280'
                }}
              />
            </motion.div>
          )}

          {/* Icons Container */}
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Transaction Icon */}
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <IconArrowsDiff
                className="w-4 h-4 transition-colors duration-200"
                stroke={2.5}
                style={{
                  color: isAutomationEnabled
                    ? '#ffffff'
                    : isHovered
                    ? '#059669'
                    : '#6b7280'
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
                  color: isAutomationEnabled
                    ? '#ffffff'
                    : isHovered
                    ? '#059669'
                    : '#9ca3af'
                }}
              />
            </motion.div>
          </motion.div>
        </motion.button>

        {/* Status Indicator (when autoWallet exists) */}
        {autoWallet && (
          <motion.div
            className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-white pointer-events-none ${getIndicatorColor()}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {/* Pulsing animation for enabled status (except error state) */}
            {isAutomationEnabled && !hasZeroNetworkTokenBalance && (
              <motion.div
                className={`absolute inset-0 rounded-full ${getIndicatorColor()}`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{
                  boxShadow: `0 0 10px ${getIndicatorShadowColor()}`
                }}
              />
            )}
          </motion.div>
        )}
      </div>

      {/* Custom Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute top-full mt-2 z-50 min-w-[20rem] bg-white border border-gray-100 rounded-xl shadow-2xl ${
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
              <Details isFunded={!hasZeroNetworkTokenBalance} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
