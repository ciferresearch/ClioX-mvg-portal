import { ReactElement, useState } from 'react'
import { motion } from 'motion/react'
import Loader from '../Loader'
import Pagination from '@shared/Pagination'
import Empty from './Empty'

// Hack in support for returning components for each row, as this works,
// but is not supported by the typings.
export interface TableOceanColumn<T> {
  name: string
  selector?: (row: T) => any
  width?: string
  className?: string
  right?: boolean
  sortable?: boolean
}

export interface TableOceanProps<T> {
  columns: TableOceanColumn<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  sortField?: string
  sortAsc?: boolean
  className?: string
  pagination?: boolean
  paginationPerPage?: number
  dense?: boolean
}

export default function Table<T>({
  data,
  columns,
  isLoading,
  emptyMessage,
  sortField,
  sortAsc,
  className,
  pagination = false,
  paginationPerPage = 10,
  dense = false
}: TableOceanProps<T>): ReactElement {
  const [currentPage, setCurrentPage] = useState(1)

  // Safety checks first
  if (!columns || columns.length === 0) {
    return <Empty message="No columns defined" />
  }

  if (!data) {
    return <Empty message="No data provided" />
  }

  // Loading state
  if (isLoading) {
    return <Loader />
  }

  // Empty state
  if (data.length === 0) {
    return <Empty message={emptyMessage} />
  }

  // Calculate pagination (now safe to access data.length)
  const totalPages = Math.ceil(data.length / paginationPerPage)
  const startIndex = (currentPage - 1) * paginationPerPage
  const endIndex = startIndex + paginationPerPage
  const currentData = pagination ? data.slice(startIndex, endIndex) : data

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className={`${className} w-full`}>
      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        {/* Table Header */}
        <div
          className={`w-full grid gap-0 border-b border-gray-200`}
          style={{
            gridTemplateColumns: columns
              .map((col) => col.width || '1fr')
              .join(' ')
          }}
        >
          {columns.map((column, index) => (
            <motion.div
              key={column.name}
              className={`
                text-left py-3 px-4 font-bold text-xs uppercase tracking-wider
                text-emerald-700 flex items-center
                ${dense ? 'py-2 px-3' : 'py-3 px-4'}
                ${column.className || ''}
                ${column.right ? 'text-right' : ''}
                ${index === 0 ? 'rounded-tl-lg' : ''}
                ${index === columns.length - 1 ? 'rounded-tr-lg' : ''}
              `}
              style={{
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-bold)'
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              {column.name}
            </motion.div>
          ))}
        </div>

        {/* Table Body */}
        {currentData.map((row, rowIndex) => (
          <motion.div
            key={rowIndex}
            className="w-full grid gap-0 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
            style={{
              gridTemplateColumns: columns
                .map((col) => col.width || '1fr')
                .join(' ')
            }}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.3,
              delay: rowIndex * 0.05,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            {columns.map((column, colIndex) => (
              <motion.div
                key={colIndex}
                className={`
                  py-3 px-4 flex items-center
                  ${dense ? 'py-2 px-3' : 'py-3 px-4'}
                  ${column.className || ''}
                  ${column.right ? 'text-right' : ''}
                  ${colIndex === 0 ? 'rounded-l-lg' : ''}
                  ${colIndex === columns.length - 1 ? 'rounded-r-lg' : ''}
                `}
                style={{
                  fontSize: 'var(--font-size-small)',
                  fontWeight: 'var(--font-weight-base)',
                  minWidth: '0'
                }}
                initial={{ opacity: 0, x: colIndex % 2 === 0 ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: rowIndex * 0.05 + colIndex * 0.02,
                  ease: 'easeOut'
                }}
              >
                {column.selector
                  ? column.selector(row)
                  : row[column.name as keyof T]}
              </motion.div>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onChangePage={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
