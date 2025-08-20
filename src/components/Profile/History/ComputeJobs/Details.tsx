import { ReactElement, useEffect, useState } from 'react'
import Time from '@shared/atoms/Time'
import Button from '@shared/atoms/Button'
import Modal from '@shared/atoms/Modal'
import External from '@images/external.svg'
import { getAsset } from '@utils/aquarius'
import Results from './Results'
import { useCancelToken } from '@hooks/useCancelToken'
import MetaItem from '../../../Asset/AssetContent/MetaItem'
import { useMarketMetadata } from '@context/MarketMetadata'

function Asset({
  title,
  symbol,
  did
}: {
  title: string
  symbol: string
  did: string
}) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        {title}
        <a
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          href={`/asset/${did}`}
          target="_blank"
          rel="noreferrer"
        >
          <External className="w-4 h-4" />
        </a>
      </h3>
      <p className="text-sm text-gray-600">
        <span className="font-medium">{symbol}</span>
        <span className="mx-2">|</span>
        <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">
          {did}
        </code>
      </p>
    </div>
  )
}

function DetailsAssets({ job }: { job: ComputeJobMetaData }) {
  const { appConfig } = useMarketMetadata()
  const newCancelToken = useCancelToken()

  const [algoName, setAlgoName] = useState<string>()
  const [algoDtSymbol, setAlgoDtSymbol] = useState<string>()

  useEffect(() => {
    async function getAlgoMetadata() {
      try {
        const ddo = await getAsset(job.algoDID, newCancelToken())
        if (ddo && ddo.datatokens && ddo.datatokens[0]) {
          setAlgoDtSymbol(ddo.datatokens[0].symbol)
        }
        if (ddo && ddo.metadata && ddo.metadata.name) {
          setAlgoName(ddo.metadata.name)
        }
      } catch (error) {
        console.warn('Failed to fetch algo metadata:', error)
      }
    }
    getAlgoMetadata()
  }, [appConfig.metadataCacheUri, job.algoDID, newCancelToken])

  return (
    <>
      <Asset
        title={job.assetName}
        symbol={job.assetDtSymbol}
        did={job.inputDID[0]}
      />
      <Asset title={algoName} symbol={algoDtSymbol} did={job.algoDID} />
    </>
  )
}

export default function Details({
  job
}: {
  job: ComputeJobMetaData
}): ReactElement {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="text-xs font-medium text-emerald-700 hover:text-emerald-600 transition-colors duration-200 cursor-pointer"
      >
        Show Details
      </button>
      <Modal
        title={job.statusText}
        isOpen={isDialogOpen}
        onToggleModal={() => setIsDialogOpen(false)}
      >
        <DetailsAssets job={job} />
        <Results job={job} />

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <MetaItem
            title="Created"
            content={<Time date={job.dateCreated} isUnix relative />}
          />
          {job.dateFinished && (
            <MetaItem
              title="Finished"
              content={<Time date={job.dateFinished} isUnix relative />}
            />
          )}
        </div>
      </Modal>
    </>
  )
}
