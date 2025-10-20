import { ReactElement, useEffect } from 'react'
import Page from '@shared/Page'
import { useRouter } from 'next/router'
import content from '../../../content/pages/chatbot.json'
import ChatbotInteparesGeneral from '../../components/ChatbotInteparesGeneral'
import { useUseCases } from '../../@context/UseCases'
import { chatbotApi } from '../../@utils/chatbot'

export default function PageChatbotInteparesGeneral(): ReactElement {
  const router = useRouter()
  const { clearChatbot } = useUseCases()

  const { title, description } = content

  // Clear IndexedDB data when leaving the page
  useEffect(() => {
    return () => {
      const shouldClearOnUnmount =
        process.env.NEXT_PUBLIC_CLEAR_ON_UNMOUNT !== 'false'

      if (shouldClearOnUnmount) {
        clearChatbot()
        chatbotApi.clearSession()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={title} description={description} uri={router.route}>
      <ChatbotInteparesGeneral />
    </Page>
  )
}
