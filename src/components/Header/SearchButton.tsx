import { FormEvent, ReactElement } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { useSearchBarStatus } from '@context/SearchBarStatus'

export default function SearchButton(): ReactElement {
  const { isSearchBarVisible, setSearchBarVisible } = useSearchBarStatus()

  async function handleButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault()

    setSearchBarVisible(!isSearchBarVisible)
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={handleButtonClick}
        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200 hover:bg-teal-50 cursor-pointer ${
          isSearchBarVisible
            ? 'bg-teal-100 text-teal-700'
            : 'text-gray-600 hover:text-teal-700'
        }`}
        aria-label="Search"
      >
        <IconSearch size={14} stroke={2.5} />
      </button>
    </div>
  )
}
