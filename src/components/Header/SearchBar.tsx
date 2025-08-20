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
    setSearchBarVisible(false)
    setHomeSearchBarFocus(false)
  }, [setSearchBarVisible, setHomeSearchBarFocus])

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
        if (isSearchBarVisible) {
          setSearchBarVisible(false)
        }
        if (homeSearchBarFocus) {
          setHomeSearchBarFocus(false)
        }
      }
    }

    if (isSearchBarVisible || homeSearchBarFocus) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [
    isSearchBarVisible,
    homeSearchBarFocus,
    setSearchBarVisible,
    setHomeSearchBarFocus
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
      className={`${
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
        <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
          <input
            ref={searchBarRef}
            type="text"
            name="search"
            placeholder={placeholder || 'Search for service offerings...'}
            value={value}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            className={`w-full pl-4 pr-20 py-3 text-sm bg-transparent border-0 rounded-xl focus:outline-none focus:bg-gray-50 placeholder-gray-400 ${
              isSearchPage ? 'search-page-input' : ''
            }`}
          />
          {/* Clear button */}
          {value && (
            <motion.button
              type="button"
              onClick={handleClear}
              className="absolute right-12 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconX size={14} stroke={2.5} />
            </motion.button>
          )}
          {/* Search button */}
          <motion.button
            type="submit"
            onClick={handleButtonClick}
            disabled={isSearching}
            className={`absolute right-2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200 ${
              isSearching
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-500 hover:text-teal-600 hover:bg-gray-100'
            }`}
            whileHover={isSearching ? {} : { scale: 1.05 }}
            whileTap={isSearching ? {} : { scale: 0.95 }}
          >
            <IconSearch size={14} stroke={2.5} />
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}
