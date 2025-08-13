import { LoggerInstance, ProviderInstance } from '@oceanprotocol/lib'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useAccount, useSigner } from 'wagmi'
import { useAutomation } from '../../@context/Automation/AutomationProvider'
import { useUseCases } from '../../@context/UseCases'
import { CameroonGazetteUseCaseData } from '../../@context/UseCases/models/CameroonGazette.model'
import { useUserPreferences } from '../../@context/UserPreferences'
import { useCancelToken } from '../../@hooks/useCancelToken'
import { getAsset } from '../../@utils/aquarius'
import { getComputeJobs } from '../../@utils/compute'
import Accordion from '../@shared/Accordion'
import Button from '../@shared/atoms/Button'
import ComputeJobs, { GetCustomActions } from '../Profile/History/ComputeJobs'
import styles from './JobList.module.css'
import {
  CAMEROON_GAZETTE_ALGO_DIDS,
  CAMEROON_GAZETTE_RESULT_ZIP
} from './_constants'
import { CameroonGazetteResult } from './_types'

export default function JobList(props: {
  setCameroonGazetteData: (
    cameroonGazetteData: CameroonGazetteUseCaseData[]
  ) => void
}): ReactElement {
  const { chainIds } = useUserPreferences()
  const cameroonGazetteAlgoDids: string[] = Object.values(
    CAMEROON_GAZETTE_ALGO_DIDS
  )

  const { address: accountId } = useAccount()
  const { data: signer } = useSigner()
  const { autoWallet } = useAutomation()

  // const { fileName: resultFileName } = TEXT_ANALYSIS_RESULT_ZIP

  const [jobs, setJobs] = useState<ComputeJobMetaData[]>([])
  const [refetchJobs, setRefetchJobs] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const newCancelToken = useCancelToken()

  const { setCameroonGazetteData } = props

  const {
    cameroonGazetteList,
    clearCameroonGazette,
    createOrUpdateCameroonGazette,
    deleteCameroonGazette
  } = useUseCases()

  const [activeJobId, setActiveJobId] = useState<string>(
    typeof window !== 'undefined'
      ? sessionStorage.getItem('cameroonGazette.activeJobId') || ''
      : ''
  )

  useEffect(() => {
    if (!cameroonGazetteList) {
      setCameroonGazetteData([])
      return
    }

    if (activeJobId) {
      const row = cameroonGazetteList.find((r) => r.job.jobId === activeJobId)
      if (row) {
        setCameroonGazetteData([row])
        return
      }
    }

    setCameroonGazetteData([])
  }, [cameroonGazetteList, activeJobId, setCameroonGazetteData])

  const fetchJobs = useCallback(async () => {
    if (!accountId) {
      return
    }

    try {
      setIsLoadingJobs(true)
      // Fetch computeJobs for all selected networks (UserPreferences)
      const computeJobs = await getComputeJobs(
        chainIds,
        accountId,
        null,
        newCancelToken()
      )
      if (autoWallet) {
        const autoComputeJobs = await getComputeJobs(
          chainIds,
          autoWallet?.address,
          null,
          newCancelToken()
        )
        autoComputeJobs.computeJobs.forEach((job) => {
          computeJobs.computeJobs.push(job)
        })
      }

      setJobs(
        // Filter computeJobs for dids configured in _constants
        computeJobs.computeJobs.filter(
          (job) =>
            cameroonGazetteAlgoDids.includes(job.algoDID) && job.status === 70

          // TODO: Uncomment this when the resultFileName is available
          // job.results.filter((result) => result.filename === resultFileName)
          // .length > 0
        )
      )
      setIsLoadingJobs(!computeJobs.isLoaded)
    } catch (error) {
      LoggerInstance.error(error.message)
      setIsLoadingJobs(false)
    }
  }, [
    chainIds,
    cameroonGazetteAlgoDids,
    accountId,
    autoWallet,
    // resultFileName,
    newCancelToken
  ])

  useEffect(() => {
    fetchJobs()
  }, [refetchJobs, chainIds])

  const addComputeResultToUseCaseDB = async (job: ComputeJobMetaData) => {
    if (cameroonGazetteList.find((row) => row.job.jobId === job.jobId)) {
      toast.info('This compute job result already is part of the map view.')
      return
    }

    try {
      const datasetDDO = await getAsset(job.inputDID[0], newCancelToken())
      const signerToUse =
        job.owner.toLowerCase() === autoWallet?.address.toLowerCase()
          ? autoWallet
          : signer

      const resultFiles = job.results.slice(0, 5)
      const results = []

      for (let i = 0; i < resultFiles.length; i++) {
        const url = await ProviderInstance.getComputeResultUrl(
          datasetDDO.services[0].serviceEndpoint,
          signerToUse,
          job.jobId,
          i
        )

        const response = await fetch(url)
        const content = await response.text()

        results.push({
          filename: resultFiles[i].filename,
          url,
          content
        })

        // add time delay to avoid nonce collision
        if (i < resultFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200)) // time delay
        }
      }

      const textAnalysisResults: CameroonGazetteResult[] = results.map(
        (file) => {
          const { filename, content: fileContent } = file
          const filenameLower = filename.toLowerCase()
          let content = fileContent

          if (filenameLower.endsWith('.json')) {
            try {
              content = JSON.parse(fileContent)
            } catch (error) {
              console.error('Error parsing JSON content:', error)
              return {}
            }
          }

          const result: CameroonGazetteResult = {}

          if (
            filenameLower.includes('wordcloud') ||
            filenameLower.includes('word_cloud')
          ) {
            result.wordcloud = content
          } else if (filenameLower.includes('sentiment')) {
            try {
              let parsedContent
              if (typeof content === 'string') {
                parsedContent = JSON.parse(content)
              } else if (typeof content === 'object' && content !== null) {
                parsedContent = content
              } else {
                console.warn('Invalid sentiment content type:', typeof content)
                return result
              }

              if (!Array.isArray(parsedContent)) {
                console.warn(
                  'Sentiment data should be an array of sentiment categories'
                )
                return result
              }

              const validSentimentData = parsedContent.every((category) => {
                return (
                  typeof category === 'object' &&
                  category !== null &&
                  typeof category.name === 'string' &&
                  Array.isArray(category.values) &&
                  category.values.every(
                    (value) =>
                      Array.isArray(value) &&
                      (value.length === 2 || value.length === 3) &&
                      typeof value[0] === 'string' &&
                      typeof value[1] === 'number' &&
                      !isNaN(value[1]) &&
                      (value.length === 2 ||
                        (Array.isArray(value[2]) &&
                          value[2].every((v) => typeof v === 'string')))
                  )
                )
              })

              if (!validSentimentData) {
                console.warn('Invalid sentiment data structure:', parsedContent)
                return result
              }

              result.sentiment = parsedContent
            } catch (error) {
              console.error('Error processing sentiment data:', error)
              return result
            }
          } else if (filenameLower.includes('date_distribution')) {
            result.dataDistribution = content
          } else if (filenameLower.includes('email_distribution')) {
            result.emailDistribution = content
          } else if (filenameLower.includes('document_summary')) {
            result.documentSummary = content
          }

          return result
        }
      )

      const newuseCaseData: CameroonGazetteUseCaseData = {
        job,
        result: textAnalysisResults
      }

      await createOrUpdateCameroonGazette(newuseCaseData)
      setActiveJobId(job.jobId)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cameroonGazette.activeJobId', job.jobId)
      }
      setCameroonGazetteData([newuseCaseData])
      toast.success('Added a new compute result')
    } catch (error) {
      LoggerInstance.error(error)
      toast.error('Could not add compute result')
    }
  }

  const viewJobResult = (job: ComputeJobMetaData) => {
    setActiveJobId(job.jobId)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cameroonGazette.activeJobId', job.jobId)
    }
    const row = cameroonGazetteList?.find((r) => r.job.jobId === job.jobId)
    if (row) {
      setCameroonGazetteData([row])
    } else {
      setCameroonGazetteData([])
    }
  }

  const deleteJobResultFromDB = async (job: ComputeJobMetaData) => {
    if (
      !confirm(`Are you sure you want to delete the result from visualization?`)
    )
      return

    const rowToDelete = cameroonGazetteList.find(
      (row) => row.job.jobId === job.jobId
    )
    if (!rowToDelete) return

    await deleteCameroonGazette(rowToDelete.id)
    if (activeJobId === job.jobId) {
      setActiveJobId('')
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cameroonGazette.activeJobId')
      }
      setCameroonGazetteData([])
    }
    toast.success(`Removed compute job result from visualization.`)
  }

  const clearData = async () => {
    if (!confirm('All data will be removed from your cache. Proceed?')) return

    await clearCameroonGazette()
    setActiveJobId('')
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cameroonGazette.activeJobId')
    }
    setCameroonGazetteData([])
    toast.success('Cameroon Gazette data was cleared.')
  }

  const getCustomActionsPerComputeJob: GetCustomActions = (
    job: ComputeJobMetaData
  ) => {
    const isActive = activeJobId === job.jobId
    const viewAction = {
      label: isActive ? 'Viewing' : 'View',
      onClick: () => {
        if (!isActive) viewJobResult(job)
      }
    }
    const cacheAndViewAction = {
      label: 'Cache & View',
      onClick: () => {
        addComputeResultToUseCaseDB(job)
      }
    }
    const deleteAction = {
      label: 'Remove',
      onClick: () => {
        deleteJobResultFromDB(job)
      }
    }

    const viewContainsResult = cameroonGazetteList.find(
      (row) => row.job.jobId === job.jobId
    )

    const actionArray = []

    if (!viewContainsResult) {
      actionArray.push(cacheAndViewAction)
    } else if (isActive) {
      actionArray.push(viewAction)
      actionArray.push(deleteAction)
    } else {
      actionArray.push(viewAction)
      actionArray.push(deleteAction)
    }

    return actionArray
  }

  return (
    <div className={styles.accordionWrapper}>
      <Accordion title="Compute Jobs" defaultExpanded>
        <ComputeJobs
          jobs={jobs}
          isLoading={isLoadingJobs}
          refetchJobs={() => setRefetchJobs(!refetchJobs)}
          getActions={getCustomActionsPerComputeJob}
          hideDetails
        />

        <div className={styles.actions}>
          <Button
            onClick={() => clearData()}
            disabled={!cameroonGazetteList?.length}
          >
            Clear Data
          </Button>
        </div>
      </Accordion>
    </div>
  )
}
