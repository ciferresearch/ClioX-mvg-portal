import { ReactElement } from 'react'
import { IconBulb } from '@tabler/icons-react'

export default function IdeasToggle({
  onClick,
  'aria-label': ariaLabel = 'Show ideas'
}: {
  onClick: () => void
  'aria-label'?: string
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
      aria-label={ariaLabel}
      title="Ideas"
      data-idea-toggle
    >
      <IconBulb className="h-4 w-4 text-gray-700" />
    </button>
  )
}
