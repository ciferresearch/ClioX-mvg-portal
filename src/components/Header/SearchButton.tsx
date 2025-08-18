import { FormEvent, ReactElement } from 'react'
import SearchIcon from '@images/search.svg'
import { useSearchBarStatus } from '@context/SearchBarStatus'

export default function SearchButton(): ReactElement {
  const { isSearchBarVisible, setSearchBarVisible } = useSearchBarStatus()

  async function handleButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault()

    setSearchBarVisible(!isSearchBarVisible)
  }

  return (
    <div className="relative">
      <button
        onClick={handleButtonClick}
        className={`p-2 rounded-lg transition-colors duration-200 hover:bg-teal-50 ${
          isSearchBarVisible
            ? 'bg-teal-100 text-teal-700'
            : 'text-gray-600 hover:text-teal-700'
        }`}
        aria-label="Search"
      >
        <SearchIcon className="w-5 h-5" />
      </button>
    </div>
  )
}
