'use client'

import React, { useState, useEffect } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring
} from 'motion/react'

interface AnimatedTooltipProps {
  children: React.ReactNode
  content?: string
  className?: string
}

export function AnimatedTooltip({
  children,
  content = 'Link unavailable',
  className = ''
}: AnimatedTooltipProps) {
  const [isHovered, setIsHovered] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { stiffness: 500, damping: 100 }
  const cursorX = useSpring(mouseX, springConfig)
  const cursorY = useSpring(mouseY, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered) return
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    if (isHovered) {
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isHovered, mouseX, mouseY])

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative ${className}`}
      >
        {children}
      </div>
      <AnimatePresence>
        {isHovered && (
          <>
            {/* Following Pointer - 跟随鼠标的光标点 */}
            <motion.div
              style={{
                left: cursorX,
                top: cursorY,
                x: '-50%',
                y: '-50%'
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none fixed z-[9999] h-4 w-4 rounded-full bg-black"
            />
            {/* Tooltip 文本 */}
            <motion.div
              style={{
                left: cursorX,
                top: cursorY,
                x: '-50%',
                y: '-100%',
                translateY: '0px'
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none fixed z-[9999] whitespace-nowrap rounded-lg bg-black px-4 py-2 text-sm text-white shadow-2xl"
            >
              {content}
              <div className="absolute left-1/2 top-full -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
