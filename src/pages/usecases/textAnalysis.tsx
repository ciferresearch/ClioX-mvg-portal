import { ReactElement, useEffect } from 'react'
import { useRouter } from 'next/router'
import { seedTextAnalysisFromSamples } from '../../dev/seedUseCases'
import Page from '@shared/Page'
import content from '../../../content/pages/textAnalysis.json'
import TextAnalysis from '../../components/TextAnalysis'
import { useUseCases } from '../../@context/UseCases'

export default function TextAnalysisPage(): ReactElement {
  const router = useRouter()
  const { clearTextAnalysis } = useUseCases()

  const { title, description } = content

  // Clear both VizHub localStorage data and IndexedDB data when leaving the page
  useEffect(() => {
    // dev seed
    if (process.env.NEXT_PUBLIC_ENABLE_DEV_SEED === 'true') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('seed') === 'text') {
        seedTextAnalysisFromSamples()
      }
    }

    return () => {
      const shouldClearOnUnmount =
        process.env.NEXT_PUBLIC_CLEAR_ON_UNMOUNT !== 'false'

      if (
        process.env.NEXT_PUBLIC_ENABLE_DEV_SEED !== 'true' &&
        shouldClearOnUnmount
      ) {
        // Clear IndexedDB dataset for this use case
        clearTextAnalysis()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={title} description={description} uri={router.route}>
      <TextAnalysis />
    </Page>
  )
}
