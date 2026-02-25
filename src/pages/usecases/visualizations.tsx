import { ReactElement, useEffect } from 'react'
import Page from '@shared/Page'
import { useRouter } from 'next/router'
import content from '../../../content/pages/visualizations.json'
import VisualizationsUnified from '../../components/VisualizationsUnified'
import { useUseCases } from '../../@context/UseCases'

export default function VisualizationsUnifiedPage(): ReactElement {
  const router = useRouter()
  const { clearTextAnalysis, clearCameroonGazette } = useUseCases()

  const { title, description } = content

  useEffect(() => {
    return () => {
      const shouldClearOnUnmount =
        process.env.NEXT_PUBLIC_CLEAR_ON_UNMOUNT !== 'false'
      if (shouldClearOnUnmount) {
        clearTextAnalysis()
        clearCameroonGazette()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page
      title={title}
      description={description}
      uri={router.route}
      wideContainer
    >
      <VisualizationsUnified />
    </Page>
  )
}
