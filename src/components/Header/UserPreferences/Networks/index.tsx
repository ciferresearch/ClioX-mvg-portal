import { ReactElement, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IconWorld, IconChevronDown } from '@tabler/icons-react'
import Label from '@shared/FormInput/Label'
import FormHelp from '@shared/FormInput/Help'
import NetworksList from './NetworksList'
import useNetworkMetadata, {
  filterNetworksByType
} from '@hooks/useNetworkMetadata'
import { useUserPreferences } from '@context/UserPreferences'
import { useMarketMetadata } from '@context/MarketMetadata'

export default function Networks(): ReactElement {
  const { appConfig } = useMarketMetadata()
  const { networksList } = useNetworkMetadata()
  const { chainIds } = useUserPreferences()
  const [isHovered, setIsHovered] = useState(false)
  const [isClickedOpen, setIsClickedOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>(
    'left'
  )
  const containerRef = useRef<HTMLDivElement>(null)

  const networksMain = filterNetworksByType(
    'mainnet',
    appConfig.chainIdsSupported,
    networksList
  )

  const networksTest = filterNetworksByType(
    'testnet',
    appConfig.chainIdsSupported,
    networksList
  )

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
      <div className="relative">
        <motion.button
          className="group relative flex items-center space-x-2 px-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer min-w-[4rem] text-sm font-medium h-9"
          style={{
            background: isHovered
              ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            borderColor: isHovered ? '#e2e8f0' : '#f1f5f9',
            boxShadow: isHovered
              ? '0 4px 12px rgba(0, 0, 0, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
        >
          {/* Icons Container with Hover Scale */}
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Globe Icon */}
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <IconWorld
                className="w-4 h-4 text-gray-600 group-hover:text-emerald-600 transition-colors duration-200"
                stroke={2}
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
                className="text-gray-400 group-hover:text-emerald-500 transition-colors duration-200"
                stroke={2.5}
              />
            </motion.div>
          </motion.div>
        </motion.button>

        {/* Active Networks Indicators - Outside button to avoid whileTap effect */}
        {chainIds.length > 0 && (
          <motion.div
            className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-1 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {chainIds.slice(0, 3).map((chainId, index) => (
                <motion.div
                  key={chainId}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.2,
                    type: 'spring',
                    stiffness: 500
                  }}
                  className="w-1 h-1 rounded-full"
                  style={{
                    background: isHovered
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : '#10b981'
                  }}
                />
              ))}
              {chainIds.length > 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-emerald-600 font-bold"
                >
                  +{chainIds.length - 3}
                </motion.div>
              )}
            </AnimatePresence>
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
            className={`absolute top-full mt-2 z-50 p-4 min-w-[16rem] bg-white border border-gray-100 rounded-xl shadow-2xl ${
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
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.2 }}
              >
                <Label htmlFor="chains">Networks</Label>
                <FormHelp>Switch the data source for the interface.</FormHelp>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="space-y-2"
              >
                <NetworksList title="Main" networks={networksMain} />
                <NetworksList title="Test" networks={networksTest} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
