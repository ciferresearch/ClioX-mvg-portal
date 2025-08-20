import { ReactElement, useEffect } from 'react'
import { motion } from 'framer-motion'
import { addExistingParamsToUrl } from './utils'
import {
  SortDirectionOptions,
  SortTermOptions
} from '../../@types/aquarius/SearchQuery'
import { useRouter } from 'next/router'
import Accordion from '@components/@shared/Accordion'
import { Sort as SortInterface, useFilter } from '@context/Filter'
import queryString from 'query-string'
import { IconArrowUp, IconArrowDown } from '@tabler/icons-react'

const sortItems = [
  { display: 'Relevance', value: SortTermOptions.Relevance },
  { display: 'Published', value: SortTermOptions.Created },
  { display: 'Sales', value: SortTermOptions.Orders },
  { display: 'Price', value: SortTermOptions.Price }
]

const sortDirections = [
  { display: '\u2191 Ascending', value: SortDirectionOptions.Ascending },
  { display: '\u2193 Descending', value: SortDirectionOptions.Descending }
]

function getInitialFilters(
  parsedUrlParams: queryString.ParsedQuery<string>,
  filterIds: (keyof SortInterface)[]
): SortInterface {
  if (!parsedUrlParams || !filterIds) return

  const initialFilters = {}
  filterIds.forEach((id) => (initialFilters[id] = parsedUrlParams?.[id]))

  return initialFilters as SortInterface
}

export default function Sort({
  expanded
}: {
  expanded?: boolean
}): ReactElement {
  const { sort, setSort } = useFilter()

  const router = useRouter()

  const parsedUrl = queryString.parse(location.search, {
    arrayFormat: 'separator'
  })

  useEffect(() => {
    const initialFilters = getInitialFilters(
      parsedUrl,
      Object.keys(sort) as (keyof SortInterface)[]
    )
    setSort(initialFilters)
  }, [])

  async function sortResults(
    sortBy?: SortTermOptions,
    direction?: SortDirectionOptions
  ) {
    let urlLocation: string
    if (sortBy) {
      urlLocation = await addExistingParamsToUrl(location, ['sort'])
      urlLocation = `${urlLocation}&sort=${sortBy}`
      setSort({ ...sort, sort: sortBy })
    } else if (direction) {
      urlLocation = await addExistingParamsToUrl(location, ['sortOrder'])
      urlLocation = `${urlLocation}&sortOrder=${direction}`
      setSort({ ...sort, sortOrder: direction })
    }
    router.push(urlLocation)
  }

  // Animation variants
  const sortVariants = {
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
      <div className="hidden lg:block pb-6 border-b border-gray-200">
        <Accordion title="Sort" defaultExpanded={expanded}>
          <div className={`space-y-4 pt-2`}>
            <motion.div
              className="space-y-2"
              variants={sortVariants}
              initial="hidden"
              animate="visible"
            >
              <h5 className="text-base font-semibold text-emerald-700 uppercase tracking-wide">
                Type
              </h5>
              <div className="space-y-2">
                {sortItems.map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center cursor-pointer group"
                  >
                    <div className="relative flex items-center justify-center w-4 h-4 mr-3">
                      <input
                        className="sr-only"
                        type="radio"
                        name="sortType"
                        value={item.value}
                        checked={sort.sort === item.value}
                        onChange={() => sortResults(item.value, null)}
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          sort.sort === item.value
                            ? 'bg-emerald-500 border-gray-300'
                            : 'bg-white border-gray-200 group-hover:border-emerald-400'
                        }`}
                      >
                        {sort.sort === item.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                    <span className="text-base font-medium text-gray-700 leading-none select-none">
                      {item.display}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
            <motion.div
              className="space-y-2"
              variants={sortVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
            >
              <h5 className="text-base font-semibold text-emerald-700 uppercase tracking-wide">
                Direction
              </h5>
              <div className="space-y-2">
                {sortDirections.map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center cursor-pointer group"
                  >
                    <div className="relative flex items-center justify-center w-4 h-4 mr-3">
                      <input
                        className="sr-only"
                        type="radio"
                        name="sortDirection"
                        value={item.value}
                        checked={sort.sortOrder === item.value}
                        onChange={() => sortResults(null, item.value)}
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          sort.sortOrder === item.value
                            ? 'bg-emerald-500 border-gray-300'
                            : 'bg-white border-gray-200 group-hover:border-emerald-400'
                        }`}
                      >
                        {sort.sortOrder === item.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value === SortDirectionOptions.Ascending ? (
                        <IconArrowUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <IconArrowDown className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-base font-medium text-gray-700 leading-none select-none">
                        {item.display.replace(/[\u2191\u2193]/, '')}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          </div>
        </Accordion>
      </div>

      {/* Top positioning - for mobile layout */}
      <div className="lg:hidden flex flex-wrap gap-3">
        <motion.div
          className="min-w-max h-min p-3 border border-gray-200 rounded-lg bg-white"
          variants={sortVariants}
          initial="hidden"
          animate="visible"
        >
          <Accordion title="Sort Type" compact>
            <div className="mt-3 space-y-2">
              {sortItems.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center cursor-pointer group"
                >
                  <div className="relative flex items-center justify-center w-4 h-4 mr-3">
                    <input
                      className="sr-only"
                      type="radio"
                      name="sortTypeCompact"
                      value={item.value}
                      checked={sort.sort === item.value}
                      onChange={() => sortResults(item.value, null)}
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        sort.sort === item.value
                          ? 'bg-emerald-500 border-gray-300'
                          : 'bg-white border-gray-200 group-hover:border-emerald-400'
                      }`}
                    >
                      {sort.sort === item.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <span className="text-base font-medium text-gray-700 leading-none select-none">
                    {item.display}
                  </span>
                </label>
              ))}
            </div>
          </Accordion>
        </motion.div>
        <motion.div
          className="min-w-max h-min p-3 border border-gray-200 rounded-lg bg-white"
          variants={sortVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <Accordion title="Sort Direction" compact>
            <div className="mt-3 space-y-2">
              {sortDirections.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center cursor-pointer group"
                >
                  <div className="relative flex items-center justify-center w-4 h-4 mr-3">
                    <input
                      className="sr-only"
                      type="radio"
                      name="sortDirectionCompact"
                      value={item.value}
                      checked={sort.sortOrder === item.value}
                      onChange={() => sortResults(null, item.value)}
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        sort.sortOrder === item.value
                          ? 'bg-emerald-500 border-gray-300'
                          : 'bg-white border-gray-200 group-hover:border-emerald-400'
                      }`}
                    >
                      {sort.sortOrder === item.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value === SortDirectionOptions.Ascending ? (
                      <IconArrowUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <IconArrowDown className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-base font-medium text-gray-700 leading-none select-none">
                      {item.display.replace(/[\u2191\u2193]/, '')}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </Accordion>
        </motion.div>
      </div>
    </>
  )
}
