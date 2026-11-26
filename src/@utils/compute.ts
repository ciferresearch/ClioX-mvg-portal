import {
  Asset,
  ServiceComputeOptions,
  PublisherTrustedAlgorithm,
  getHash,
  LoggerInstance,
  ComputeAlgorithm,
  DDO,
  Service,
  ProviderInstance,
  ComputeEnvironment,
  ComputeJob,
  getErrorMessage
} from '@oceanprotocol/lib'
import { CancelToken } from 'axios'
import { gql } from 'urql'
import {
  queryMetadata,
  getFilterTerm,
  generateBaseQuery,
  getAssetsFromDids,
  getOceanNodeAsset
} from './aquarius'
import { fetchDataForMultipleChains } from './subgraph'
import { getServiceById, getServiceByName } from './ddo'
import { SortTermOptions } from '../@types/aquarius/SearchQuery'
import { AssetSelectionAsset } from '@shared/FormInput/InputElement/AssetSelection'
import { transformAssetToAssetSelection } from './assetConvertor'
import { ComputeEditForm } from '../components/Asset/Edit/_types'
import { getFileDidInfo } from './provider'
import { toast } from 'react-toastify'
import { getNodeComputeAsset } from './nodeCompute'
import { getNodeComputeHistory } from './nodeComputeHistory'

const getComputeOrders = gql`
  query ComputeOrders($user: String!) {
    orders(
      orderBy: createdTimestamp
      orderDirection: desc
      where: { payer: $user }
    ) {
      id
      serviceIndex
      datatoken {
        address
      }
      tx
      createdTimestamp
    }
  }
`

const getComputeOrdersByDatatokenAddress = gql`
  query ComputeOrdersByDatatokenAddress(
    $user: String!
    $datatokenAddress: String!
  ) {
    orders(
      orderBy: createdTimestamp
      orderDirection: desc
      where: { payer: $user, datatoken: $datatokenAddress }
    ) {
      id
      serviceIndex
      datatoken {
        address
      }
      tx
      createdTimestamp
    }
  }
`

async function getAssetMetadata(
  queryDtList: string[],
  cancelToken: CancelToken,
  chainIds: number[]
): Promise<Asset[]> {
  const baseQueryparams = {
    chainIds,
    filters: [
      getFilterTerm('services.datatokenAddress', queryDtList),
      getFilterTerm('services.type', 'compute'),
      getFilterTerm('metadata.type', 'dataset')
    ],
    ignorePurgatory: true
  } as BaseQueryParams
  const query = generateBaseQuery(baseQueryparams)
  const result = await queryMetadata(query, cancelToken)
  return result?.results
}

export async function isOrderable(
  asset: Asset | DDO,
  serviceId: string,
  algorithm: ComputeAlgorithm,
  algorithmDDO: Asset | DDO
): Promise<boolean> {
  const datasetService: Service = getServiceById(asset, serviceId)
  if (!datasetService) return false

  if (datasetService.type === 'compute') {
    if (algorithm.meta) {
      // check if raw algo is allowed
      if (datasetService.compute.allowRawAlgorithm) return true
      LoggerInstance.error('ERROR: This service does not allow raw algorithm')
      return false
    }
    if (algorithm.documentId) {
      const algoService: Service = getServiceById(
        algorithmDDO,
        algorithm.serviceId
      )
      if (algoService && algoService.type === 'compute') {
        if (algoService.serviceEndpoint !== datasetService.serviceEndpoint) {
          this.logger.error(
            'ERROR: Both assets with compute service are not served by the same provider'
          )
          return false
        }
      }
    }
  }
  return true
}

export function getValidUntilTime(
  computeEnvMaxJobDuration: number,
  datasetTimeout?: number,
  algorithmTimeout?: number
) {
  const inputValues = []
  computeEnvMaxJobDuration && inputValues.push(computeEnvMaxJobDuration)
  datasetTimeout && inputValues.push(datasetTimeout)
  algorithmTimeout && inputValues.push(algorithmTimeout)

  const minValue = Math.min(...inputValues)
  const mytime = new Date()
  mytime.setMinutes(mytime.getMinutes() + Math.floor(minValue / 60))
  return Math.floor(mytime.getTime() / 1000)
}

export async function getComputeEnvironment(
  asset: Asset
): Promise<ComputeEnvironment> {
  if (asset?.services[0]?.type !== 'compute') return null
  try {
    const computeEnvs = await ProviderInstance.getComputeEnvironments(
      asset.services[0].serviceEndpoint
    )
    const computeEnv = Array.isArray(computeEnvs)
      ? computeEnvs[0]
      : computeEnvs[asset.chainId][0]

    if (!computeEnv) return null
    return computeEnv
  } catch (e) {
    const message = getErrorMessage(e.message)
    LoggerInstance.error(
      '[Compute to Data] Fetch compute environment:',
      message
    )
    toast.error(message)
  }
}

