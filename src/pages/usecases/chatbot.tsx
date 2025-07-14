import { ReactElement, useEffect } from 'react'
import Page from '@shared/Page'
import { useRouter } from 'next/router'
import content from '../../../content/pages/chatbot.json'
import Chatbot from '../../components/Chatbot'
import { useDataStore } from '../../components/@shared/VizHub/store/dataStore'
import { useUseCases } from '../../@context/UseCases'

export default function PageChatbot(): ReactElement {
  const router = useRouter()
  const { clearAllData } = useDataStore()
  // TODO: Add clearChatbot when database integration is ready
  const { clearTextAnalysis } = useUseCases()

  const { title, description } = content

  // Clear both VizHub localStorage data and IndexedDB data when leaving the page
  useEffect(() => {
    return () => {
      // Clear VizHub localStorage data
      clearAllData()
      // TODO: Clear IndexedDB Chatbot data when ready
      // clearChatbot()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={title} description={description} uri={router.route}>
      <Chatbot />
    </Page>
  )
}
