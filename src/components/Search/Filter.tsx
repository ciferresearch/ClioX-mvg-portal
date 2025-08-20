import { ReactElement, useEffect } from 'react'
import { motion } from 'framer-motion'
import { addExistingParamsToUrl } from './utils'
import Button from '@shared/atoms/Button'
import {
  FilterByAccessOptions,
  FilterByTypeOptions
} from '../../@types/aquarius/SearchQuery'
import { useRouter } from 'next/router'
import queryString from 'query-string'
import { useFilter, Filters } from '@context/Filter'
import Input from '@components/@shared/FormInput'
import Accordion from '@components/@shared/Accordion'
import customFilters from '../../../filters.config'

interface FilterStructure {
  id: string
  label: string
  type: string
  options: {
    label: string
    value: string
  }[]
}

const filterList: FilterStructure[] = [
  {
    id: 'serviceType',
    label: 'Service Type',
    type: 'filterList',
    options: [
      { label: 'datasets', value: FilterByTypeOptions.Data },
      { label: 'algorithms', value: FilterByTypeOptions.Algorithm },
      { label: 'saas', value: FilterByTypeOptions.Saas }
    ]
  },
  {
    id: 'accessType',
    label: 'Access Type',
    type: 'filterList',
    options: [
      { label: 'download', value: FilterByAccessOptions.Download },
      { label: 'compute', value: FilterByAccessOptions.Compute }
    ]
  },
  ...(Array.isArray(customFilters?.filters) &&
  customFilters?.filters?.length > 0 &&
  customFilters?.filters.some((filter) => filter !== undefined)
    ? // eslint-disable-next-line no-unsafe-optional-chaining
      customFilters?.filters
    : [])
]

export const filterSets = customFilters?.filterSets || {}

const purgatoryFilterItem = { display: 'show purgatory ', value: 'purgatory' }

export function getInitialFilters(
  parsedUrlParams: queryString.ParsedQuery<string>,
  filterIds: string[]
): Filters {
  if (!parsedUrlParams || !filterIds) return

  const initialFilters = {}
  filterIds.forEach((id) =>
    !parsedUrlParams?.[id]
      ? (initialFilters[id] = [])
      : Array.isArray(parsedUrlParams?.[id])
      ? (initialFilters[id] = parsedUrlParams?.[id])
      : (initialFilters[id] = [parsedUrlParams?.[id]])
  )

  return initialFilters as Filters
}

