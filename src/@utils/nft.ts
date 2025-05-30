import {
  LoggerInstance,
  Asset,
  getHash,
  Nft,
  ProviderInstance,
  DDO,
  MetadataAndTokenURI,
  NftCreateData,
  getErrorMessage
} from '@oceanprotocol/lib'
import { SvgWaves } from './SvgWaves'
import { customProviderUrl } from '../../app.config'
import { Signer, ethers } from 'ethers'
import { toast } from 'react-toastify'

// https://docs.opensea.io/docs/metadata-standards
export interface NftMetadata {
  name: string
  symbol: string
  description: string
  image?: string
  /* eslint-disable camelcase */
  external_url?: string
  image_data?: string
  background_color?: string
  /* eslint-enable camelcase */
}

function encodeSvg(svgString: string): string {
  return svgString
    .replace(
      '<svg',
      ~svgString.indexOf('xmlns')
        ? '<svg'
        : '<svg xmlns="http://www.w3.org/2000/svg"'
    )
    .replace('></path>', '/>')
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/{/g, '%7B')
    .replace(/}/g, '%7D')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\s+/g, ' ')
}

const nftMetadataTemplate = {
  name: 'PX Data NFT',
  symbol: 'PX-NFT',
  description: `Data NFTs are unique digital assets that represent the intellectual property of your digital services.`,
  external_url: 'https://cliox.org'
}

// Array of available logo options for rotation
const logoOptions = [
  '/images/cliox.svg',
  '/images/cliox_text.svg',
  '/images/cliox_icon.svg',
  '/images/cliox_horizontal.svg'
]

// Keep track of the last used logo to avoid repeating
let lastUsedLogoUrl = ''

export function generateNftMetadata(): NftMetadata {
  // Get available options excluding the last used logo
  const availableOptions = logoOptions.filter(
    (logo) => logo !== lastUsedLogoUrl
  )

  // Pick a random logo from the filtered options
  const randomIndex = Math.floor(Math.random() * availableOptions.length)
  const logoUrl = availableOptions[randomIndex]

  // Update the last used logo
  lastUsedLogoUrl = logoUrl

  const newNft: NftMetadata = {
    ...nftMetadataTemplate,
    background_color: 'ffffff', // white background
    image: logoUrl // Use image property with direct URL instead of image_data with encoded SVG
  }

  return newNft
}

const tokenUriPrefix = 'data:application/json;base64,'

export function generateNftCreateData(
  nftMetadata: NftMetadata,
  accountId: string,
  transferable = true
): NftCreateData {
  const nftCreateData: NftCreateData = {
    name: nftMetadata.name,
    symbol: nftMetadata.symbol,
    templateIndex: 1,
    tokenURI: '',
    transferable,
    owner: accountId
  }

  return nftCreateData
}

export function decodeTokenURI(tokenURI: string): NftMetadata {
  if (!tokenURI) return undefined

  try {
    const nftMeta = tokenURI.includes('data:application/json')
      ? (JSON.parse(
          Buffer.from(tokenURI.replace(tokenUriPrefix, ''), 'base64').toString()
        ) as NftMetadata)
      : ({ image: tokenURI } as NftMetadata)

    return nftMeta
  } catch (error) {
    LoggerInstance.error(`[NFT] ${error.message}`)
  }
}

export async function setNftMetadata(
  asset: Asset | DDO,
  accountId: string,
  signer: Signer,
  signal: AbortSignal
): Promise<ethers.providers.TransactionResponse> {
  let encryptedDdo
  try {
    encryptedDdo = await ProviderInstance.encrypt(
      asset,
      asset.chainId,
      customProviderUrl || asset.services[0].serviceEndpoint,
      signal
    )
  } catch (err) {
    const message = getErrorMessage(err.message)
    LoggerInstance.error('[Encrypt Data] Error:', message)
    toast.error(message)
  }
  LoggerInstance.log('[setNftMetadata] Got encrypted DDO', encryptedDdo)

  const metadataHash = getHash(JSON.stringify(asset))
  const nft = new Nft(signer)

  // theoretically used by aquarius or provider, not implemented yet, will remain hardcoded
  const flags = ethers.utils.hexlify(2)

  const setMetadataTx = await nft.setMetadata(
    asset.nftAddress,
    accountId,
    0,
    asset.services[0].serviceEndpoint,
    '',
    flags,
    encryptedDdo,
    '0x' + metadataHash
  )

  return setMetadataTx
}

export async function setNFTMetadataAndTokenURI(
  asset: Asset | DDO,
  accountId: string,
  signer: Signer,
  nftMetadata: NftMetadata | undefined,
  signal: AbortSignal
): Promise<ethers.providers.TransactionResponse> {
  let encryptedDdo
  try {
    encryptedDdo = await ProviderInstance.encrypt(
      asset,
      asset.chainId,
      customProviderUrl || asset.services[0].serviceEndpoint,
      signal
    )
  } catch (err) {
    const message = getErrorMessage(err.message)
    LoggerInstance.error('[Encrypt Data] Error:', message)
    toast.error(message)
  }
  LoggerInstance.log(
    '[setNFTMetadataAndTokenURI] Got encrypted DDO',
    encryptedDdo
  )

  const metadataHash = getHash(JSON.stringify(asset))

  // add final did to external_url and asset link to description in nftMetadata before encoding
  const externalUrl = `${
    nftMetadata?.external_url || nftMetadataTemplate.external_url
  }/asset/${asset.id}`
  //  TODO: restore to old structure where nftMetadata is always provided
  const encodedMetadata = Buffer.from(
    JSON.stringify(
      nftMetadata
        ? {
            ...nftMetadata,
            description: `${nftMetadata.description}`,
            external_url: externalUrl
          }
        : {
            name: (asset as AssetExtended).nft.name,
            symbol: (asset as AssetExtended).nft.symbol,
            description: `${nftMetadataTemplate.description}\n\nView on Pontus-X: ${externalUrl}`,
            external_url: externalUrl
          }
    )
  ).toString('base64')
  const nft = new Nft(signer)

  // theoretically used by aquarius or provider, not implemented yet, will remain hardcoded
  const flags = '0x02'

  const metadataAndTokenURI: MetadataAndTokenURI = {
    metaDataState: 0,
    metaDataDecryptorUrl: asset.services[0].serviceEndpoint,
    metaDataDecryptorAddress: '',
    flags,
    data: encryptedDdo,
    metaDataHash: '0x' + metadataHash,
    tokenId: 1,
    tokenURI: `data:application/json;base64,${encodedMetadata}`,
    metadataProofs: []
  }

  const setMetadataAndTokenURITx = await nft.setMetadataAndTokenURI(
    asset.nftAddress,
    accountId,
    metadataAndTokenURI
  )

  return setMetadataAndTokenURITx
}
