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

  // Clear both VizHub localStorage data and IndexedDB data when leaving the page
  useEffect(() => {
    const shouldClearOnEnd =
      process.env.NEXT_PUBLIC_CLEAR_ON_UNMOUNT !== 'false'

    if (!shouldClearOnEnd) return

    const endSession = () => {
      try {
        clearChatbot()
        chatbotApi.clearSession()
      } catch (_) {
        // noop
      }
    }

    // Fire on browser/tab close or full unload
    window.addEventListener('beforeunload', endSession)
    // Mobile Safari fallback
    window.addEventListener('pagehide', endSession)

    return () => {
      window.removeEventListener('beforeunload', endSession)
      window.removeEventListener('pagehide', endSession)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={title} description={description} uri={router.route}>
      <Chatbot />
    </Page>
  )
}
