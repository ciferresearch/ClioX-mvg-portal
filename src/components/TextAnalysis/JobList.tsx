import { LoggerInstance, ProviderInstance } from '@oceanprotocol/lib'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import {
  showUploadingToast,
  updateToastError,
  updateToastSuccess
} from '../../@utils/toast'
import { useAccount, useSigner } from 'wagmi'
import { useAutomation } from '../../@context/Automation/AutomationProvider'
import { useUseCases } from '../../@context/UseCases'
import { TextAnalysisUseCaseData } from '../../@context/UseCases/models/TextAnalysis.model'
import { useUserPreferences } from '../../@context/UserPreferences'
import { useCancelToken } from '../../@hooks/useCancelToken'
import { getAsset } from '../../@utils/aquarius'
import { getComputeJobs } from '../../@utils/compute'
import Accordion from '../@shared/Accordion'
import Button from '../@shared/atoms/Button'
import ComputeJobs, { GetCustomActions } from '../Profile/History/ComputeJobs'
import styles from './JobList.module.css'
import { TEXT_ANALYSIS_ALGO_DIDS } from './_constants'
import { TextAnalysisResult } from './_types'

export default function JobList(props: {
  setTextAnalysisData: (textAnalysisData: TextAnalysisUseCaseData[]) => void
}): ReactElement {
  const { chainIds } = useUserPreferences()
  const textAnalysisAlgoDids: string[] = Object.values(TEXT_ANALYSIS_ALGO_DIDS)

  const { address: accountId } = useAccount()
  const { data: signer } = useSigner()
  const { autoWallet } = useAutomation()

  // const { fileName: resultFileName } = TEXT_ANALYSIS_RESULT_ZIP

  const [jobs, setJobs] = useState<ComputeJobMetaData[]>([])
  const [refetchJobs, setRefetchJobs] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const newCancelToken = useCancelToken()

  const { setTextAnalysisData } = props

  const { textAnalysisList, clearTextAnalysis, createOrUpdateTextAnalysis } =
    useUseCases()

  const [activeJobId, setActiveJobId] = useState<string>(
    typeof window !== 'undefined'
      ? sessionStorage.getItem('textAnalysis.activeJobId') || ''
      : ''
  )

  useEffect(() => {
    if (!textAnalysisList) {
      setTextAnalysisData([])
      return
    }

    if (activeJobId) {
      const row = textAnalysisList.find((r) => r.job.jobId === activeJobId)
      if (row) {
        setTextAnalysisData([row])
        return
      }
    }

    setTextAnalysisData([])
  }, [textAnalysisList, activeJobId, setTextAnalysisData])

  const fetchJobs = useCallback(async () => {
    if (!accountId) return

    try {
      setIsLoadingJobs(true)

      const baseRes = await getComputeJobs(
        chainIds,
        accountId,
        null,
        newCancelToken()
      )

      let merged = baseRes?.computeJobs || []
      let loaded = baseRes?.isLoaded

      const autoAddr = autoWallet?.address
      if (autoAddr && autoAddr.toLowerCase() !== accountId.toLowerCase()) {
        const autoRes = await getComputeJobs(
          chainIds,
          autoAddr,
          null,
          newCancelToken()
        )
        merged = merged.concat(autoRes?.computeJobs || [])
        loaded = loaded && autoRes?.isLoaded
      }

      const deduped = Array.from(
        new Map(merged.map((j) => [j.jobId, j])).values()
      )
      const filtered = deduped.filter(
        (job) => textAnalysisAlgoDids.includes(job.algoDID) && job.status === 70
      )
      setJobs(filtered)
      setIsLoadingJobs(!loaded)
    } catch (error) {
      LoggerInstance.error(error.message)
      setIsLoadingJobs(false)
    }
  }, [
    chainIds,
    textAnalysisAlgoDids,
    accountId,
    autoWallet,
    // resultFileName,
    newCancelToken
  ])

  useEffect(() => {
    fetchJobs()
  }, [refetchJobs, chainIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const addJobToView = async (job: ComputeJobMetaData) => {
    // If there's already an active job, remove it first
    if (activeJobId && activeJobId !== job.jobId) {
      await clearTextAnalysis()
    }

    // Always fetch fresh data from chain
    try {
      const loadingId = showUploadingToast('Adding to visualization…')
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

      const textAnalysisResults: TextAnalysisResult[] = results.map((file) => {
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

        const result: TextAnalysisResult = {}

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
      })

      const newuseCaseData: TextAnalysisUseCaseData = {
        job,
        result: textAnalysisResults
      }

      await createOrUpdateTextAnalysis(newuseCaseData)
      setActiveJobId(job.jobId)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('textAnalysis.activeJobId', job.jobId)
      }
      setTextAnalysisData([newuseCaseData])
      updateToastSuccess(loadingId, 'Added to visualization')
    } catch (error) {
      LoggerInstance.error(error)
      updateToastError(undefined, 'Could not add to visualization')
    }
  }

  const removeJobFromView = async (job: ComputeJobMetaData) => {
    if (activeJobId === job.jobId) {
      // Clear all data from indexedDB
      await clearTextAnalysis()
      setActiveJobId('')
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('textAnalysis.activeJobId')
      }
      setTextAnalysisData([])
      updateToastSuccess(undefined, 'Removed from visualization')
    }
  }

  const clearData = async () => {
    if (!confirm('All data will be removed from your cache. Proceed?')) return

    await clearTextAnalysis()
    setActiveJobId('')
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('textAnalysis.activeJobId')
    }
    updateToastSuccess(undefined, 'Text Analysis data was cleared.')
  }

  const getCustomActionsPerComputeJob: GetCustomActions = (
    job: ComputeJobMetaData
  ) => {
    const isActive = activeJobId === job.jobId

    const addAction = {
      label: 'Add',
      onClick: () => {
        addJobToView(job)
      }
    }

    const removeAction = {
      label: 'Remove',
      onClick: () => {
        removeJobFromView(job)
      }
    }

    const actionArray = []

    if (isActive) {
      actionArray.push(removeAction)
    } else {
      actionArray.push(addAction)
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
            disabled={!textAnalysisList?.length}
          >
            Clear Data
          </Button>
        </div>
      </Accordion>
    </div>
  )
}
