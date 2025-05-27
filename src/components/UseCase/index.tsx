import { ReactElement } from 'react'
import UseCaseList from './UseCaseList'
import content from '../../../content/pages/usecases.json'

export default function UseCase(): ReactElement {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-h1 font-bold text-font-color-heading mb-4 font-heading">
          {content.title}
        </h1>
        <p className="text-large text-font-color-text max-w-2xl mx-auto leading-relaxed font-base">
          {content.subtitle}
        </p>
      </div>
      <UseCaseList />
    </div>
  )
}
