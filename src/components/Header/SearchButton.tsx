import { FormEvent, ReactElement, useState, useEffect, useRef } from 'react'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useSearchBarStatus } from '@context/SearchBarStatus'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'motion/react'
import { addExistingParamsToUrl } from '../Search/utils'

export default function SearchButton(): ReactElement {
  const router = useRouter()
  const { isSearchBarVisible, setSearchBarVisible } = useSearchBarStatus()
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [expandedWidth, setExpandedWidth] = useState<number>(280)

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

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (searchValue.trim()) {
      const urlEncodedValue = encodeURIComponent(searchValue.trim())
      // Build URL like the Search page does so defaults (sort, sortOrder, etc.) are preserved
      const url = await addExistingParamsToUrl(location, [
        'text',
        'owner',
        'tags'
      ])
      router.push(`${url}&text=${urlEncodedValue}`)
      setSearchValue('')
      setSearchBarVisible(false)
    }
  }

  function handleClose() {
    setSearchBarVisible(false)
    setSearchValue('')
  }

  // Focus input when search bar becomes visible
  useEffect(() => {
    if (isSearchBarVisible && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchBarVisible])

  // Responsive target width for expanded search bar
  useEffect(() => {
    function updateWidth() {
      // lg breakpoint ~ 1024px: use wider search bar
      const isLarge = window.matchMedia('(min-width: 1024px)').matches
      setExpandedWidth(isLarge ? 240 : 240)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth, { passive: true })
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  if (isSearchPage) {
    return (
      <div className="relative flex-shrink-0">
        <button
          onClick={handleButtonClick}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200 text-gray-600 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
          aria-label="Focus search bar"
        >
          <IconSearch size={14} stroke={2.5} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex-shrink-0">
      {isSearchBarVisible ? (
        <motion.div
          initial={{ width: 36 }}
          animate={{ width: expandedWidth }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative"
        >
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative flex items-center h-9 bg-white border border-gray-100 rounded-lg">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for service offerings..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-3 pr-10 text-xs bg-transparent border-0 rounded-lg focus:outline-none focus:bg-transparent placeholder-gray-400"
              />
              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-2 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
              >
                <IconX size={12} stroke={2.5} />
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <button
          onClick={handleButtonClick}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200 text-gray-600 hover:text-teal-700 cursor-pointer"
          aria-label="Search"
        >
          <IconSearch size={14} stroke={2.5} />
        </button>
      )}
    </div>
  )
}
