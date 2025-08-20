import { ReactElement, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import AssetList from '@shared/AssetList'
import queryString from 'query-string'
import Filter from './Filter'
import Sort from './sort'
import { getResults, updateQueryStringParameter } from './utils'
import { useUserPreferences } from '@context/UserPreferences'
import { useCancelToken } from '@hooks/useCancelToken'
import { useRouter } from 'next/router'
import { useDebouncedCallback } from 'use-debounce'
import SearchBar from '@components/Header/SearchBar'

export default function SearchPage({
  setTotalResults,
  setTotalPagesNumber
}: {
  setTotalResults: (totalResults: number) => void
  setTotalPagesNumber: (totalPagesNumber: number) => void
}): ReactElement {
  const router = useRouter()
  const [parsed, setParsed] = useState<queryString.ParsedQuery<string>>()
  const { chainIds } = useUserPreferences()
  const [queryResult, setQueryResult] = useState<PagedAssets>()
  const [loading, setLoading] = useState<boolean>(true)
  const newCancelToken = useCancelToken()

  useEffect(() => {
    const parsed = queryString.parse(location.search, {
      arrayFormat: 'separator'
    })
    setParsed(parsed)
  }, [router])

  const updatePage = useCallback(
    (page: number) => {
      const { pathname, query } = router
      const newUrl = updateQueryStringParameter(
        pathname +
          '?' +
          JSON.stringify(query)
            .replace(/"|{|}/g, '')
            .replace(/:/g, '=')
            .replace(/,/g, '&'),
        'page',
        `${page}`
      )
      return router.push(newUrl)
    },
    [router]
  )

  const fetchAssets = useDebouncedCallback(
    async (parsed: queryString.ParsedQuery<string>, chainIds: number[]) => {
      setLoading(true)
      setTotalResults(undefined)
      const queryResult = await getResults(parsed, chainIds, newCancelToken())
      setQueryResult(queryResult)

      setTotalResults(queryResult?.totalResults || 0)
      setTotalPagesNumber(queryResult?.totalPages || 0)
      setLoading(false)
    },
    500
  )
  useEffect(() => {
    if (!parsed || !queryResult) return
    const { page } = parsed
    if (queryResult.totalPages < Number(page)) updatePage(1)
  }, [parsed, queryResult, updatePage])

  useEffect(() => {
    if (!parsed || !chainIds) return

    // Immediately reflect new search params in UI to avoid showing stale results
    setLoading(true)
    setQueryResult(undefined)
    setTotalResults(undefined)

    fetchAssets(parsed, chainIds)
  }, [parsed, chainIds, fetchAssets])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  }

  const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  }

  const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut', delay: 0.1 }
    }
  }

  return (
    <motion.div
      className="max-w-[1400px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Results Header with Search */}
      <div className="flex items-ends justify-between mb-6">
        <div className="text-5xl font-semibold text-gray-900 leading-none">
          {loading ? (
            <span>Searching...</span>
          ) : (
            <>
              {queryResult?.totalResults || 0} results
              {parsed?.text &&
                typeof parsed.text === 'string' &&
                parsed.text.trim() !== '' &&
                ` for "${parsed.text}"`}
            </>
          )}
        </div>
        <div className="flex items-end gap-4">
          {/* SearchBar Component */}
          <div className="h-8 w-80 mb-2">
            <SearchBar
              placeholder="Search for service offerings"
              isSearchPage={true}
              isSearching={loading}
            />
          </div>
        </div>
      </div>
      {/* Layout Container - mimic Profile layout */}
      <motion.div className="flex flex-col gap-4 lg:flex-row lg:gap-6 border-t border-gray-200  p-6">
        {/* Left Sidebar - Filters */}
        <motion.div
          className="flex flex-row flex-wrap gap-2 w-full pr-6 lg:flex-col lg:w-60 lg:border-r lg:border-gray-200 lg:[&>div]:pb-6 lg:[&>div]:border-b lg:[&>div]:border-gray-200"
          variants={sidebarVariants}
        >
          <Filter addFiltersToUrl expanded />
          <Sort expanded />
        </motion.div>

        {/* Right Content - Results */}
        <motion.div className="w-full" variants={contentVariants}>
          <AssetList
            assets={queryResult?.results}
            showPagination
            isLoading={loading}
            page={queryResult?.page}
            totalPages={queryResult?.totalPages}
            onPageChange={updatePage}
            showAssetViewSelector
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
