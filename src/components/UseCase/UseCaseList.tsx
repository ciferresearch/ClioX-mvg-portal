import { ReactElement } from 'react'
import UseCaseCard from './UseCaseCard'
import { UseCase } from './types'

const useCases: UseCase[] = [
  {
    id: '1',
    title: 'ClioX Visualization Tool',
    description:
      'An interactive data visualization platform that enables cultural heritage institutions to explore, analyze, and present their digital collections through dynamic charts, graphs, and visual representations.',
    category: 'Data Visualization',
    organization: 'ClioX Platform',
    benefits: [
      'Interactive data exploration and analysis',
      'Multiple visualization types and formats',
      'Real-time data insights and patterns',
      'Export capabilities for presentations'
    ],
    link: 'https://vizhub.cliox.org'
  }
]

const comingSoonCard = {
  id: 'coming-soon',
  title: 'More Use Cases Coming Soon',
  description:
    'We are working on exciting new features and use cases for cultural heritage institutions. Stay tuned!',
  category: 'Coming Soon',
  organization: 'ClioX Team',
  benefits: [],
  isComingSoon: true
}

export default function UseCaseList(): ReactElement {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 lg:gap-8">
        {useCases.map((useCase) => (
          <UseCaseCard key={useCase.id} useCase={useCase} />
        ))}
        <UseCaseCard key={comingSoonCard.id} useCase={comingSoonCard} />
      </div>
    </div>
  )
}
