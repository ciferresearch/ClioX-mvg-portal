import { LoggerInstance } from '@oceanprotocol/lib'
import { ReactElement, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import AssetList from '@shared/AssetList'
import { getPublishedAssets } from '@utils/aquarius'
import { useUserPreferences } from '@context/UserPreferences'
import { useCancelToken } from '@hooks/useCancelToken'
import Filter from '@components/Search/Filter'
import { useMarketMetadata } from '@context/MarketMetadata'
import { CancelToken } from 'axios'
import { useProfile } from '@context/Profile'
import { useFilter, Filters } from '@context/Filter'
import { useDebouncedCallback } from 'use-debounce'

export default function PublishedList({
  accountId
}: {
  accountId: string
}): ReactElement {
  const { appConfig } = useMarketMetadata()
  const { chainIds } = useUserPreferences()
  const { ownAccount } = useProfile()
  const { filters, ignorePurgatory } = useFilter()
  const [queryResult, setQueryResult] = useState<PagedAssets>()
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState<number>(1)
  const newCancelToken = useCancelToken()

  const getPublished = useDebouncedCallback(
    async (
      accountId: string,
      chainIds: number[],
      page: number,
      filters: Filters,
      ignorePurgatory: boolean,
      cancelToken: CancelToken
    ) => {
      try {
        setIsLoading(true)
        const result = await getPublishedAssets(
          accountId.toLowerCase(),
          chainIds,
          cancelToken,
          ownAccount && ignorePurgatory,
          ownAccount,
          filters,
          page
        )
        setQueryResult(result)
      } catch (error) {
        LoggerInstance.error(error.message)
      } finally {
        setIsLoading(false)
      }
    },
    500
  )

  useEffect(() => {
    if (queryResult && queryResult.totalPages < page) setPage(1)
  }, [page, queryResult])

  useEffect(() => {
    if (!accountId) return

    getPublished(
      accountId,
      chainIds,
      page,
      filters,
      ignorePurgatory,
      newCancelToken()
    )
  }, [
    accountId,
    ownAccount,
    page,
    appConfig?.metadataCacheUri,
    chainIds,
    newCancelToken,
    getPublished,
    filters,
    ignorePurgatory
  ])

  return accountId ? (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <motion.div
        className="flex flex-row flex-wrap gap-2 w-full pr-6 lg:flex-col lg:w-60 lg:border-r lg:border-gray-200 lg:[&>div]:pb-6 lg:[&>div]:border-b lg:[&>div]:border-gray-200"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Filter showPurgatoryOption={ownAccount} expanded />
      </motion.div>
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <AssetList
          assets={queryResult?.results}
          isLoading={isLoading}
          showPagination
          page={queryResult?.page}
          totalPages={queryResult?.totalPages}
          onPageChange={(newPage) => {
            setPage(newPage)
          }}
          noPublisher
          showAssetViewSelector
        />
      </motion.div>
    </div>
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-8 text-gray-600"
    >
      Please connect your wallet.
    </motion.div>
  )
}
