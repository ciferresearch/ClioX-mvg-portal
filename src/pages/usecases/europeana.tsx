import { ReactElement } from 'react'
import { useRouter } from 'next/router'
import Page from '@shared/Page'
import Europeana from '@components/Europeana'
import content from '../../../content/pages/europeana.json'

export default function EuropeanaPage(): ReactElement {
  const { route } = useRouter()
  return (
    <Page
      title={content.title}
      description={content.description}
      uri={route}
      noPageHeader
      wideContainer
    >
      <Europeana />
    </Page>
  )
}
