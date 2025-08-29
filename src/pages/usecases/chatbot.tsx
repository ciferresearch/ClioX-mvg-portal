import { ReactElement, useEffect } from 'react'
import Page from '@shared/Page'
import { useRouter } from 'next/router'
import content from '../../../content/pages/chatbot.json'
import Chatbot from '../../components/Chatbot'
import { useUseCases } from '../../@context/UseCases'
import { chatbotApi } from '../../@utils/chatbot'

export default function PageChatbot(): ReactElement {
  const router = useRouter()
  const { clearChatbot } = useUseCases()

  const { title, description } = content

  // Only clear data when browser/tab is actually closed (not on refresh or navigation)
  useEffect(() => {
    const shouldClearOnEnd =
      process.env.NEXT_PUBLIC_CLEAR_ON_UNMOUNT !== 'false'

    if (!shouldClearOnEnd) return

    let isPageHidden = false

    const handleVisibilityChange = () => {
      isPageHidden = document.hidden
    }

    const endSession = () => {
      try {
        // Use a short delay to check if page comes back (refresh case)
        setTimeout(() => {
          // If document is still hidden after 100ms, it's likely a real close
          if (document.hidden || isPageHidden) {
            clearChatbot()
            chatbotApi.clearSession()
          }
        }, 100)
      } catch (_) {
        // noop
      }
    }

    // Track page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Only clear on real browser/tab close
    window.addEventListener('pagehide', endSession)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', endSession)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={title} description={description} uri={router.route}>
      <Chatbot />
    </Page>
  )
}