export default function Filter({
  addFiltersToUrl,
  showPurgatoryOption,
  expanded,
  className
}: {
  addFiltersToUrl?: boolean
  showPurgatoryOption?: boolean
  expanded?: boolean
  className?: string
}): ReactElement {
  const { filters, setFilters, ignorePurgatory, setIgnorePurgatory } =
    useFilter()

  const router = useRouter()

  const parsedUrl = queryString.parse(location.search, {
    arrayFormat: 'separator'
  })

  useEffect(() => {
    const initialFilters = getInitialFilters(parsedUrl, Object.keys(filters))
    setFilters(initialFilters)
  }, [])

  async function applyFilter(filter: string[], filterId: string) {
    if (!addFiltersToUrl) return

    let urlLocation = await addExistingParamsToUrl(location, [filterId])

    if (filter.length > 0 && urlLocation.indexOf(filterId) === -1) {
      const parsedFilter = filter.join(',')
      urlLocation = `${urlLocation}&${filterId}=${parsedFilter}`
    }

    router.push(urlLocation)
  }

  async function handleSelectedFilter(value: string, filterId: string) {
    const updatedFilters = filters[filterId].includes(value)
      ? { ...filters, [filterId]: filters[filterId].filter((e) => e !== value) }
      : { ...filters, [filterId]: [...filters[filterId], value] }
    setFilters(updatedFilters)

    await applyFilter(updatedFilters[filterId], filterId)
  }

  async function clearFilters(addFiltersToUrl: boolean) {
    const clearedFilters = { ...filters }
    Object.keys(clearedFilters).forEach((key) => (clearedFilters[key] = []))
    setFilters(clearedFilters)

    if (ignorePurgatory !== undefined && setIgnorePurgatory !== undefined)
      setIgnorePurgatory(true)

    if (!addFiltersToUrl) return
    const urlLocation = await addExistingParamsToUrl(
      location,
      Object.keys(clearedFilters)
    )
    router.push(urlLocation)
  }

  const selectedFiltersCount = Object.values(filters).reduce(
    (acc, filter) => acc + filter.length,
    showPurgatoryOption && ignorePurgatory ? 1 : 0
  )

  // Animation variants
  const filterVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  return (
    <>
      {/* Side positioning - for desktop layout */}
      <div
        className="hidden lg:block pb-6 border-b"
        style={{ borderBottomColor: 'var(--border-color)' }}
      >
        <Accordion
          title="Filters"
          defaultExpanded={expanded}
          badgeNumber={selectedFiltersCount}
          action={
            selectedFiltersCount > 0 && (
              <button
                onClick={async () => {
                  clearFilters(addFiltersToUrl)
                }}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-600 transition-colors duration-200 cursor-pointer"
              >
                Clear filters
              </button>
            )
          }
        >
          <div className={`space-y-4 pt-2 ${className || ''}`}>
            {filterList.map((filter, index) => (
              <motion.div
                key={filter.id}
                className="space-y-2"
                variants={filterVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <h5 className="text-base font-semibold text-emerald-700 uppercase tracking-wide">
                  {filter.label}
                </h5>
                <div className="space-y-2">
                  {filter.options.map((option) => {
                    const isSelected = filters[filter.id].includes(option.value)
                    return (
                      <label
                        key={option.value}
                        className="flex items-center cursor-pointer"
                      >
                        <div className="relative mr-2.5 flex items-center">
                          <input
                            className="sr-only"
                            type="checkbox"
                            checked={isSelected}
                            onChange={async () => {
                              handleSelectedFilter(option.value, filter.id)
                            }}
                          />
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? 'bg-emerald-500 border-gray-300'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-base font-semibold text-gray-700 leading-none">
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </motion.div>
            ))}
            {showPurgatoryOption && (
              <motion.div
                className="space-y-2"
                variants={filterVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: filterList.length * 0.1 }}
              >
                <h5 className="text-base font-semibold text-emerald-700 uppercase tracking-wide">
                  Purgatory
                </h5>
                <label className="flex items-center cursor-pointer">
                  <div className="relative mr-2.5 flex items-center">
                    <input
                      className="sr-only"
                      type="checkbox"
                      checked={ignorePurgatory}
                      onChange={async () => {
                        setIgnorePurgatory(!ignorePurgatory)
                      }}
                    />
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                        ignorePurgatory
                          ? 'bg-emerald-500 border-gray-300'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {ignorePurgatory && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-base font-semibold text-gray-700 leading-none">
                    {purgatoryFilterItem.display}
                  </span>
                </label>
              </motion.div>
            )}
          </div>
        </Accordion>
      </div>

      {/* Top positioning - for mobile layout */}
      <div className="lg:hidden flex flex-wrap gap-3">
        {filterList.map((filter, index) => (
          <motion.div
            key={filter.id}
            className="min-w-max h-min p-3 border border-gray-200 rounded-lg bg-white"
            variants={filterVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.1 }}
          >
            <Accordion
              title={filter.label}
              badgeNumber={filters[filter.id].length}
              compact
            >
              <div className="mt-3 space-y-2">
                {filter.options.map((option) => {
                  const isSelected = filters[filter.id].includes(option.value)
                  return (
                    <label
                      key={option.value}
                      className="flex items-center cursor-pointer"
                    >
                      <div className="relative mr-2.5 flex items-center">
                        <input
                          className="sr-only"
                          type="checkbox"
                          checked={isSelected}
                          onChange={async () => {
                            handleSelectedFilter(option.value, filter.id)
                          }}
                        />
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? 'bg-emerald-500 border-gray-300'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-base font-semibold text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </Accordion>
          </motion.div>
        ))}
        {showPurgatoryOption && (
          <motion.div
            className="min-w-max h-min p-3 border border-gray-200 rounded-lg bg-white"
            variants={filterVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: filterList.length * 0.1 }}
          >
            <Accordion
              title="Purgatory"
              badgeNumber={ignorePurgatory ? 1 : 0}
              compact
            >
              <div className="mt-3">
                <label className="flex items-center cursor-pointer">
                  <div className="relative mr-2.5 flex items-center">
                    <input
                      className="sr-only"
                      type="checkbox"
                      checked={ignorePurgatory}
                      onChange={async () => {
                        setIgnorePurgatory(!ignorePurgatory)
                      }}
                    />
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                        ignorePurgatory
                          ? 'bg-emerald-500 border-gray-300'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {ignorePurgatory && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-base font-semibold text-gray-700">
                    {purgatoryFilterItem.display}
                  </span>
                </label>
              </div>
            </Accordion>
          </motion.div>
        )}
      </div>
    </>
  )
}
