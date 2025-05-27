import { ReactElement } from 'react'
import { useRouter } from 'next/router'
import UseCase from '../components/UseCase'
import content from '../../content/pages/usecases.json'
import Page from '@components/@shared/Page'

export default function PageUseCases(): ReactElement {
  const router = useRouter()

  return (
    <Page
      title={content.title}
      description={content.description}
      uri={router.route}
      noPageHeader
    >
      <UseCase />
    </Page>
  )
}
