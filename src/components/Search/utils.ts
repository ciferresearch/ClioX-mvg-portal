import { LoggerInstance } from '@oceanprotocol/lib'
import {
  escapeEsReservedCharacters,
  generateBaseQuery,
  getAsset,
  getOceanNodeAssets,
  getFilterTerm,
  parseFilters,
  queryMetadata
} from '@utils/aquarius'
import queryString from 'query-string'
import { CancelToken } from 'axios'
import {
  FilterByAccessOptions,
  FilterByTypeOptions,
  SortDirectionOptions,
  SortTermOptions
} from '../../@types/aquarius/SearchQuery'
import { filterSets, getInitialFilters } from './Filter'

function getExactDid(text?: string): string | undefined {
  const value = text?.trim()
  if (!value) return
  if (value.startsWith('did:op:')) return value
  if (/^[a-fA-F0-9]{64}$/.test(value)) return `did:op:${value}`
}

export function updateQueryStringParameter(
  uri: string,
  key: string,
  newValue: string
): string {
  const regex = new RegExp('([?&])' + key + '=.*?(&|$)', 'i')
  const separator = uri.indexOf('?') !== -1 ? '&' : '?'

  if (uri.match(regex)) {
    return uri.replace(regex, '$1' + key + '=' + newValue + '$2')
  } else {
    return uri + separator + key + '=' + newValue
  }
}

export function getSearchQuery(
  chainIds: number[],
  text?: string,
  owner?: string,
  tags?: string,
  page?: string,
  offset?: string,
  sort?: string,
  sortDirection?: string,
  serviceType?: string | string[],
  accessType?: string | string[],
  filterSet?: string | string[],
  showSaas?: boolean
): SearchQuery {
  text = escapeEsReservedCharacters(text)
  const emptySearchTerm = text === undefined || text === ''
  const filters: FilterTerm[] = []
  let searchTerm = text || ''
  let nestedQuery
  if (tags) {
    filters.push(getFilterTerm('metadata.tags.keyword', tags))
  } else {
    searchTerm = searchTerm.trim()
    const modifiedSearchTerm = searchTerm.split(' ').join(' OR ').trim()
    const noSpaceSearchTerm = searchTerm.split(' ').join('').trim()

    const prefixedSearchTerm =
      emptySearchTerm && searchTerm
        ? searchTerm
        : !emptySearchTerm && searchTerm
        ? '*' + searchTerm + '*'
        : '**'
    const searchFields = [
      'id',
      'nft.owner',
      'datatokens.address',
      'datatokens.name',
      'datatokens.symbol',
      'metadata.name^10',
      'metadata.author',
      'metadata.description',
      'metadata.tags'
    ]

    nestedQuery = {
      must: [
        {
          bool: {
            should: [
              {
                query_string: {
                  query: `${modifiedSearchTerm}`,
                  fields: searchFields,
                  minimum_should_match: '2<75%',
                  phrase_slop: 2,
                  boost: 5
                }
              },
              {
                query_string: {
                  query: `${noSpaceSearchTerm}*`,
                  fields: searchFields,
                  boost: 5,
                  lenient: true
                }
              },
              {
                match_phrase: {
                  content: {
                    query: `${searchTerm}`,
                    boost: 10
                  }
                }
              },
              {
                query_string: {
                  query: `${prefixedSearchTerm}`,
                  fields: searchFields,
                  default_operator: 'AND'
                }
              }
            ]
          }
        }
      ]
    }
  }

  const filtersList = getInitialFilters(
    { accessType, serviceType, filterSet },
    ['accessType', 'serviceType', 'filterSet']
  )
  parseFilters(filtersList, filterSets).forEach((term) => filters.push(term))

  const baseQueryParams = {
    chainIds,
    nestedQuery,
    esPaginationOptions: {
      from: (Number(page) - 1 || 0) * (Number(offset) || 21),
      size: Number(offset) || 21
    },
    sortOptions: { sortBy: sort, sortDirection },
    filters,
    showSaas
  } as BaseQueryParams

  const query = generateBaseQuery(baseQueryParams)
  return query
}

