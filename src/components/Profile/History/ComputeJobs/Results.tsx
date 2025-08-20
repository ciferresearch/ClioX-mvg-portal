import {
  ComputeResultType,
  downloadFileBrowser,
  getErrorMessage,
  LoggerInstance,
  Provider
} from '@oceanprotocol/lib'
import { ReactElement, useEffect, useState } from 'react'
import { ListItem } from '@shared/atoms/Lists'
import Button from '@shared/atoms/Button'
import FormHelp from '@shared/FormInput/Help'
import content from '../../../../../content/pages/history.json'
import { useCancelToken } from '@hooks/useCancelToken'
import { getAsset } from '@utils/aquarius'
import { useAccount, useSigner } from 'wagmi'
import { toast } from 'react-toastify'
import { prettySize } from '@components/@shared/FormInput/InputElement/FilesInput/utils'
import { useAutomation } from '../../../../@context/Automation/AutomationProvider'

export default function Results({
  job
}: {
  job: ComputeJobMetaData
}): ReactElement {
  const providerInstance = new Provider()
  const { address: accountId } = useAccount()
  const { autoWallet } = useAutomation()
  const { data: signer } = useSigner()

  const [datasetProvider, setDatasetProvider] = useState<string>()
  const newCancelToken = useCancelToken()

  const isFinished = job.dateFinished !== null

  useEffect(() => {
    async function getAssetMetadata() {
      const ddo = await getAsset(job.inputDID[0], newCancelToken())
      setDatasetProvider(ddo.services[0].serviceEndpoint)
    }
    getAssetMetadata()
  }, [job.inputDID, newCancelToken])

  function getDownloadButtonValue(
    type: ComputeResultType,
    name: string
  ): string {
    let buttonName
    switch (type) {
      case 'output':
        buttonName = `RESULTS (${name})`
        break
      case 'algorithmLog':
        buttonName = 'ALGORITHM LOGS'
        break
      case 'configrationLog':
        buttonName = 'CONFIGURATION LOGS'
        break
      case 'publishLog':
        buttonName = 'PUBLISH LOGS'
        break
      default:
        buttonName = `RESULTS (${name})`
        break
    }
    return buttonName
  }

  async function downloadResults(resultIndex: number) {
    if (!accountId || !job) return

    const signerToUse =
      job.owner.toLowerCase() === autoWallet?.address.toLowerCase()
        ? autoWallet
        : signer

    try {
      const jobResult = await providerInstance.getComputeResultUrl(
        datasetProvider,
        signerToUse,
        job.jobId,
        resultIndex
      )
      await downloadFileBrowser(jobResult)
    } catch (error) {
      const message = getErrorMessage(error.message)
      LoggerInstance.error('[Provider Get c2d results url] Error:', message)
      toast.error(message)
    }
  }

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Results</h4>
      {isFinished ? (
        <ul className="space-y-3">
          {job.results &&
            Array.isArray(job.results) &&
            job.results.map((jobResult, i) =>
              jobResult.filename ? (
                <div key={i} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {getDownloadButtonValue(
                          jobResult.type,
                          jobResult.filename
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Size: {prettySize(jobResult.filesize)}
                      </div>
                    </div>
                    <Button
                      size="small"
                      onClick={() => downloadResults(i)}
                      className="ml-4 hover:bg-blue-600 transition-colors duration-200"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ) : null
            )}
        </ul>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FormHelp>Waiting for results...</FormHelp>
        </div>
      )}
    </div>
  )
}
