import { LoggerInstance, ProviderInstance } from '@oceanprotocol/lib'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useAccount, useSigner } from 'wagmi'
import { useAutomation } from '../../../@context/Automation/AutomationProvider'
import { useUserPreferences } from '../../../@context/UserPreferences'
import { useCancelToken } from '../../../@hooks/useCancelToken'
import { useUseCases } from '../../../@context/UseCases'
import Accordion from '../../@shared/Accordion'
import Button from '../../@shared/atoms/Button'
import ComputeJobs, {
  GetCustomActions
} from '../../Profile/History/ComputeJobs'
import styles from './JobList.module.css'
import { ChatbotResult } from './_types'
import { chatbotApi, ChatbotUseCaseData } from '../../../@utils/chatbot'

import { getAsset } from '../../../@utils/aquarius'
import { getComputeJobs } from '../../../@utils/compute'

export type AssistantState =
  | 'connecting'
  | 'backend-error'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'no-knowledge'

export default function JobList(props: {
  algoDidsByChain: Record<number, string>
  namespace: string
  setChatbotData: (chatbotData: ChatbotUseCaseData[]) => void
  onStatusChange?: (s: AssistantState) => void
  onForceRefresh?: () => void
}): ReactElement {
  const { chainIds } = useUserPreferences()
  const chatbotAlgoDids: string[] = Object.values(props.algoDidsByChain)

  const { address: accountId } = useAccount()
  const { data: signer } = useSigner()
  const { autoWallet } = useAutomation()

  // Get IndexedDB operations through useUseCases hook
  const {
    chatbotList,
    createOrUpdateChatbot,
    clearChatbotByNamespace,
    deleteChatbot
  } = useUseCases()

  const [jobs, setJobs] = useState<ComputeJobMetaData[]>([])
  const [refetchJobs, setRefetchJobs] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [isUploadingKnowledge, setIsUploadingKnowledge] = useState(false)
  const newCancelToken = useCancelToken()

  // Restore data from IndexedDB when component mounts or data changes
  useEffect(() => {
    if (chatbotList) {
      const filtered = chatbotList.filter(
        (row) => row.namespace === props.namespace
      )
      props.setChatbotData(filtered)
    }
  }, [chatbotList, props.namespace, props.setChatbotData])

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
        // Filter computeJobs for dids provided from use case
        computeJobs.computeJobs.filter(
          (job) => chatbotAlgoDids.includes(job.algoDID) && job.status === 70
        )
      )
      setIsLoadingJobs(!computeJobs.isLoaded)
    } catch (error) {
      LoggerInstance.error((error as Error).message)
      setIsLoadingJobs(false)
    }
  }, [chainIds, chatbotAlgoDids, accountId, autoWallet, newCancelToken])

  useEffect(() => {
    fetchJobs()
  }, [refetchJobs, chainIds])

  const addComputeResultToUseCaseDB = async (job: ComputeJobMetaData) => {
    // Namespace-scoped existing rows
    const nsRows = chatbotList.filter(
      (row) => row.namespace === props.namespace
    )
    if (nsRows.find((row) => row.job.jobId === job.jobId)) {
      toast.info(
        'This compute job result is already being used by the chatbot.'
      )
      return
    }
    // Do not clear existing KBs; we will aggregate and upload in one session

    try {
      setIsUploadingKnowledge(true)
      props.onStatusChange?.('uploading')

      const datasetDDO = await getAsset(job.inputDID[0], newCancelToken())
      const signerToUse =
        job.owner.toLowerCase() === autoWallet?.address.toLowerCase()
          ? autoWallet
          : signer

      const url = await ProviderInstance.getComputeResultUrl(
        datasetDDO.services[0].serviceEndpoint,
        signerToUse,
        job.jobId,
        0
      )

      const response = await fetch(url)

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
              entities: [],
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
        result: chatBotResults,
        namespace: props.namespace
      }

      try {
        // 1. Save to IndexedDB first for persistence
        await createOrUpdateChatbot(newUseCaseData)

        // 2. Aggregate existing namespace KBs + new KB, then upload once (same session)
        const updatedList = [...nsRows, newUseCaseData]
        const uploadResponse = await chatbotApi.uploadKnowledge(updatedList)

        if (uploadResponse.success) {
          // Immediately refresh backend knowledge status after upload
          props.onStatusChange?.('processing')
          props.onForceRefresh?.()
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
        LoggerInstance.error('❌ Knowledge upload failed:', error as any)
        toast.error('❌ Could not add compute result to chatbot')
        props.onStatusChange?.('no-knowledge')
      } finally {
        setIsUploadingKnowledge(false)
      }
    } catch (error) {
      LoggerInstance.error('❌ Failed to process compute job:', error as any)
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

      // 1. Remove only this item from IndexedDB
      if (rowToDelete.id !== undefined) {
        await deleteChatbot(rowToDelete.id)
      }

      // 2. Compute remaining KBs in this namespace based on current list
      const remaining = chatbotList
        .filter((row) => row.namespace === props.namespace)
        .filter((row) => row.job.jobId !== job.jobId)

      if (remaining.length > 0) {
        // Upload remaining knowledge to backend without resetting session
        await chatbotApi.uploadKnowledge(remaining)
        props.onForceRefresh?.()
        toast.success('✅ Data updated')
      } else {
        // If no KBs remain, reset the session per strategy B
        await chatbotApi.resetSession()
        props.onForceRefresh?.()
        toast.success('✅ Data removed and session reset')
        props.onStatusChange?.('no-knowledge')
      }
    } catch (error) {
      LoggerInstance.error('❌ Knowledge update failed:', error as any)
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

      // Clear from IndexedDB (namespace only)
      await clearChatbotByNamespace(props.namespace)

      // Also delete server-side session and rotate a new one
      await chatbotApi.resetSession()

      // Immediately refresh backend knowledge status
      props.onForceRefresh?.()

      toast.success(
        '✅ Chatbot data was cleared and session reset. Add compute job results to start over.'
      )
      props.onStatusChange?.('no-knowledge')
    } catch (error) {
      LoggerInstance.error('❌ Failed to clear data:', error as any)
      toast.error('❌ Failed to clear chatbot data')
    } finally {
      setIsUploadingKnowledge(false)
    }
  }

  const getCustomActionsPerComputeJob: GetCustomActions = (
    job: ComputeJobMetaData
  ) => {
    const addAction = {
      label: <span>Add</span>,
      onClick: (j: ComputeJobMetaData) => {
        addComputeResultToUseCaseDB(j)
      }
    }
    const deleteAction = {
      label: <span>Remove</span>,
      onClick: (j: ComputeJobMetaData) => {
        deleteJobResultFromDB(j)
      }
    }

    const viewContainsResult = chatbotList.find(
      (row) => row.job.jobId === job.jobId && row.namespace === props.namespace
    )

    const actionArray = [] as ReturnType<GetCustomActions>

    if (viewContainsResult) {
      actionArray.push(deleteAction)
    } else actionArray.push(addAction)

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
          <Button onClick={() => clearData()} disabled={isUploadingKnowledge}>
            Clear Data
          </Button>
        </div>
      </Accordion>
    </div>
  )
}
