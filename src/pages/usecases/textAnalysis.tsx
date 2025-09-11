import { ReactElement, useEffect } from 'react'
import { useRouter } from 'next/router'
import Page from '@shared/Page'
import content from '../../../content/pages/textAnalysis.json'
import TextAnalysis from '../../components/TextAnalysis'
import { useUseCases } from '../../@context/UseCases'

export default function TextAnalysisPage(): ReactElement {
  const router = useRouter()
  const { clearTextAnalysis } = useUseCases()

  const { title, description } = content

  // Clear IndexedDB data when leaving the page
  useEffect(() => {
    return () => {
      const shouldClearOnUnmount =
        process.env.NEXT_PUBLIC_CLEAR_ON_UNMOUNT !== 'false'

      if (shouldClearOnUnmount) {
        clearTextAnalysis()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={title} description={description} uri={router.pathname}>
      <TextAnalysis />
    </Page>
  )
}