export function getQueryString(
  trustedAlgorithmList: PublisherTrustedAlgorithm[],
  trustedPublishersList: string[],
  chainId?: number
): SearchQuery {
  const algorithmDidList = trustedAlgorithmList?.map((x) => x.did)

  const baseParams = {
    chainIds: [chainId],
    sort: { sortBy: SortTermOptions.Created },
    filters: [getFilterTerm('metadata.type', 'algorithm')],
    esPaginationOptions: {
      size: 3000
    }
  } as BaseQueryParams
  algorithmDidList?.length > 0 &&
    baseParams.filters.push(getFilterTerm('_id', algorithmDidList))
  trustedPublishersList?.length > 0 &&
    baseParams.filters.push(
      getFilterTerm(
        'nft.owner',
        trustedPublishersList.map((address) => address.toLowerCase())
      )
    )
  const query = generateBaseQuery(baseParams)

  return query
}

export async function getAlgorithmsForAsset(
  asset: Asset,
  token: CancelToken
): Promise<Asset[]> {
  const computeService: Service = getServiceByName(asset, 'compute')

  if (
    !computeService.compute ||
    (computeService.compute.publisherTrustedAlgorithms?.length === 0 &&
      computeService.compute.publisherTrustedAlgorithmPublishers?.length === 0)
  ) {
    return []
  }

  const gueryResults = await queryMetadata(
    getQueryString(
      computeService.compute.publisherTrustedAlgorithms,
      computeService.compute.publisherTrustedAlgorithmPublishers,
      asset.chainId
    ),
    token
  )
  const algorithms: Asset[] = gueryResults?.results
  return algorithms
}

export async function getAlgorithmAssetSelectionList(
  asset: Asset,
  algorithms: Asset[],
  accountId: string
): Promise<AssetSelectionAsset[]> {
  if (!algorithms || algorithms?.length === 0) return []

  const computeService: Service = getServiceByName(asset, 'compute')
  let algorithmSelectionList: AssetSelectionAsset[]
  if (!computeService.compute) {
    algorithmSelectionList = []
  } else {
    algorithmSelectionList = await transformAssetToAssetSelection(
      computeService?.serviceEndpoint,
      algorithms,
      accountId,
      []
    )
  }
  return algorithmSelectionList
}

async function getJobs(
  providerUrls: string[],
  accountId: string,
  assets: Asset[]
): Promise<ComputeJobMetaData[]> {
  const uniqueProviders = [...new Set(providerUrls)]
  const providersComputeJobsExtended: ComputeJobExtended[] = []
  const computeJobs: ComputeJobMetaData[] = []

  try {
    for (let i = 0; i < uniqueProviders.length; i++) {
      const providerComputeJobs = (await ProviderInstance.computeStatus(
        uniqueProviders[i],
        accountId
      )) as ComputeJob[]

      providerComputeJobs.forEach((job) =>
        providersComputeJobsExtended.push({
          ...job,
          providerUrl: uniqueProviders[i]
        })
      )
    }

    if (providersComputeJobsExtended) {
      providersComputeJobsExtended.sort((a, b) => {
        if (a.dateCreated > b.dateCreated) {
          return -1
        }
        if (a.dateCreated < b.dateCreated) {
          return 1
        }
        return 0
      })

      providersComputeJobsExtended.forEach((job) => {
        const did = job.inputDID[0]
        const asset = assets.filter((x) => x.id === did)[0]
        if (asset) {
          const compJob: ComputeJobMetaData = {
            ...job,
            assetName: asset.metadata.name,
            assetDtSymbol: asset.datatokens[0].symbol,
            networkId: asset.chainId
          }
          computeJobs.push(compJob)
        }
      })
    }
  } catch (err) {
    const message = getErrorMessage(err.message)
    LoggerInstance.error('[Compute to Data] Error:', message)
    toast.error(message)
  }
  return computeJobs
}

/**
 * in case multiple providers return the same computeJob, filter these duplicates
 * e.g. same instance listens on multiple domains
 */
export function filterForUniqueJobs(
  jobs: ComputeJobMetaData[],
  assets: Asset[]
): ComputeJobMetaData[] {
  return jobs.filter((job) => {
    const { inputDID, providerUrl } = job

    // compare providerUrl where the job status was accessed from
    // with the serviceEndpoint found in asset with first inputDID
    const inputAsset = assets.find((asset) => asset.id === inputDID[0])
    return providerUrl === inputAsset?.services[0]?.serviceEndpoint
  })
}

