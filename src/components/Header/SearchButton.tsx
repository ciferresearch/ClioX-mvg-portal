import { FormEvent, ReactElement } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { useSearchBarStatus } from '@context/SearchBarStatus'
import { useRouter } from 'next/router'

export default function SearchButton(): ReactElement {
  const router = useRouter()
  const { isSearchBarVisible, setSearchBarVisible } = useSearchBarStatus()

  // Check if we're on a search page
  const isSearchPage = router.pathname.startsWith('/search')

  async function handleButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault()

    if (isSearchPage) {
      // Focus on the existing search bar in the search page
      const searchPageInput = document.querySelector(
        '.search-page-input'
      ) as HTMLInputElement

      if (searchPageInput) {
        searchPageInput.focus()
        // Also scroll the input into view if needed
        searchPageInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        // Fallback to the first visible search input
        const searchInputs = document.querySelectorAll('input[name="search"]')
        for (const input of searchInputs) {
          const rect = input.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            const targetInput = input as HTMLInputElement
            targetInput.focus()
            targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
            break
          }
        }
      }
      return
    }

    setSearchBarVisible(!isSearchBarVisible)
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={handleButtonClick}
        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200 ${
          isSearchPage
            ? 'text-gray-600 hover:text-teal-700 hover:bg-teal-50 cursor-pointer'
            : isSearchBarVisible
            ? 'bg-teal-100 text-teal-700 hover:bg-teal-50 cursor-pointer'
            : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50 cursor-pointer'
        }`}
        aria-label={isSearchPage ? 'Focus search bar' : 'Search'}
      >
        <IconSearch size={14} stroke={2.5} />
      </button>
    </div>
  )
}
