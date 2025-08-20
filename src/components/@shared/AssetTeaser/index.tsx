import { ReactElement } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Dotdotdot from 'react-dotdotdot'
import Price from '@shared/Price'
import removeMarkdown from 'remove-markdown'
import Publisher from '@shared/Publisher'
import AssetType from '@shared/AssetType'
import NetworkName from '@shared/NetworkName'
import { getServiceByName } from '@utils/ddo'
import { useUserPreferences } from '@context/UserPreferences'
import { formatNumber } from '@utils/numbers'

export declare type AssetTeaserProps = {
  asset: AssetExtended
  noPublisher?: boolean
  noDescription?: boolean
  noPrice?: boolean
}

export default function AssetTeaser({
  asset,
  noPublisher,
  noDescription
}: AssetTeaserProps): ReactElement {
  const { name, type, description } = asset.metadata
  const { datatokens } = asset
  const isCompute = Boolean(getServiceByName(asset, 'compute'))
  const accessType = isCompute ? 'compute' : 'access'
  const { owner } = asset.nft
  const { orders, allocated, price } = asset.stats
  const isUnsupportedPricing =
    !asset.services.length ||
    price.value === undefined ||
    asset?.accessDetails?.type === 'NOT_SUPPORTED'
  const { locale } = useUserPreferences()

  return (
    <motion.article
      className="max-w-2xl h-full min-h-[200px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Link
        href={`/asset/${asset.id}`}
        className="
          block h-full p-6 pt-4 pb-4 
          bg-white border border-gray-200 rounded-lg 
          shadow-sm hover:shadow-md transition-shadow duration-200
          flex flex-col relative text-sm text-gray-700
        "
      >
        <aside className="mb-2">
          <AssetType
            className="
              text-xs inline-block border-l border-gray-300 
              pl-2 ml-2 first:border-l-0 first:pl-0 first:ml-0
            "
            type={asset?.metadata?.additionalInformation?.saas ? 'saas' : type}
            accessType={
              asset?.metadata?.additionalInformation?.saas ? 'saas' : accessType
            }
          />
          <span
            className="
            text-[10px] inline-block border-l border-gray-300 
            pl-2 ml-2 first:border-l-0 first:pl-0 first:ml-0
          "
          >
            {datatokens[0]?.symbol.substring(0, 9)}
          </span>
        </aside>

        <header>
          <Dotdotdot
            tagName="h1"
            clamp={3}
            className="
              text-lg font-bold text-gray-900 m-0 pb-1 
              break-words hyphens-auto
            "
          >
            {name.slice(0, 200)}
          </Dotdotdot>
          {!noPublisher && (
            <Publisher account={owner} minimal showName={true} />
          )}
        </header>

        {!noDescription && (
          <div
            className="
            mt-2 break-words hyphens-auto flex-1
            [&_p]:mb-1 [&_p]:font-heading text-sm
          "
          >
            <Dotdotdot tagName="p" clamp={4}>
              {removeMarkdown(description?.substring(0, 400) || '')}
            </Dotdotdot>
          </div>
        )}

        <div className="mt-0.5">
          {isUnsupportedPricing ? (
            <strong>No pricing schema available</strong>
          ) : (
            <Price price={price} assetId={asset.id} size="small" />
          )}
        </div>

        <footer
          className="
          flex justify-between items-center mt-0.5
        "
        >
          <div className="flex flex-wrap gap-1">
            {allocated && allocated > 0 ? (
              <span
                className="
                text-xs inline-block border-l border-gray-300 
                pl-1 ml-1 first:border-l-0 first:pl-0 first:ml-0
              "
              >
                {allocated < 0 ? (
                  ''
                ) : (
                  <>
                    <strong>{formatNumber(allocated, locale, '0')}</strong>{' '}
                    veOCEAN
                  </>
                )}
              </span>
            ) : null}
            {orders && orders > 0 ? (
              <span
                className="
                text-xs inline-block border-l border-gray-300 
                pl-1 ml-1 first:border-l-0 first:pl-0 first:ml-0
              "
              >
                {orders < 0 ? (
                  'N/A'
                ) : (
                  <>
                    <strong>{orders}</strong> {orders === 1 ? 'sale' : 'sales'}
                  </>
                )}
              </span>
            ) : null}
            {asset.views && asset.views > 0 ? (
              <span
                className="
                text-xs inline-block border-l border-gray-300 
                pl-1 ml-1 first:border-l-0 first:pl-0 first:ml-0
              "
              >
                {asset.views < 0 ? (
                  'N/A'
                ) : (
                  <>
                    <strong>{asset.views}</strong>{' '}
                    {asset.views === 1 ? 'view' : 'views'}
                  </>
                )}
              </span>
            ) : null}
          </div>
          <NetworkName
            networkId={asset.chainId}
            className="min-w-max text-[10px]"
          />
        </footer>
      </Link>
    </motion.article>
  )
}