async function getLegacyComputeJobs(
  chainIds: number[],
  accountId: string,
  asset?: AssetExtended,
  cancelToken?: CancelToken
): Promise<ComputeResults> {
  if (!accountId) return
  const assetDTAddress = asset?.datatokens[0]?.address
  const computeResult: ComputeResults = {
    computeJobs: [],
    isLoaded: false
  }
  const variables = assetDTAddress
    ? {
        user: accountId.toLowerCase(),
        datatokenAddress: assetDTAddress.toLowerCase()
      }
    : {
        user: accountId.toLowerCase()
      }

  const results = await fetchDataForMultipleChains(
    assetDTAddress ? getComputeOrdersByDatatokenAddress : getComputeOrders,
    variables,
    assetDTAddress ? [asset?.chainId] : chainIds
  )

  let tokenOrders: TokenOrder[] = []
  results.map((result) =>
    result.orders.forEach((tokenOrder: TokenOrder) =>
      tokenOrders.push(tokenOrder)
    )
  )
  if (tokenOrders.length === 0) {
    computeResult.isLoaded = true
    return computeResult
  }

  tokenOrders = tokenOrders.sort(
    (a, b) => b.createdTimestamp - a.createdTimestamp
  )

  const datatokenAddressList = tokenOrders.map(
    (tokenOrder: TokenOrder) => tokenOrder.datatoken.address
  )
  if (!datatokenAddressList) return

  const assets = await getAssetMetadata(
    datatokenAddressList,
    cancelToken,
    chainIds
  )

  const providerUrls: string[] = []
  assets.forEach((asset: Asset) =>
    providerUrls.push(asset.services[0].serviceEndpoint)
  )

  const allProviderJobs = await getJobs(providerUrls, accountId, assets)
  computeResult.computeJobs = filterForUniqueJobs(allProviderJobs, assets)

  computeResult.isLoaded = true

  return computeResult
}

export async function getComputeJobs(
  chainIds: number[],
  accountId: string,
  asset?: AssetExtended,
  cancelToken?: CancelToken
): Promise<ComputeResults> {
  if (!accountId) return { computeJobs: [], isLoaded: true }
  const selectedChains = asset ? [asset.chainId] : chainIds
  const legacyChains = selectedChains.filter((id) => id !== 11155420)
  const tasks: { name: string; promise: Promise<ComputeJobMetaData[]> }[] = []
  if (legacyChains.length)
    tasks.push({
      name: 'Legacy compute history',
      promise: getLegacyComputeJobs(
        legacyChains,
        accountId,
        asset,
        cancelToken
      ).then((result) => result?.computeJobs || [])
    })
  if (
    process.env.NEXT_PUBLIC_ENABLE_OP_SEPOLIA === 'true' &&
    selectedChains.includes(11155420)
  )
    tasks.push({
      name: 'AgrospAI compute history',
      promise: getNodeComputeHistory(accountId, asset?.id, cancelToken)
    })
  const results = await Promise.allSettled(tasks.map((task) => task.promise))
  const jobs: ComputeJobMetaData[] = []
  const errors: string[] = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') jobs.push(...result.value)
    else
      errors.push(
        `${tasks[index].name}: ${result.reason?.message || 'request failed'}`
      )
  })
  const unique = [
    ...new Map(
      jobs.map((job) => [`${job.providerUrl}:${job.jobId}`, job])
    ).values()
  ]
  return {
    computeJobs: unique.sort(
      (a, b) => Number(b.dateCreated) - Number(a.dateCreated)
    ),
    isLoaded: true,
    error: errors.length ? errors.join('; ') : undefined
  }
}

