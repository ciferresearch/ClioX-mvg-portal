import { ReactElement, useEffect } from 'react'
import Page from '@shared/Page'
import { useRouter } from 'next/router'
import content from '../../../content/pages/chatbot.json'
import Chatbot from '../../components/Chatbot'

export default function PageChatbot(): ReactElement {
  const router = useRouter()

  const { title, description } = content

  // Clear both VizHub localStorage data and IndexedDB data when leaving the page
  useEffect(() => {
    return () => {
      const shouldClearOnUnmount =
        process.env.NEXT_PUBLIC_CLEAR_ON_UNMOUNT !== 'false'

      if (shouldClearOnUnmount) {
        // No persisted chatbot storage to clear yet.
        // If Chatbot adds IndexedDB or other persistence, clear it here.
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={title} description={description} uri={router.route}>
      <Chatbot />
    </Page>
  )
}
