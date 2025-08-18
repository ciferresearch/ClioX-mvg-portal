import { ReactElement, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Account from './Account'
import Details from './Details'
import { useAccount } from 'wagmi'

export default function Wallet(): ReactElement {
  const { address: accountId } = useAccount()
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
    if (accountId) {
      setIsHovering(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const handleClick = () => {
    if (accountId) {
      setIsClickedOpen(!isClickedOpen)
    }
  }

  return (
    <div
      className="relative flex-shrink-0"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Account onClick={handleClick} />

      <AnimatePresence>
        {isOpen && accountId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 z-50"
            style={{
              transformOrigin: 'top right'
            }}
          >
            <Details />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
