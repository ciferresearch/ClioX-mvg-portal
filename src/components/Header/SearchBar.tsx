import {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  ReactElement,
  useRef
} from 'react'
import { IconSearch, IconX } from '@tabler/icons-react'
import { addExistingParamsToUrl } from '../Search/utils'
import { useRouter } from 'next/router'
import { motion } from 'motion/react'
import { useSearchBarStatus } from '@context/SearchBarStatus'

async function emptySearch() {
  const searchParams = new URLSearchParams(window?.location.href)
  const text = searchParams.get('text')

  if (text !== '' && text !== null && text !== undefined) {
    await addExistingParamsToUrl(location, ['text', 'owner', 'tags'])
  }
}

export default function SearchBar({
  placeholder,
  initialValue,
  isSearchPage,
  isSearching
}: {
  placeholder?: string
  initialValue?: string
  isSearchPage?: boolean
  isSearching?: boolean
}): ReactElement {
  const router = useRouter()
  const [value, setValue] = useState(initialValue || '')
  const parsed = router.query
  const searchBarRef = useRef<HTMLInputElement>(null)
  const {
    isSearchBarVisible,
    setSearchBarVisible,
    homeSearchBarFocus,
    setHomeSearchBarFocus
  } = useSearchBarStatus()

  useEffect(() => {
    if (parsed?.text || parsed?.owner)
      setValue((parsed?.text || parsed?.owner) as string)
  }, [parsed?.text, parsed?.owner])

  useEffect(() => {
    // Always default to hiding the search bar
    setSearchBarVisible(false)
    setHomeSearchBarFocus(false)
  }, [setSearchBarVisible, setHomeSearchBarFocus, router.pathname])

  useEffect(() => {
    if (!isSearchBarVisible && !homeSearchBarFocus) return
    if (searchBarRef?.current) {
      searchBarRef.current.focus()
    }
  }, [isSearchBarVisible, homeSearchBarFocus])

  // Handle click outside to close search bar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Get the search bar container element (the form wrapper)
      const searchBarContainer = searchBarRef.current?.closest('form')

      if (
        searchBarContainer &&
        !searchBarContainer.contains(event.target as Node)
      ) {
        // Only close search bar on click outside if we're on the home page
        const isHomePage = router.pathname === '/'

        if (isHomePage && isSearchBarVisible) {
          setSearchBarVisible(false)
        }
        if (isHomePage && homeSearchBarFocus) {
          setHomeSearchBarFocus(false)
        }
      }
    }

    // Only add event listener if we're on the home page
    const isHomePage = router.pathname === '/'
    if (isHomePage && (isSearchBarVisible || homeSearchBarFocus)) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [
    isSearchBarVisible,
    homeSearchBarFocus,
    setSearchBarVisible,
    setHomeSearchBarFocus,
    router.pathname
  ])

  async function startSearch(
    e: FormEvent<HTMLButtonElement | HTMLInputElement | HTMLFormElement>
  ) {
    e.preventDefault()

    if (value === '') setValue(' ')

    const urlEncodedValue = encodeURIComponent(value)
    const url = await addExistingParamsToUrl(location, [
      'text',
      'owner',
      'tags'
    ])
    router.push(`${url}&text=${urlEncodedValue}`)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    e.target.value === '' && emptySearch()
  }

  async function handleKeyPress(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      await startSearch(e)
    }
  }

  async function handleButtonClick(e: FormEvent<HTMLButtonElement>) {
    e.preventDefault()
    await startSearch(e)
  }

  function handleClear() {
    setValue('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isSearchPage || isSearchBarVisible ? 1 : 0,
        y: isSearchPage || isSearchBarVisible ? 0 : -20
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }}
      className={`mb-3 ${
        isSearchPage || isSearchBarVisible
          ? 'pointer-events-auto'
          : 'pointer-events-none'
      }`}
    >
      <form
        className="relative"
        autoComplete={!value ? 'off' : 'on'}
        onSubmit={startSearch}
      >
        <div className="relative flex items-center bg-white border border-gray-200 rounded-lg shadow-xs transition-all duration-200">
          {/* Search icon on the left - clickable submit button */}
          <button
            type="submit"
            className="absolute left-3 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-teal-600 rounded transition-colors duration-200 cursor-pointer"
            disabled={isSearching}
          >
            <IconSearch size={16} stroke={2} />
          </button>
          <input
            ref={searchBarRef}
            type="text"
            name="search"
            placeholder={placeholder || 'Search for service offerings...'}
            value={value}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            className={`w-full pl-10 pr-12 py-3 text-sm bg-transparent border-0 rounded-lg focus:outline-none placeholder-gray-400 ${
              isSearchPage ? 'search-page-input' : ''
            }`}
          />
          {/* Clear button */}
          {value && (
            <motion.button
              type="button"
              onClick={handleClear}
              className="absolute right-3 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconX size={16} stroke={2} />
            </motion.button>
          )}
        </div>
      </form>
    </motion.div>
  )
}
