import { markdownToHtml } from '@utils/markdown'
import { ReactElement } from 'react'

export default function Empty({ message }: { message?: string }): ReactElement {
  return (
    <div
      className="text-center py-8 text-gray-600 text-sm italic"
      dangerouslySetInnerHTML={{
        __html: markdownToHtml(message) || 'No results found'
      }}
    />
  )
}
