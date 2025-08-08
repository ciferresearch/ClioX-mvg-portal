import { ReactElement, useEffect } from 'react'
import { useRouter } from 'next/router'
import { seedCameroonGazetteFromSamples } from '../../dev/seedUseCases'
import Page from '@shared/Page'
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
    // dev seed
    if (process.env.NEXT_PUBLIC_ENABLE_DEV_SEED === 'true') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('seed') === 'cameroon') {
        seedCameroonGazetteFromSamples()
      }
    }

    return () => {
      // Clear VizHub localStorage data + IndexedDB only when not in dev seed mode
      if (process.env.NEXT_PUBLIC_ENABLE_DEV_SEED !== 'true') {
        clearAllData()
        clearCameroonGazette()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={title} description={description} uri={router.route}>
      <CameroonGazette />
    </Page>
  )
}
