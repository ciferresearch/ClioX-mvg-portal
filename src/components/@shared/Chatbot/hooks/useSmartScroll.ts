import { useEffect, useRef, useState } from 'react'

// Keeps chat pinned to bottom unless user scrolls up
export function useSmartScroll(
  triggerCount: number,
  lastMessageContent?: string
) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Auto-scroll on new messages or content updates when user is at bottom
  useEffect(() => {
    if (!shouldAutoScroll) return
    const container = messagesEndRef.current?.parentElement
    if (container) {
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight
      })
    }
  }, [triggerCount, lastMessageContent, shouldAutoScroll])

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