export async function createTrustedAlgorithmList(
  selectedAlgorithms: string[], // list of DIDs,
  assetChainId: number,
  cancelToken: CancelToken
): Promise<PublisherTrustedAlgorithm[]> {
  const trustedAlgorithms: PublisherTrustedAlgorithm[] = []

  // Condition to prevent app from hitting Aquarius with empty DID list
  // when nothing is selected in the UI.
  if (!selectedAlgorithms || selectedAlgorithms.length === 0)
    return trustedAlgorithms

  // OP Sepolia permissions must not depend on the legacy Aquarius search cache.
  // Read DDOs directly from ClioX; the compute provider is checked separately.
  const selectedAssets =
    assetChainId === 11155420
      ? await Promise.all(
          selectedAlgorithms.map((did) => getOceanNodeAsset(did, cancelToken))
        )
      : await getAssetsFromDids(selectedAlgorithms, [assetChainId], cancelToken)
  if (!selectedAssets || selectedAssets.length === 0) return []

  for (const selectedAlgorithm of selectedAssets) {
    // The checksums and container must describe the same provider's current DDO,
    // particularly just after an algorithm image update is indexed.
    const verifiedAlgorithm = selectedAlgorithm
    if (
      assetChainId === 11155420 &&
      (verifiedAlgorithm.metadata.type !== 'algorithm' ||
        !verifiedAlgorithm.metadata.algorithm?.container?.entrypoint ||
        !verifiedAlgorithm.metadata.algorithm.container.checksum)
    )
      throw new Error(
        `${verifiedAlgorithm.id}: the Node did not return a complete algorithm asset. Permissions were not changed.`
      )
    if (assetChainId === 11155420) {
      if (verifiedAlgorithm.chainId !== assetChainId)
        throw new Error(
          `${verifiedAlgorithm.id}: select an OP Sepolia algorithm.`
        )
      const providerAsset = await getNodeComputeAsset(verifiedAlgorithm.id)
      const localService = verifiedAlgorithm.services[0]
      const providerService = providerAsset.services.find(
        (service) => service.id === localService.id
      )
      const localContainer = verifiedAlgorithm.metadata.algorithm.container
      const providerContainer = providerAsset.metadata.algorithm?.container
      if (
        !providerService ||
        providerService.files !== localService.files ||
        ['entrypoint', 'checksum', 'image', 'tag'].some(
          (key) => localContainer[key] !== providerContainer?.[key]
        )
      )
        throw new Error(
          `${verifiedAlgorithm.id}: ClioX and AgrospAI have not synchronized the algorithm update. Wait for indexing before saving permissions; no transaction was sent.`
        )
    }
    const filesChecksum = await getFileDidInfo(
      verifiedAlgorithm?.id,
      verifiedAlgorithm?.services?.[0].id,
      verifiedAlgorithm?.services?.[0]?.serviceEndpoint,
      true
    )
    if (
      assetChainId === 11155420 &&
      (!filesChecksum?.length ||
        filesChecksum.some((file) => !file.valid || !file.checksum))
    )
      throw new Error(
        `Could not verify algorithm files for ${selectedAlgorithm.id}. Compute permissions were not changed.`
      )
    const containerChecksum =
      verifiedAlgorithm.metadata.algorithm.container.entrypoint +
      verifiedAlgorithm.metadata.algorithm.container.checksum
    const trustedAlgorithm = {
      did: selectedAlgorithm.id,
      containerSectionChecksum: getHash(containerChecksum),
      filesChecksum:
        assetChainId === 11155420
          ? filesChecksum.map((file) => file.checksum).join('')
          : filesChecksum?.[0]?.checksum
    }
    trustedAlgorithms.push(trustedAlgorithm)
  }
  return trustedAlgorithms
}

export async function transformComputeFormToServiceComputeOptions(
  values: ComputeEditForm,
  currentOptions: ServiceComputeOptions,
  assetChainId: number,
  cancelToken: CancelToken
): Promise<ServiceComputeOptions> {
  const publisherTrustedAlgorithms = values.allowAllPublishedAlgorithms
    ? assetChainId === 11155420
      ? [{ did: '*', filesChecksum: '*', containerSectionChecksum: '*' }]
      : null
    : await createTrustedAlgorithmList(
        values.publisherTrustedAlgorithms,
        assetChainId,
        cancelToken
      )

  // TODO: add support for selecting trusted publishers and transforming here.
  // This only deals with basics so we don't accidentially allow all accounts
  // to be trusted.
  const publisherTrustedAlgorithmPublishers: string[] =
    assetChainId === 11155420
      ? currentOptions.publisherTrustedAlgorithmPublishers || []
      : []

  const privacy: ServiceComputeOptions = {
    ...currentOptions,
    publisherTrustedAlgorithms,
    publisherTrustedAlgorithmPublishers
  }

  return privacy
}

export async function addNodeTrustedAlgorithm(
  currentOptions: ServiceComputeOptions,
  did: string,
  cancelToken: CancelToken
): Promise<ServiceComputeOptions> {
  const permissions = await createTrustedAlgorithmList(
    [did],
    11155420,
    cancelToken
  )
  if (permissions.length !== 1)
    throw new Error(
      'The selected algorithm could not be verified. Permissions were not changed.'
    )
  return {
    ...currentOptions,
    publisherTrustedAlgorithms: [
      ...(currentOptions?.publisherTrustedAlgorithms || []).filter(
        (entry) => entry.did !== did
      ),
      permissions[0]
    ]
  }
}
