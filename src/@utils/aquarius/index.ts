import { Asset, LoggerInstance } from '@oceanprotocol/lib'
import { AssetSelectionAsset } from '@shared/FormInput/InputElement/AssetSelection'
import axios, { CancelToken, AxiosResponse } from 'axios'
import { OrdersData_orders as OrdersData } from '../../@types/subgraph/OrdersData'
import {
  metadataCacheUri,
  allowDynamicPricing,
  metadataEncryptionNodeUrl
} from '../../../app.config'
import {
  FilterByTypeOptions,
  SortDirectionOptions,
  SortTermOptions
} from '../../@types/aquarius/SearchQuery'
import { transformAssetToAssetSelection } from '../assetConvertor'
import addressConfig from '../../../address.config'
import { isValidDid } from '@utils/ddo'
import { Filters } from '@context/Filter'
import { filterSets } from '@components/Search/Filter'
import { CHAIN_TO_INDEX_MAP, DEFAULT_INDEX } from './_constants'

export interface UserSales {
  id: string
  totalSales: number
}

export const MAXIMUM_NUMBER_OF_PAGES_WITH_RESULTS = 476

const saasFieldExists = {
  exists: {
    field: 'metadata.additionalInformation.saas.redirectUrl'
  }
}

export function escapeEsReservedCharacters(value: string): string {
  // eslint-disable-next-line no-useless-escape
  const pattern = /([\!\*\+\-\=\<\>\&\|\(\)\[\]\{\}\^\~\?\:\\/"])/g
  return value?.replace(pattern, '\\$1')
}

/**
 * @param filterField the name of the actual field from the ddo schema e.g. 'id','service.attributes.main.type'
 * @param value the value of the filter
 * @returns json structure of the es filter
 */
type TFilterValue = string | number | boolean | number[] | string[]
type TFilterKey = 'terms' | 'term' | 'match' | 'match_phrase'

export function getFilterTerm(
  filterField: string,
  value: TFilterValue,
  key: TFilterKey = 'term'
): FilterTerm {
  const isArray = Array.isArray(value)
  const useKey = key === 'term' ? (isArray ? 'terms' : 'term') : key
  return {
    [useKey]: {
      [filterField]: value
    }
  }
}

export function parseFilters(
  filtersList: Filters,
  filterSets: { [key: string]: string[] }
): FilterTerm[] {
  const filterQueryPath = {
    accessType: 'services.type',
    serviceType: 'metadata.type',
    filterSet: 'metadata.tags.keyword'
  }

  const filterTerms = Object.keys(filtersList)?.map((key) => {
    if (key === 'filterSet') {
      const tags = filtersList[key].reduce(
        (acc, set) => [...acc, ...filterSets[set]],
        []
      )
      const uniqueTags = [...new Set(tags)]
      return uniqueTags.length > 0
        ? getFilterTerm(filterQueryPath[key], uniqueTags)
        : undefined
    }
    if (filtersList[key].length > 0)
      return getFilterTerm(filterQueryPath[key], filtersList[key])

    return undefined
  })

  return filterTerms.filter((term) => term !== undefined)
}

export function getWhitelistShould(): FilterTerm[] {
  const { whitelists } = addressConfig

  const whitelistFilterTerms = Object.entries(whitelists)
    .filter(([field, whitelist]) => whitelist.length > 0)
    .map(([field, whitelist]) =>
      whitelist.map((address) => getFilterTerm(field, address, 'match'))
    )
    .reduce((prev, cur) => prev.concat(cur), [])

  return whitelistFilterTerms.length > 0 ? whitelistFilterTerms : []
}

export function getDynamicPricingMustNot(): // eslint-disable-next-line camelcase
FilterTerm | undefined {
  return allowDynamicPricing === 'true'
    ? undefined
    : getFilterTerm('price.type', 'pool')
}

export function getIndexForChainIds(chainIds: number[]): string[] {
  const indexes: string[] = []
  for (const chainId of chainIds) {
    const index = CHAIN_TO_INDEX_MAP[chainId] || DEFAULT_INDEX
    indexes.push(index)
  }
  return indexes
}

export function generateBaseQuery(
  baseQueryParams: BaseQueryParams
): SearchQuery {
  const isMetadataTypeSelected = !!baseQueryParams?.filters?.find((e) =>
    Object.hasOwn(e, 'term')
      ? Object.keys(e?.term)?.includes('metadata.type')
      : Object.hasOwn(e, 'terms')
      ? Object.keys(e?.terms)?.includes('metadata.type')
      : false
  )

  const generatedQuery = {
    from: baseQueryParams.esPaginationOptions?.from || 0,
    size:
      baseQueryParams.esPaginationOptions?.size >= 0
        ? baseQueryParams.esPaginationOptions?.size
        : 1000,
    query: {
      bool: {
        ...baseQueryParams.nestedQuery,
        filter: [
          ...(baseQueryParams.filters || []),
          ...(baseQueryParams.chainIds
            ? [getFilterTerm('chainId', baseQueryParams.chainIds)]
            : []),
          getFilterTerm(
            '_index',
            getIndexForChainIds(baseQueryParams.chainIds)
          ),
          ...(baseQueryParams.ignorePurgatory
            ? []
            : [getFilterTerm('purgatory.state', false)]),
          ...(!isMetadataTypeSelected && baseQueryParams.showSaas
            ? [saasFieldExists]
            : []),
          {
            bool: {
              must_not: [
                ...(!baseQueryParams.ignoreState
                  ? [getFilterTerm('nft.state', 5)]
                  : []),
                getDynamicPricingMustNot(),
                ...(baseQueryParams.showSaas === false && isMetadataTypeSelected
                  ? [saasFieldExists]
                  : [])
              ]
            }
          }
        ]
      }
    }
  } as SearchQuery

  if (baseQueryParams.aggs !== undefined) {
    generatedQuery.aggs = baseQueryParams.aggs
  }

  if (baseQueryParams.sortOptions !== undefined)
    generatedQuery.sort = {
      [baseQueryParams.sortOptions.sortBy]:
        baseQueryParams.sortOptions.sortDirection ||
        SortDirectionOptions.Descending
    }

  // add whitelist filtering
  if (getWhitelistShould()?.length > 0) {
    const whitelistQuery = {
      bool: {
        should: [...getWhitelistShould()],
        minimum_should_match: 1
      }
    }
    Object.hasOwn(generatedQuery.query.bool, 'must')
      ? generatedQuery.query.bool.must.push(whitelistQuery)
      : (generatedQuery.query.bool.must = [whitelistQuery])
  }

  // if the selected type filter includes both algo and saas, we need to inject the
  // dataset type to the filter, otherwise saas assets will not show up
  if (baseQueryParams.showSaas && isMetadataTypeSelected) {
    const metadataTypeFilter = baseQueryParams?.filters?.find(
      (e) =>
        (Object.hasOwn(e, 'term') &&
          Object.keys(e.term)?.includes('metadata.type')) ||
        (Object.hasOwn(e, 'terms') &&
          Object.keys(e.terms)?.includes('metadata.type'))
    )
    const metadataSelected = Object.hasOwn(metadataTypeFilter, 'term')
      ? ([metadataTypeFilter?.term?.['metadata.type']] as string[])
      : (metadataTypeFilter?.terms?.['metadata.type'] as string[])

    if (
      metadataSelected?.length === 1 &&
      metadataSelected.includes(FilterByTypeOptions.Algorithm)
    ) {
      const dataTypeIndex = generatedQuery.query.bool.filter.findIndex(
        (filter) => Object.keys(filter?.terms)?.includes('metadata.type')
      )

      // push dataset type to 'metadata.type' filter
      generatedQuery.query.bool.filter[dataTypeIndex].terms[
        'metadata.type'
      ].push(FilterByTypeOptions.Data)

      // only allow for either 'metadata.type' === 'algorithm' or saasFieldExists
      generatedQuery.query.bool.must.push({
        bool: {
          should: [
            getFilterTerm('metadata.type', FilterByTypeOptions.Algorithm),
            saasFieldExists
          ],
          minimum_should_match: 1
        }
      })
    }
  }

  return generatedQuery
}

export function transformQueryResult(
  queryResult: SearchResponse,
  from = 0,
  size = 21
): PagedAssets {
  const result: PagedAssets = {
    results: [],
    page: 0,
    totalPages: 0,
    totalResults: 0,
    aggregations: []
  }

  result.results = (queryResult.hits.hits || []).map(
    (hit) => hit._source as Asset
  )

  result.aggregations = queryResult.aggregations
  // Temporary fix to handle old Aquarius deployment
  result.totalResults =
    queryResult.hits.total?.value ||
    (queryResult.hits.total as unknown as number)

  result.totalPages =
    result.totalResults / size < 1
      ? Math.floor(result.totalResults / size)
      : Math.ceil(result.totalResults / size)
  result.page = from ? from / size + 1 : 1

  return result
}

export async function queryMetadata(
  query: SearchQuery,
  cancelToken: CancelToken
): Promise<PagedAssets> {
  try {
    const response: AxiosResponse<SearchResponse> = await axios.post(
      `${metadataCacheUri}/api/aquarius/assets/query`,
      { ...query },
      { cancelToken }
    )
    if (!response || response.status !== 200 || !response.data) return

    return transformQueryResult(response.data, query.from, query.size)
  } catch (error) {
    if (axios.isCancel(error)) {
      LoggerInstance.log(error.message)
    } else {
      LoggerInstance.error(error.message)
    }
  }
}

type OceanNodeSearchResult = {
  found?: number
  hits?: Array<{ document?: Asset }>
}

function normalizeOceanNodeAsset(asset: Asset): Asset {
  const indexed = (
    asset as Asset & {
      indexedMetadata?: {
        nft?: Asset['nft']
        purgatory?: Asset['purgatory']
        event?: Asset['event']
        stats?: Array<{
          orders?: number
          prices?: Array<{ price?: string; token?: string }>
        }>
      }
    }
  ).indexedMetadata
  if (!indexed) return asset
  const tokenStats = indexed.stats?.[0]
  return {
    ...asset,
    nft: indexed.nft || asset.nft,
    event: indexed.event || asset.event,
    purgatory: indexed.purgatory ||
      asset.purgatory || { state: false, reason: '' },
    stats: asset.stats || {
      orders: tokenStats?.orders || 0,
      price: {
        value: Number(tokenStats?.prices?.[0]?.price || 0),
        tokenAddress: tokenStats?.prices?.[0]?.token,
        tokenSymbol: tokenStats?.prices?.[0]?.price === '0' ? 'FREE' : undefined
      },
      allocated: 0
    }
  }
}

export async function getOceanNodeAssets(
  cancelToken?: CancelToken
): Promise<Asset[]> {
  if (!metadataEncryptionNodeUrl) return []

  try {
    const seen = new Set<string>()
    const assets: Asset[] = []
    for (let page = 1; page <= 100; page++) {
      const response = await axios.post<OceanNodeSearchResult[]>(
        `${metadataEncryptionNodeUrl.replace(
          /\/$/,
          ''
        )}/api/aquarius/assets/metadata/query`,
        { q: '*', filter_by: '', page },
        { cancelToken }
      )
      const groups = response.data || []
      for (const group of groups) {
        for (const hit of group.hits || []) {
          if (!hit.document?.id || seen.has(hit.document.id)) continue
          seen.add(hit.document.id)
          assets.push(normalizeOceanNodeAsset(hit.document))
        }
      }
      if (groups.every((group) => page * 250 >= (group.found || 0))) break
    }
    return assets
  } catch (error) {
    if (axios.isCancel(error)) throw error
    // The legacy Aquarius result remains usable if Node is temporarily down.
    LoggerInstance.error(`Could not retrieve Node assets: ${error.message}`)
    return []
  }
}

export async function getAsset(
  did: string,
  cancelToken: CancelToken
): Promise<Asset> {
  if (!isValidDid(did)) return

  // New assets are indexed by the Clio-X Ocean Node. Keep the legacy Aquarius
  // lookup as a fallback while historical assets are migrated incrementally.
  const assetEndpoints = [
    metadataEncryptionNodeUrl &&
      `${metadataEncryptionNodeUrl.replace(
        /\/$/,
        ''
      )}/api/aquarius/assets/ddo/${did}`,
    `${metadataCacheUri}/api/aquarius/assets/ddo/${did}`
  ].filter(Boolean)

  try {
    for (const endpoint of assetEndpoints) {
      try {
        const response: AxiosResponse<Asset> = await axios.get(endpoint, {
          cancelToken
        })
        if (response?.status === 200 && response.data)
          return normalizeOceanNodeAsset(response.data)
      } catch (error) {
        if (axios.isCancel(error)) throw error
        // A 404 from the new Node is expected for a historical asset. Try the
        // next configured cache before reporting an error to the user.
      }
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      LoggerInstance.log(error.message)
    } else {
      LoggerInstance.error(error.message)
    }
  }
}

export async function getAssetsNames(
  didList: string[],
  cancelToken: CancelToken
): Promise<Record<string, string>> {
  try {
    const response: AxiosResponse<Record<string, string>> = await axios.post(
      `${metadataCacheUri}/api/aquarius/assets/names`,
      { didList },
      { cancelToken }
    )
    if (!response || response.status !== 200 || !response.data) return
    return response.data
  } catch (error) {
    if (axios.isCancel(error)) {
      LoggerInstance.log(error.message)
    } else {
      LoggerInstance.error(error.message)
    }
  }
}

export async function getAssetsFromDids(
  didList: string[],
  chainIds: number[],
  cancelToken: CancelToken
): Promise<Asset[]> {
  if (didList?.length === 0 || chainIds?.length === 0) return []

  try {
    const orderedDDOListByDIDList: Asset[] = []
    const baseQueryparams = {
      chainIds,
      filters: [getFilterTerm('_id', didList)],
      ignorePurgatory: true
    } as BaseQueryParams
    const query = generateBaseQuery(baseQueryparams)
    const result = await queryMetadata(query, cancelToken)

    didList.forEach((did: string) => {
      const ddo = result.results.find((ddo: Asset) => ddo.id === did)
      if (ddo) orderedDDOListByDIDList.push(ddo)
    })
    return orderedDDOListByDIDList
  } catch (error) {
    LoggerInstance.error(error.message)
  }
}

export async function getAlgorithmDatasetsForCompute(
  algorithmId: string,
  datasetProviderUri: string,
  accountId: string,
  datasetChainId?: number,
  cancelToken?: CancelToken
): Promise<AssetSelectionAsset[]> {
  const baseQueryParams = {
    chainIds: [datasetChainId],
    nestedQuery: {
      must: [
        {
          match_phrase: {
            'services.compute.publisherTrustedAlgorithms.did': {
              query: algorithmId
            }
          }
        }
      ]
    },
    sortOptions: {
      sortBy: SortTermOptions.Created,
      sortDirection: SortDirectionOptions.Descending
    }
  } as BaseQueryParams

  const query = generateBaseQuery(baseQueryParams)
  const computeDatasets = await queryMetadata(query, cancelToken)
  if (computeDatasets?.results?.length === 0) return []

  const datasets = await transformAssetToAssetSelection(
    datasetProviderUri,
    computeDatasets.results,
    accountId,
    []
  )
  return datasets
}

export async function getPublishedAssets(
  accountId: string,
  chainIds: number[],
  cancelToken: CancelToken,
  ignorePurgatory = false,
  ignoreState = false,
  filtersList?: Filters,
  page?: number
): Promise<PagedAssets> {
  if (!accountId) return

  const filters: FilterTerm[] = []

  filters.push(getFilterTerm('nft.state', [0, 4, 5]))
  filters.push(getFilterTerm('nft.owner', accountId.toLowerCase()))

  const showSaas = filtersList?.serviceType?.includes(FilterByTypeOptions.Saas)

  // we make sure to query only for service types that are expected
  // by Aqua ("dataset" or "algorithm") by removing "saas"
  const sanitizedFilters: Filters = filtersList
    ? {
        ...filtersList,
        serviceType: (filtersList.serviceType || []).filter(
          (type) => type !== FilterByTypeOptions.Saas
        )
      }
    : ({} as Filters)

  parseFilters(sanitizedFilters, filterSets).forEach((term) =>
    filters.push(term)
  )

  const baseQueryParams = {
    chainIds,
    filters,
    sortOptions: {
      sortBy: SortTermOptions.Created,
      sortDirection: SortDirectionOptions.Descending
    },
    aggs: {
      totalOrders: {
        sum: {
          field: SortTermOptions.Orders
        }
      }
    },
    ignorePurgatory,
    ignoreState,
    esPaginationOptions: {
      from: (Number(page) - 1 || 0) * 9,
      size: 9
    },
    showSaas
  } as BaseQueryParams

  const query = generateBaseQuery(baseQueryParams)

  try {
    query.from = 0
    query.size = (Number(page) || 1) * 9
    const [legacyResult, allNodeAssets] = await Promise.all([
      queryMetadata(query, cancelToken),
      getOceanNodeAssets(cancelToken)
    ])

    const nodeAssets = allNodeAssets
      .filter(
        (asset) => asset.nft?.owner?.toLowerCase() === accountId.toLowerCase()
      )
      .filter((asset) => chainIds.includes(asset.chainId))
      .sort(
        (a, b) =>
          Date.parse(b.metadata.created || '') -
          Date.parse(a.metadata.created || '')
      )

    if (nodeAssets.length === 0) {
      if (legacyResult) {
        legacyResult.results = legacyResult.results.slice(
          ((Number(page) || 1) - 1) * 9,
          (Number(page) || 1) * 9
        )
        legacyResult.page = Number(page) || 1
      }
      return legacyResult
    }
    if (!legacyResult)
      return {
        results: nodeAssets.slice(
          ((Number(page) || 1) - 1) * 9,
          (Number(page) || 1) * 9
        ),
        page: Number(page) || 1,
        totalResults: nodeAssets.length,
        totalPages: Math.ceil(nodeAssets.length / 9),
        aggregations: []
      }

    const legacyAssets = legacyResult.results || []
    const legacyIds = new Set(legacyAssets.map((asset) => asset.id))
    const newNodeAssets = nodeAssets.filter((asset) => !legacyIds.has(asset.id))
    if (newNodeAssets.length === 0) {
      legacyResult.results = legacyAssets.slice(
        ((Number(page) || 1) - 1) * 9,
        (Number(page) || 1) * 9
      )
      legacyResult.page = Number(page) || 1
      return legacyResult
    }

    const pageSize = 9
    const currentPage = Number(page) || 1
    const allVisibleAssets = [...newNodeAssets, ...legacyAssets]
    const totalResults = legacyResult.totalResults + newNodeAssets.length

    return {
      ...legacyResult,
      results: allVisibleAssets.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      ),
      page: currentPage,
      totalResults,
      totalPages: Math.ceil(totalResults / pageSize)
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      LoggerInstance.log(error.message)
    } else {
      LoggerInstance.error(error.message)
    }
  }
}

async function getTopPublishers(
  chainIds: number[],
  cancelToken: CancelToken,
  page?: number,
  type?: string,
  accesType?: string
): Promise<PagedAssets> {
  const filters: FilterTerm[] = []

  accesType !== undefined &&
    filters.push(getFilterTerm('services.type', accesType))
  type !== undefined && filters.push(getFilterTerm('metadata.type', type))

  const baseQueryParams = {
    chainIds,
    filters,
    sortOptions: {
      sortBy: SortTermOptions.Created,
      sortDirection: SortDirectionOptions.Descending
    },
    aggs: {
      topPublishers: {
        terms: {
          field: 'nft.owner.keyword',
          order: { totalSales: 'desc' }
        },
        aggs: {
          totalSales: {
            sum: {
              field: SortTermOptions.Orders
            }
          }
        }
      }
    },
    esPaginationOptions: {
      from: (Number(page) - 1 || 0) * 9,
      size: 9
    }
  } as BaseQueryParams

  const query = generateBaseQuery(baseQueryParams)

  try {
    const result = await queryMetadata(query, cancelToken)
    return result
  } catch (error) {
    if (axios.isCancel(error)) {
      LoggerInstance.log(error.message)
    } else {
      LoggerInstance.error(error.message)
    }
  }
}

export async function getTopAssetsPublishers(
  chainIds: number[],
  nrItems = 9
): Promise<UserSales[]> {
  const publishers: UserSales[] = []

  const result = await getTopPublishers(chainIds, null)
  const { topPublishers } = result.aggregations

  for (let i = 0; i < topPublishers.buckets.length; i++) {
    publishers.push({
      id: topPublishers.buckets[i].key,
      totalSales: parseInt(topPublishers.buckets[i].totalSales.value)
    })
  }

  publishers.sort((a, b) => b.totalSales - a.totalSales)

  return publishers.slice(0, nrItems)
}

export async function getUserSales(
  accountId: string,
  chainIds: number[]
): Promise<number> {
  try {
    const result = await getPublishedAssets(accountId, chainIds, null)
    const { totalOrders } = result.aggregations
    return totalOrders.value
  } catch (error) {
    LoggerInstance.error('Error getUserSales', error.message)
  }
}

export async function getDownloadAssets(
  dtList: string[],
  tokenOrders: OrdersData[],
  chainIds: number[],
  cancelToken: CancelToken,
  ignoreState = false
): Promise<DownloadedAsset[]> {
  const baseQueryparams = {
    chainIds,
    filters: [
      getFilterTerm('services.datatokenAddress', dtList),
      getFilterTerm('services.type', 'access')
    ],
    ignorePurgatory: true,
    ignoreState
  } as BaseQueryParams
  const query = generateBaseQuery(baseQueryparams)
  try {
    const result = await queryMetadata(query, cancelToken)
    const downloadedAssets: DownloadedAsset[] = result.results
      .map((asset) => {
        const order = tokenOrders.find(
          ({ datatoken }) =>
            datatoken?.address.toLowerCase() ===
            asset.services[0].datatokenAddress.toLowerCase()
        )

        return {
          asset,
          networkId: asset.chainId,
          dtSymbol: order?.datatoken?.symbol,
          timestamp: order?.createdTimestamp
        }
      })
      .sort((a, b) => b.timestamp - a.timestamp)

    return downloadedAssets
  } catch (error) {
    if (axios.isCancel(error)) {
      LoggerInstance.log(error.message)
    } else {
      LoggerInstance.error(error.message)
    }
  }
}

export async function getTagsList(
  chainIds: number[],
  cancelToken: CancelToken
): Promise<string[]> {
  const baseQueryParams = {
    chainIds,
    esPaginationOptions: { from: 0, size: 0 }
  } as BaseQueryParams
  const query = {
    ...generateBaseQuery(baseQueryParams),
    aggs: {
      tags: {
        terms: {
          field: 'metadata.tags.keyword',
          size: 1000
        }
      }
    }
  }

  try {
    const response: AxiosResponse<SearchResponse> = await axios.post(
      `${metadataCacheUri}/api/aquarius/assets/query`,
      { ...query },
      { cancelToken }
    )
    if (response?.status !== 200 || !response?.data) return
    const { buckets }: { buckets: AggregatedTag[] } =
      response.data.aggregations.tags

    const tagsList = buckets
      .filter((tag) => tag.key !== '')
      .map((tag) => tag.key)

    return tagsList.sort()
  } catch (error) {
    if (axios.isCancel(error)) {
      LoggerInstance.log(error.message)
    } else {
      LoggerInstance.error(error.message)
    }
  }
}