export async function getResults(
  params: {
    text?: string
    owner?: string
    tags?: string
    categories?: string
    page?: string
    offset?: string
    sort?: string
    sortOrder?: string
    serviceType?: string | string[]
    accessType?: string | string[]
    filterSet?: string[]
  },
  chainIds: number[],
  cancelToken?: CancelToken
): Promise<PagedAssets> {
  const {
    text,
    owner,
    tags,
    page,
    offset,
    sort,
    sortOrder,
    serviceType,
    accessType,
    filterSet
  } = params

  const showSaas =
    serviceType === undefined
      ? undefined
      : serviceType === FilterByTypeOptions.Saas ||
        (typeof serviceType !== 'string' &&
          serviceType.includes(FilterByTypeOptions.Saas))

  // we make sure to query only for service types that are expected
  // by Aqua ("dataset" or "algorithm") by removing "saas"
  const sanitizedServiceType =
    serviceType !== undefined && typeof serviceType !== 'string'
      ? serviceType.filter((type) => type !== FilterByTypeOptions.Saas)
      : serviceType === FilterByTypeOptions.Saas
      ? undefined
      : serviceType

  // A newly published asset may be available from the Clio-X Ocean Node before
  // it appears in the legacy Aquarius search index. Resolve an exact DID (or
  // its 64-character hash) directly before falling back to a text search.
  const exactDid = getExactDid(text)
  if (exactDid) {
    const asset = await getAsset(exactDid, cancelToken)
    if (asset)
      return {
        results: [asset],
        page: 1,
        totalPages: 1,
        totalResults: 1,
        aggregations: []
      }
  }

  const searchQuery = getSearchQuery(
    chainIds,
    text,
    owner,
    tags,
    page,
    offset,
    sort,
    sortOrder,
    sanitizedServiceType,
    accessType,
    filterSet,
    showSaas
  )

  const pageSize = Number(offset) || 21
  const pageNumber = Number(page) || 1
  searchQuery.from = 0
  searchQuery.size = pageNumber * pageSize

  const [queryResult, nodeAssets] = await Promise.all([
    queryMetadata(searchQuery, cancelToken),
    getOceanNodeAssets(cancelToken)
  ])

  const matches = nodeAssets.filter((asset) => {
    if (!chainIds.includes(asset.chainId)) return false
    if (owner && asset.nft?.owner?.toLowerCase() !== owner.toLowerCase())
      return false
    if (tags && !asset.metadata.tags?.includes(tags)) return false
    if (serviceType && sanitizedServiceType) {
      const types = Array.isArray(sanitizedServiceType)
        ? sanitizedServiceType
        : [sanitizedServiceType]
      if (!types.includes(asset.metadata.type)) return false
    }
    if (accessType) {
      const types = Array.isArray(accessType) ? accessType : [accessType]
      if (!asset.services.some((service) => types.includes(service.type)))
        return false
    }
    if (text) {
      const haystack = [
        asset.id,
        asset.metadata.name,
        asset.metadata.description,
        asset.metadata.author,
        asset.nft?.owner,
        ...(asset.metadata.tags || [])
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(text.trim().toLowerCase())) return false
    }
    return true
  })

  const legacyIds = new Set(queryResult?.results?.map((asset) => asset.id))
  const newAssets = matches.filter((asset) => !legacyIds.has(asset.id))
  if (newAssets.length) {
    const results = [...newAssets, ...(queryResult?.results || [])]
    return {
      results: results.slice(
        (pageNumber - 1) * pageSize,
        pageNumber * pageSize
      ),
      page: pageNumber,
      totalResults: (queryResult?.totalResults || 0) + newAssets.length,
      totalPages: Math.ceil(
        ((queryResult?.totalResults || 0) + newAssets.length) / pageSize
      ),
      aggregations: queryResult?.aggregations || []
    }
  }

  // update queryResult to workaround the wrong return datatype of totalPages and totalResults
  if (queryResult)
    queryResult.results = queryResult.results.slice(
      (pageNumber - 1) * pageSize,
      pageNumber * pageSize
    )
  if (queryResult) queryResult.page = pageNumber
  return queryResult?.results?.length === 0
    ? {
        ...queryResult,
        totalPages: 0,
        totalResults: 0
      }
    : queryResult
}

export async function addExistingParamsToUrl(
  location: Location,
  excludedParams: string[]
): Promise<string> {
  const parsed = queryString.parse(location.search)
  let urlLocation = '/search?'
  if (Object.keys(parsed).length > 0) {
    for (const queryParam in parsed) {
      if (!excludedParams.includes(queryParam)) {
        if (queryParam === 'page' && excludedParams.includes('text')) {
          LoggerInstance.log('remove page when starting a new search')
        } else {
          const value = parsed[queryParam]
          urlLocation = `${urlLocation}${queryParam}=${value}&`
        }
      }
    }
  } else {
    // sort should be relevance when fixed in aqua
    urlLocation = `${urlLocation}sort=${encodeURIComponent(
      SortTermOptions.Created
    )}&sortOrder=${SortDirectionOptions.Descending}&`
  }
  urlLocation = urlLocation.slice(0, -1)
  return urlLocation
}
