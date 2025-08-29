import { useEffect, useRef, useState } from 'react'

// Keeps chat pinned to bottom unless user scrolls up
export function useSmartScroll(triggerCount: number) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Only auto-scroll on new messages when the user is at the bottom
  useEffect(() => {
    if (!shouldAutoScroll) return
    const container = messagesEndRef.current?.parentElement
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [triggerCount, shouldAutoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10
    setShouldAutoScroll(isAtBottom)
  }

  const scrollToBottom = () => {
    setShouldAutoScroll(true)
    const container = messagesEndRef.current?.parentElement
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }

  return { messagesEndRef, shouldAutoScroll, handleScroll, scrollToBottom }
}

export default useSmartScroll
