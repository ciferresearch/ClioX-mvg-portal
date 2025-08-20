import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getAssetsNames } from '@utils/aquarius'
import axios from 'axios'
import { Asset } from '@oceanprotocol/lib'
import { useMarketMetadata } from '@context/MarketMetadata'

export default function AssetListTitle({
  asset,
  did,
  title
}: {
  asset?: Asset
  did?: string
  title?: string
}): ReactElement {
  const { appConfig } = useMarketMetadata()
  const [assetTitle, setAssetTitle] = useState<string>(title)

  useEffect(() => {
    if (title || !appConfig.metadataCacheUri) return
    if (asset) {
      setAssetTitle(asset.metadata.name)
      return
    }

    const source = axios.CancelToken.source()

    async function getAssetName() {
      const title = await getAssetsNames([did], source.token)
      setAssetTitle(title[did])
    }

    !asset && did && getAssetName()

    return () => {
      source.cancel()
    }
  }, [assetTitle, appConfig.metadataCacheUri, asset, did, title])

  return (
    <motion.h3
      className="inline m-0 leading-normal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/asset/${did || asset?.id}`}
        className="
          text-base text-gray-900 
          hover:text-teal-700 hover:opacity-80
          transition-colors duration-200
        "
      >
        {assetTitle}
      </Link>
    </motion.h3>
  )
}
