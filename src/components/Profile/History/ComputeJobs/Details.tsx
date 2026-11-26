import { ReactElement, useEffect, useState } from 'react'
import Time from '@shared/atoms/Time'
import Button from '@shared/atoms/Button'
import Modal from '@shared/atoms/Modal'
import External from '@images/external.svg'
import { getAsset, getOceanNodeAsset } from '@utils/aquarius'
import Results from './Results'
import styles from './Details.module.css'
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
    <div className={styles.asset}>
      <h3 className={styles.assetTitle}>
        {title}{' '}
        {did && (
          <a
            className={styles.assetLink}
            href={`/asset/${did}`}
            target="_blank"
            rel="noreferrer"
          >
            <External />
          </a>
        )}
      </h3>
      <p className={styles.assetMeta}>
        {symbol && <span className={styles.assetMeta}> {`${symbol} | `}</span>}
        <code className={styles.assetMeta}>{did}</code>
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
      if (!job.algoDID) return
      const ddo = job.isOceanNodeJob
        ? await getOceanNodeAsset(job.algoDID, newCancelToken()).catch(
            () => undefined
          )
        : await getAsset(job.algoDID, newCancelToken())
      if (!ddo) return
      setAlgoDtSymbol(ddo.datatokens?.[0]?.symbol)
      setAlgoName(ddo.metadata?.name)
    }
    getAlgoMetadata()
  }, [
    appConfig.metadataCacheUri,
    job.algoDID,
    job.isOceanNodeJob,
    newCancelToken
  ])

  return (
    <>
      {job.inputDID?.[0] ? (
        <Asset
          title={job.assetName}
          symbol={job.assetDtSymbol}
          did={job.inputDID?.[0] ?? ''}
        />
      ) : (
        <p>
          The compute node did not report a dataset DID for this job. Its logs
          and results are still available below.
        </p>
      )}
      {job.algoDID && (
        <Asset
          title={algoName || job.algoDID}
          symbol={algoDtSymbol}
          did={job.algoDID}
        />
      )}
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
      <Button style="text" size="small" onClick={() => setIsDialogOpen(true)}>
        Show Details
      </Button>
      <Modal
        title={job.statusText}
        isOpen={isDialogOpen}
        onToggleModal={() => setIsDialogOpen(false)}
      >
        <DetailsAssets job={job} />
        <Results job={job} />

        <div className={styles.meta}>
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
          <MetaItem title="Job ID" content={<code>{job.jobId}</code>} />
        </div>
      </Modal>
    </>
  )
}
