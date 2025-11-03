import { LoggerInstance, ProviderInstance } from '@oceanprotocol/lib'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import { toast, Id } from 'react-toastify'
import {
  showUploadingToast,
  updateToastError,
  updateToastSuccess
} from '../../../@utils/toast'
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
  algoDidsByChain: Record<number, string | string[]>
  namespace: string
  setChatbotData: (chatbotData: ChatbotUseCaseData[]) => void
  onStatusChange?: (s: AssistantState) => void
  onForceRefresh?: () => void
}): ReactElement {
  const { chainIds } = useUserPreferences()
  const chatbotAlgoDids: string[] = (
    Object.values(props.algoDidsByChain) as (string | string[])[]
  ).flat()

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
    if (!accountId) return

    try {
      setIsLoadingJobs(true)

      // Fetch computeJobs for current account
      const baseRes = await getComputeJobs(
        chainIds,
        accountId,
        null,
        newCancelToken()
      )

      let merged = baseRes?.computeJobs || []
      let loaded = baseRes?.isLoaded

      // If auto wallet is different address, fetch and merge
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

      // Dedupe by jobId only, then filter for this use case
      const deduped = Array.from(
        new Map(merged.map((j) => [j.jobId, j])).values()
      )
      const filtered = deduped.filter(
        (job) => chatbotAlgoDids.includes(job.algoDID) && job.status === 70
      )

      setJobs(filtered)
      setIsLoadingJobs(!loaded)
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

    let uploadToastId: Id | undefined
    try {
      setIsUploadingKnowledge(true)
      props.onStatusChange?.('uploading')

      // Show an info toast while uploading knowledge; update it on success/error
      uploadToastId = showUploadingToast('Uploading knowledge…')

      const datasetDDO = await getAsset(job.inputDID[0], newCancelToken())
      const signerToUse =
        job.owner.toLowerCase() === autoWallet?.address.toLowerCase()
          ? autoWallet
          : signer

      // Determine correct result index: prefer a file named "final_output"
      const results = Array.isArray(job.results) ? job.results : []
      let resultIndex = 0
      if (results.length > 0) {
        const byName = results.findIndex(
          (r: any) =>
            typeof r?.filename === 'string' &&
            r.filename.toLowerCase().includes('final_output')
        )
        if (byName !== -1) {
          resultIndex = byName
        } else {
          // fallback: pick the last item of type 'output' if available
          for (let i = results.length - 1; i >= 0; i--) {
            const r: any = results[i]
            if (r?.type === 'output') {
              resultIndex = i
              break
            }
          }
        }
      }

      const url = await ProviderInstance.getComputeResultUrl(
        datasetDDO.services[0].serviceEndpoint,
        signerToUse,
        job.jobId,
        resultIndex
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
        updateToastError(uploadToastId, 'Compute job failed — check status')
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
              } (result: ${
                results[resultIndex]?.filename || `#${resultIndex}`
              })`
            }
          }
        ]
      } catch (e) {
        console.error('❌ JSON parsing failed:', e)
        console.error(
          '❌ File content that failed to parse:',
          fileContent.substring(0, 500)
        )
        updateToastError(
          uploadToastId,
          'Failed to parse compute job result — invalid JSON'
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

        // 2. Delta upload: only send the newly added job to avoid duplicate IDs on backend
        const uploadResponse = await chatbotApi.uploadKnowledge([
          newUseCaseData
        ])

        if (uploadResponse.success) {
          // Immediately refresh backend knowledge status after upload
          props.onStatusChange?.('processing')
          props.onForceRefresh?.()
          const successMsg = `Data ready! ${
            uploadResponse.chunks_processed
          } pieces of information uploaded. Session: ${uploadResponse.session_id.slice(
            -8
          )}`
          updateToastSuccess(uploadToastId, successMsg)
        } else {
          throw new Error(uploadResponse.message || 'Upload failed')
        }
      } catch (error) {
        LoggerInstance.error('❌ Knowledge upload failed:', error as any)
        updateToastError(
          uploadToastId,
          'Could not add compute result to chatbot'
        )
        props.onStatusChange?.('no-knowledge')
      } finally {
        setIsUploadingKnowledge(false)
      }
    } catch (error) {
      LoggerInstance.error('❌ Failed to process compute job:', error as any)
      // Ensure the loading toast transitions and auto-closes
      updateToastError(uploadToastId, 'Could not process compute job result')
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
        // Backend forbids duplicate IDs: replace session knowledge to reflect remaining items
        await chatbotApi.replaceSessionKnowledge(remaining)
        props.onForceRefresh?.()
        updateToastSuccess(null, 'Data updated')
      } else {
        // If no KBs remain, reset the session per strategy B
        await chatbotApi.resetSession()
        props.onForceRefresh?.()
        updateToastSuccess(null, 'Data removed and session reset')
        props.onStatusChange?.('no-knowledge')
      }
    } catch (error) {
      LoggerInstance.error('Knowledge update failed:', error as any)
      updateToastError(null, 'Failed to update knowledge base')
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

      updateToastSuccess(
        null,
        'Chatbot data was cleared and session reset. Add compute job results to start over.'
      )
      props.onStatusChange?.('no-knowledge')
    } catch (error) {
      LoggerInstance.error('❌ Failed to clear data:', error as any)
      updateToastError(null, 'Failed to clear chatbot data')
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
