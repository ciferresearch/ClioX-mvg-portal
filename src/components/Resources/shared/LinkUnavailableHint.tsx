'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface LinkUnavailableHintProps {
  children: React.ReactNode
  className?: string
}

export function LinkUnavailableHint({
  children,
  className = ''
}: LinkUnavailableHintProps) {
  const [showHint, setShowHint] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (isHovered) {
      setShowHint(true)
      const timer = setTimeout(() => {
        setShowHint(false)
      }, 1000) // 1秒后消失

      return () => clearTimeout(timer)
    } else {
      setShowHint(false)
    }
  }, [isHovered])

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative cursor-default ${className}`}
    >
      {children}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 bottom-full mb-1 z-50 whitespace-nowrap rounded-lg bg-transparent backdrop-blur-lg px-3 py-1.5 text-sm text-gray-700 shadow-lg"
          >
            Link coming soon
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
