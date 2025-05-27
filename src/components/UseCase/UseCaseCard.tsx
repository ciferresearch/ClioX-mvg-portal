import { ReactElement } from 'react'
import { UseCase } from './types'

interface UseCaseCardProps {
  useCase: UseCase
}

export default function UseCaseCard({
  useCase
}: UseCaseCardProps): ReactElement {
  const cardContent = (
    <div
      className={`bg-background-content border border-border-color rounded-default p-6 shadow-box hover:shadow-box-hover transition-all duration-200 hover:-translate-y-1 h-full flex flex-col font-base ${
        useCase.isComingSoon ? 'opacity-75' : ''
      } ${useCase.link && !useCase.isComingSoon ? 'cursor-pointer' : ''}`}
    >
      <div className="mb-4">
        <div
          className={`inline-block px-3 py-1 rounded-default text-small font-bold uppercase tracking-wide mb-3 ${
            useCase.isComingSoon
              ? 'bg-brand-grey text-brand-white'
              : 'bg-primary text-brand-white'
          }`}
        >
          {useCase.category}
        </div>
        <h3 className="text-h3 font-bold text-font-color-heading mb-2 leading-tight font-heading">
          {useCase.title}
        </h3>
        <p className="text-font-color-light italic text-small">
          {useCase.organization}
        </p>
      </div>

      <div className="flex-1 flex flex-col">
        <p className="text-font-color-text leading-relaxed mb-4 flex-1 text-base">
          {useCase.description}
        </p>

        {useCase.benefits.length > 0 && (
          <div className="mt-auto">
            <h4 className="text-base font-bold text-font-color-heading mb-2 font-heading">
              {useCase.isComingSoon ? 'Planned Features:' : 'Key Benefits:'}
            </h4>
            <ul className="space-y-2">
              {useCase.benefits.map((benefit, index) => (
                <li
                  key={index}
                  className="flex items-start text-small text-font-color-text"
                >
                  <span
                    className={`font-bold mr-3 mt-0.5 ${
                      useCase.isComingSoon
                        ? 'text-brand-grey'
                        : 'text-brand-alert-green'
                    }`}
                  >
                    {useCase.isComingSoon ? '•' : '✓'}
                  </span>
                  <span className="leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {useCase.link && !useCase.isComingSoon && (
        <div className="mt-6 pt-4 border-t border-border-color">
          <span className="text-highlight hover:text-primary font-bold text-small transition-colors duration-200 hover:underline">
            Visit ClioX Visualization Tool →
          </span>
        </div>
      )}

      {useCase.isComingSoon && (
        <div className="mt-6 pt-4 border-t border-border-color">
          <span className="text-brand-grey font-bold text-small">
            Stay tuned for updates
          </span>
        </div>
      )}
    </div>
  )

  // Make the entire card clickable for non-coming-soon cards with links
  if (useCase.link && !useCase.isComingSoon) {
    return (
      <a
        href={useCase.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
      >
        {cardContent}
      </a>
    )
  }

  return cardContent
}
