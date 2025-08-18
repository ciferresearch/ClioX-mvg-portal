import { ReactElement, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Network from './Network'
import Details from './Details'
import { useNetwork } from 'wagmi'

export default function NetworkMenu(): ReactElement {
  const { chain } = useNetwork()
  const [isOpen, setIsOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isClickedOpen, setIsClickedOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsClickedOpen(false)
        if (!isHovering) {
          setIsOpen(false)
        }
      }
    }

    if (isClickedOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isClickedOpen, isHovering])

  useEffect(() => {
    setIsOpen(isHovering || isClickedOpen)
  }, [isHovering, isClickedOpen])

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const handleClick = () => {
    setIsClickedOpen(!isClickedOpen)
  }

  return chain?.id ? (
    <div
      className="relative flex-shrink-0"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Network onClick={handleClick} />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 z-50"
            style={{
              transformOrigin: 'top left'
            }}
          >
            <Details />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ) : null
}
