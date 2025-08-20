import AssetTeaser from '@shared/AssetTeaser'
import { ReactElement, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Pagination from '@shared/Pagination'
import AssetTitle from '@shared/AssetListTitle'
import Table, { TableOceanColumn } from '../atoms/Table'
import Price from '../Price'
import AssetType from '../AssetType'
import { getServiceByName } from '@utils/ddo'
import AssetViewSelector, { AssetViewOptions } from './AssetViewSelector'
import Time from '../atoms/Time'
import Loader from '../atoms/Loader'
import NetworkName from '../NetworkName'
import { useUserPreferences } from '../../../@context/UserPreferences'
import { IconCopy } from '@tabler/icons-react'

const networkColumn: TableOceanColumn<AssetExtended> = {
  name: 'Network',
  width: '1.5fr',
  selector: (row) => {
    const { chainId } = row
    return <NetworkName networkId={chainId} />
  }
}

const tableColumns: TableOceanColumn<AssetExtended>[] = [
  {
    name: 'Dataset',
    width: '3fr',
    selector: (row) => {
      const { metadata } = row
      const did = row.id
      // Show as many characters as possible, truncate only when necessary
      const shortDid = did.length > 50 ? `${did.slice(0, 50)}...` : did
      return (
        <div className="space-y-1 min-w-0">
          {/* Title with Tooltip */}
          <div className="relative group">
            <div className="font-medium text-gray-900 truncate cursor-help">
              {metadata.name}
            </div>
            {/* Tooltip for Title */}
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 text-gray-800 text-xs rounded-lg shadow-lg z-50 backdrop-blur-2xl bg-white/80 border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              {metadata.name}
              <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
            </div>
          </div>

          {/* DID with Tooltip */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative group flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-mono truncate cursor-help">
                {shortDid}
              </div>
              {/* Tooltip for DID */}
              <div className="absolute left-0 bottom-full mb-2 w-80 p-2 text-gray-800 text-xs rounded-lg shadow-lg z-50 backdrop-blur-2xl bg-white/80 border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="font-mono break-all">{did}</div>
                <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
              </div>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(did)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded flex-shrink-0"
              title="Copy DID"
            >
              <IconCopy className="w-3 h-3 cursor-pointer" />
            </button>
          </div>
        </div>
      )
    }
  },
  {
    name: 'Type',
    width: '2fr',
    selector: (row) => {
      const { metadata } = row
      const isCompute = Boolean(getServiceByName(row, 'compute'))
      const accessType = isCompute ? 'compute' : 'access'
      return (
        <AssetType
          className="text-xs"
          type={metadata?.additionalInformation?.saas ? 'saas' : metadata.type}
          accessType={
            metadata?.additionalInformation?.saas ? 'saas' : accessType
          }
        />
      )
    }
  },
  {
    name: 'Price',
    width: '1fr',
    selector: (row) => {
      return <Price price={row.stats.price} size="mini" />
    }
  },
  {
    name: 'Sales',
    width: '1fr',
    selector: (row) => {
      return <strong>{row.stats.orders < 0 ? 'N/A' : row.stats.orders}</strong>
    }
  },
  {
    name: 'Published',
    width: '1.5fr',
    selector: (row) => {
      return <Time date={row.nft.created} />
    }
  }
]

export declare type AssetListProps = {
  assets: AssetExtended[]
  showPagination: boolean
  page?: number
  totalPages?: number
  isLoading?: boolean
  onPageChange?: React.Dispatch<React.SetStateAction<number>>
  className?: string
  noPublisher?: boolean
  noDescription?: boolean
  noPrice?: boolean
  showAssetViewSelector?: boolean
  defaultAssetView?: AssetViewOptions
}

export default function AssetList({
  assets,
  showPagination,
  page,
  totalPages,
  isLoading,
  onPageChange,
  className,
  noPublisher,
  noDescription,
  noPrice,
  showAssetViewSelector,
  defaultAssetView
}: AssetListProps): ReactElement {
  const { chainIds } = useUserPreferences()

  const [columns, setColumns] = useState(tableColumns)

  useEffect(() => {
    if (chainIds && chainIds.length > 1) {
      const [datasetColumn, ...otherColumns] = tableColumns
      setColumns([datasetColumn, networkColumn, ...otherColumns])
    } else {
      setColumns(tableColumns)
    }
  }, [chainIds])

  const [activeAssetView, setActiveAssetView] = useState<AssetViewOptions>(
    defaultAssetView || AssetViewOptions.Grid
  )

  // This changes the page field inside the query
  function handlePageChange(selected: number) {
    onPageChange(selected + 1)
  }

  const gridClasses = `
    grid grid-cols-1 gap-6
    sm:grid-cols-2 lg:grid-cols-3 gap-8
    ${className || ''}
  `

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return isLoading ? (
    <Loader />
  ) : (
    <>
      {showAssetViewSelector && (
        <AssetViewSelector
          activeAssetView={activeAssetView}
          setActiveAssetView={setActiveAssetView}
        />
      )}

      {assets?.length > 0 ? (
        <>
          {activeAssetView === AssetViewOptions.List && (
            <div className="w-full">
              <Table
                columns={columns}
                data={assets}
                pagination={false}
                paginationPerPage={assets?.length}
                dense
                className="w-full"
              />
            </div>
          )}

          {activeAssetView === AssetViewOptions.Grid && (
            <motion.div
              className={gridClasses}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {assets?.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.05 }}
                >
                  <AssetTeaser
                    asset={asset}
                    noPublisher={noPublisher}
                    noDescription={noDescription}
                    noPrice={noPrice}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          className="text-gray-500 text-sm italic text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          No results found
        </motion.div>
      )}

      {showPagination && (
        <Pagination
          totalPages={totalPages}
          currentPage={page}
          onChangePage={handlePageChange}
        />
      )}
    </>
  )
}
