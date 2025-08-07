import { ReactElement, useEffect } from 'react'
import Page from '@shared/Page'
import { useRouter } from 'next/router'
import content from '../../../content/pages/cameroonGazette.json'
import CameroonGazette from '../../components/CameroonGazette'
import { useDataStore } from '../../components/@shared/VizHub/store/dataStore'
import { useUseCases } from '../../@context/UseCases'

export default function CameroonGazettePage(): ReactElement {
  const router = useRouter()
  const { clearAllData } = useDataStore()
  const { clearCameroonGazette } = useUseCases()

  const { title, description } = content

  // Clear both VizHub localStorage data and IndexedDB data when leaving the page
  useEffect(() => {
    return () => {
      // Clear VizHub localStorage data
      clearAllData()
      // Clear IndexedDB Cameroon Gazette data
      clearCameroonGazette()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={title} description={description} uri={router.route}>
      <CameroonGazette />
    </Page>
  )
}
