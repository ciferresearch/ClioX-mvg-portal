import { LoggerInstance, ProviderInstance } from '@oceanprotocol/lib'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useAccount, useSigner } from 'wagmi'
import { useAutomation } from '../../@context/Automation/AutomationProvider'
import { useUserPreferences } from '../../@context/UserPreferences'
import { useCancelToken } from '../../@hooks/useCancelToken'
import { useUseCases } from '../../@context/UseCases'
import Accordion from '../@shared/Accordion'
import Button from '../@shared/atoms/Button'
import ComputeJobs, { GetCustomActions } from '../Profile/History/ComputeJobs'
import styles from './JobList.module.css'
import { CHATBOT_ALGO_DIDS, CHATBOT_RESULT_ZIP } from './_constants'
import { ChatbotResult } from './_types'
import { chatbotApi, ChatbotUseCaseData } from '../../@utils/chatbot'

import { getAsset } from '../../@utils/aquarius'
import { getComputeJobs } from '../../@utils/compute'

type AssistantState =
  | 'connecting'
  | 'backend-error'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'no-knowledge'

export default function JobList(props: {
  setChatbotData: (chatbotData: ChatbotUseCaseData[]) => void
  onStatusChange?: (s: AssistantState) => void
}): ReactElement {
  const { chainIds } = useUserPreferences()
  const chatbotAlgoDids: string[] = Object.values(CHATBOT_ALGO_DIDS)

  const { address: accountId } = useAccount()
  const { data: signer } = useSigner()
  const { autoWallet } = useAutomation()

  // Get IndexedDB operations through useUseCases hook
  const { chatbotList, createOrUpdateChatbot, clearChatbot } = useUseCases()

  const [jobs, setJobs] = useState<ComputeJobMetaData[]>([])
  const [refetchJobs, setRefetchJobs] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [isUploadingKnowledge, setIsUploadingKnowledge] = useState(false)
  const newCancelToken = useCancelToken()

  // Restore data from IndexedDB when component mounts or data changes
  useEffect(() => {
    if (chatbotList) {
      props.setChatbotData(chatbotList)
    }
  }, [chatbotList, props])

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
          (job) => chatbotAlgoDids.includes(job.algoDID) && job.status === 70
        )
      )
      setIsLoadingJobs(!computeJobs.isLoaded)
    } catch (error) {
      LoggerInstance.error(error.message)
      setIsLoadingJobs(false)
    }
  }, [chainIds, chatbotAlgoDids, accountId, autoWallet, newCancelToken])

  useEffect(() => {
    fetchJobs()
  }, [refetchJobs, chainIds])

  const addComputeResultToUseCaseDB = async (job: ComputeJobMetaData) => {
    if (chatbotList.find((row) => row.job.jobId === job.jobId)) {
      toast.info(
        'This compute job result is already being used by the chatbot.'
      )
      return
    }

    try {
      setIsUploadingKnowledge(true)
      props.onStatusChange?.('uploading')

      const datasetDDO = await getAsset(job.inputDID[0], newCancelToken())
      const signerToUse =
        job.owner.toLowerCase() === autoWallet?.address.toLowerCase()
          ? autoWallet
          : signer

      const resultFile = job.results[0]
      const url = await ProviderInstance.getComputeResultUrl(
        datasetDDO.services[0].serviceEndpoint,
        signerToUse,
        job.jobId,
        0
      )

      const response = await fetch(url)

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const fileContent = await response.text()

      // Check if the content looks like a traceback or error message
      if (
        fileContent.trim().startsWith('Traceback') ||
        fileContent.trim().startsWith('Error') ||
        fileContent.trim().startsWith('Exception') ||
        fileContent.includes('Traceback (most recent call last)')
      ) {
        console.error('❌ Compute job returned error/traceback:', fileContent)
        toast.error('❌ Compute job failed - check job status')
        setIsUploadingKnowledge(false)
        return
      }

      let chatBotResults: ChatbotResult[] = []
      try {
        const parsedContent = JSON.parse(fileContent)

        // Use actual Ocean Protocol compute job format directly
        const oceanProtocolData = Array.isArray(parsedContent)
          ? parsedContent
          : [parsedContent]

        // Wrap in our expected structure for frontend consistency
        chatBotResults = [
          {
            knowledgeBase: {
              chunks: oceanProtocolData
            },
            domainInfo: {
              domain:
                job.assetName?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
                'compute-job-result',
              entities: [], // Will be extracted by backend
              description: `Knowledge from compute job: ${
                job.assetName || job.jobId
              }`
            }
          }
        ]
      } catch (e) {
        console.error('❌ JSON parsing failed:', e)
        console.error(
          '❌ File content that failed to parse:',
          fileContent.substring(0, 500)
        )
        toast.error(
          '❌ Failed to parse compute job result - invalid JSON format'
        )
        setIsUploadingKnowledge(false)
        return
      }

      const newUseCaseData: ChatbotUseCaseData = {
        job,
        result: chatBotResults
      }

      try {
        // 1. Save to IndexedDB first for persistence
        await createOrUpdateChatbot(newUseCaseData)

        // 2. Upload knowledge to RAG backend
        const uploadResponse = await chatbotApi.uploadKnowledge([
          newUseCaseData
        ])

        if (uploadResponse.success) {
          // Switch to processing state; parent poller will move to ready when done
          props.onStatusChange?.('processing')
          toast.success(
            `✅ Data ready! ${
              uploadResponse.chunks_processed
            } pieces of information uploaded. Session: ${uploadResponse.session_id.slice(
              -8
            )}`
          )
        } else {
          throw new Error(uploadResponse.message || 'Upload failed')
        }
      } catch (error) {
        LoggerInstance.error('❌ Knowledge upload failed:', error)
        toast.error('❌ Could not add compute result to chatbot')
        props.onStatusChange?.('no-knowledge')
      } finally {
        setIsUploadingKnowledge(false)
      }
    } catch (error) {
      LoggerInstance.error('❌ Failed to process compute job:', error)
      toast.error('❌ Could not process compute job result')
      setIsUploadingKnowledge(false)
      props.onStatusChange?.('no-knowledge')
    }
  }

  const deleteJobResultFromDB = async (job: ComputeJobMetaData) => {
    if (
      !confirm(`Are you sure you want to remove this result from the chatbot?`)
    )
      return

    const rowToDelete = chatbotList.find((row) => row.job.jobId === job.jobId)
    if (!rowToDelete) return

    try {
      setIsUploadingKnowledge(true)

      // 1. Remove from IndexedDB
      await clearChatbot()

      // 2. Clear knowledge from RAG backend
      toast.success('✅ Data removed from chatbot')
      props.onStatusChange?.('no-knowledge')
    } catch (error) {
      LoggerInstance.error('❌ Knowledge update failed:', error)
      toast.error('❌ Failed to update knowledge base')
    } finally {
      setIsUploadingKnowledge(false)
    }
  }

  const clearData = async () => {
    if (!confirm('All chatbot data will be removed from your cache. Proceed?'))
      return

    try {
      setIsUploadingKnowledge(true)

      // Clear from IndexedDB
      await clearChatbot()

      // Clear from RAG backend
      toast.success(
        '✅ Chatbot data was cleared. Add compute job results to start over.'
      )
      props.onStatusChange?.('no-knowledge')
    } catch (error) {
      LoggerInstance.error('❌ Failed to clear data:', error)
      toast.error('❌ Failed to clear chatbot data')
    } finally {
      setIsUploadingKnowledge(false)
    }
  }

  const getCustomActionsPerComputeJob: GetCustomActions = (
    job: ComputeJobMetaData
  ) => {
    const addAction = {
      label: 'Add',
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

    const viewContainsResult = chatbotList.find(
      (row) => row.job.jobId === job.jobId
    )

    const actionArray = []

    if (viewContainsResult) {
      actionArray.push(deleteAction)
    } else actionArray.push(addAction)

    return actionArray
  }

  return (
    <div className={styles.accordionWrapper}>
      <Accordion title="Compute Jobs" defaultExpanded>
        {/* Knowledge upload status */}
        {isUploadingKnowledge && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
            <p className="text-blue-600 text-sm">
              🔄 Uploading knowledge to backend API...
            </p>
          </div>
        )}

        <ComputeJobs
          jobs={jobs}
          isLoading={isLoadingJobs}
          refetchJobs={() => setRefetchJobs(!refetchJobs)}
          getActions={getCustomActionsPerComputeJob}
          hideDetails
        />

        <div className={styles.actions}>
          <Button onClick={() => clearData()} disabled={isUploadingKnowledge}>
            Clear Data
          </Button>
        </div>
      </Accordion>
    </div>
  )
}
