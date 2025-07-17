import { LoggerInstance } from '@oceanprotocol/lib'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useAccount, useSigner } from 'wagmi'
import { useAutomation } from '../../@context/Automation/AutomationProvider'
import { useUserPreferences } from '../../@context/UserPreferences'
import { useCancelToken } from '../../@hooks/useCancelToken'
import Accordion from '../@shared/Accordion'
import Button from '../@shared/atoms/Button'
import ComputeJobs, { GetCustomActions } from '../Profile/History/ComputeJobs'
import styles from './JobList.module.css'
import { CHATBOT_ALGO_DIDS, MOCK_CHATBOT_COMPUTE_JOB } from './_constants'
import { ChatbotResult } from './_types'
import { chatbotApi, ChatbotUseCaseData } from '../../services/chatbotApi'

export default function JobList(props: {
  setChatbotData: (chatbotData: ChatbotUseCaseData[]) => void
}): ReactElement {
  const { chainIds } = useUserPreferences()
  const chatbotAlgoDids: string[] = Object.values(CHATBOT_ALGO_DIDS)

  const { address: accountId } = useAccount()
  const { data: signer } = useSigner()
  const { autoWallet } = useAutomation()

  const [jobs, setJobs] = useState<ComputeJobMetaData[]>([])
  const [refetchJobs, setRefetchJobs] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [isUploadingKnowledge, setIsUploadingKnowledge] = useState(false)
  const [backendStatus, setBackendStatus] = useState<string>('checking')
  const newCancelToken = useCancelToken()

  // TODO: Replace this with real database when ready
  const [chatbotList, setChatbotList] = useState<ChatbotUseCaseData[]>([])

  // Update parent component when chatbot list changes
  useEffect(() => {
    props.setChatbotData(chatbotList)
  }, [chatbotList, props])

  // Check backend health status
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const health = await chatbotApi.healthCheck()
        if (health.status === 'healthy' && health.ollama_connected) {
          setBackendStatus('healthy')
        } else {
          setBackendStatus('degraded')
        }
      } catch (error) {
        console.error('❌ Backend health check failed:', error)
        setBackendStatus('error')
      }
    }

    checkBackendHealth()
    const interval = setInterval(checkBackendHealth, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  // Auto-load mock data for development - REMOVED: Now using real API
  // useEffect(() => {
  //   // This was auto-loading mock data - no longer needed with real API
  // }, [backendStatus, jobs.length])

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoadingJobs(true)

      // Show mock compute job for development/demo purposes (clearly labeled)
      const mockJobs = [
        {
          ...MOCK_CHATBOT_COMPUTE_JOB,
          assetName: '🔧 Demo Job (Mock Data)', // Clear labeling
          statusText: 'Demo Job - Click Add to test API integration'
        }
      ]
      setJobs(mockJobs)
      setIsLoadingJobs(false)

      // TODO: Replace with real Ocean Protocol compute jobs when ready
      /*
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
            chatbotAlgoDids.includes(job.algoDID) && job.status === 70
        )
      )
      setIsLoadingJobs(!computeJobs.isLoaded)
      */
    } catch (error) {
      LoggerInstance.error(error.message)
      setIsLoadingJobs(false)
    }
  }, [chainIds, chatbotAlgoDids, newCancelToken])

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

      // Create enhanced mock data for API testing
      const mockChatbotResults: ChatbotResult[] = [
        {
          knowledgeBase: {
            chunks: [
              {
                id: `demo_chunk_${job.jobId}_1`,
                content: `This is demo knowledge chunk #1 from job ${job.jobId}. In a real scenario, this would contain actual extracted knowledge from your Ocean Protocol compute job results.`,
                metadata: {
                  source: `demo_result_${job.jobId}.json`,
                  topic: 'demo_content',
                  date: new Date().toISOString().split('T')[0],
                  entities: ['Demo', 'Ocean Protocol', 'Compute Job'],
                  category: 'demo',
                  tags: ['demo', 'test', 'api-integration']
                }
              },
              {
                id: `demo_chunk_${job.jobId}_2`,
                content: `Demo knowledge chunk #2 shows how the RAG system processes and searches through multiple pieces of information to answer user questions.`,
                metadata: {
                  source: `demo_analysis_${job.jobId}.txt`,
                  topic: 'rag_explanation',
                  date: new Date().toISOString().split('T')[0],
                  entities: ['RAG', 'Knowledge Base', 'AI Assistant'],
                  category: 'technical',
                  tags: ['rag', 'search', 'ai']
                }
              },
              {
                id: `demo_chunk_${job.jobId}_3`,
                content: `This demo chunk demonstrates how the system handles different types of content and metadata. Real compute jobs would provide domain-specific insights and analysis.`,
                metadata: {
                  source: `demo_metadata_${job.jobId}.md`,
                  topic: 'system_demo',
                  date: new Date().toISOString().split('T')[0],
                  entities: [
                    'Metadata',
                    'Content Processing',
                    'Ocean Protocol'
                  ],
                  category: 'demo',
                  tags: ['demo', 'metadata', 'processing']
                }
              }
            ]
          },
          domainInfo: {
            domain: `demo-job-${job.jobId}`,
            entities: [
              'Demo Data',
              'Ocean Protocol',
              'Compute Jobs',
              'RAG System',
              'AI Assistant'
            ],
            timeRange: `Demo data created: ${
              new Date().toISOString().split('T')[0]
            }`,
            description: `Demo knowledge base created from mock compute job ${job.jobId}. In production, this would contain real insights from your data analysis.`
          }
        }
      ]

      const newUseCaseData: ChatbotUseCaseData = {
        job,
        result: mockChatbotResults
      }

      // 1. Add to local state first for immediate UI update
      const updatedList = [...chatbotList, newUseCaseData]
      setChatbotList(updatedList)

      // 2. Upload all knowledge to backend API
      console.log(`📤 Uploading knowledge for job ${job.jobId} to backend...`)
      const uploadResponse = await chatbotApi.uploadKnowledge(updatedList)

      if (uploadResponse.success) {
        toast.success(
          `✅ Data ready! ${
            uploadResponse.chunks_processed
          } pieces of information uploaded. Session: ${uploadResponse.session_id.slice(
            -8
          )}`
        )
        console.log('✅ Knowledge upload successful:', {
          chunks: uploadResponse.chunks_processed,
          domains: uploadResponse.domains,
          sessionId: uploadResponse.session_id
        })
      } else {
        throw new Error(uploadResponse.message || 'Upload failed')
      }

      // TODO: Use real database when ready
      // await createOrUpdateChatbot(newUseCaseData)
    } catch (error) {
      LoggerInstance.error('❌ Knowledge upload failed:', error)

      // Remove from local state if API upload failed
      setChatbotList((prev) =>
        prev.filter((item) => item.job.jobId !== job.jobId)
      )

      let errorMessage = 'Could not add compute result to chatbot'
      if (error.message.includes('Cannot connect')) {
        errorMessage =
          'Cannot connect to chatbot backend. Please check if the server is running on port 8001.'
      } else if (error.message.includes('Rate limit')) {
        errorMessage =
          'Rate limit exceeded. Please wait before adding more knowledge.'
      }

      toast.error(`❌ ${errorMessage}`)
    } finally {
      setIsUploadingKnowledge(false)
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

      // 1. Remove from local state
      const updatedList = chatbotList.filter(
        (item) => item.job.jobId !== job.jobId
      )
      setChatbotList(updatedList)

      // 2. Re-upload remaining knowledge to backend (or clear if empty)
      if (updatedList.length > 0) {
        const uploadResponse = await chatbotApi.uploadKnowledge(updatedList)
        if (uploadResponse.success) {
          toast.success(
            `✅ Data updated. ${uploadResponse.chunks_processed} pieces of information remaining.`
          )
        }
      } else {
        // Knowledge base is now empty - the session will automatically handle this
        toast.info(
          'No information loaded. Add compute job results to start chatting.'
        )
      }

      // TODO: Use real database when ready
      // await deleteChatbot(rowToDelete.id)
    } catch (error) {
      LoggerInstance.error('❌ Knowledge update failed:', error)

      // Restore the item if API call failed
      setChatbotList((prev) => [...prev, rowToDelete])
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

      // Clear local state
      setChatbotList([])

      // Backend will automatically handle empty knowledge base
      toast.success(
        '✅ Chatbot data was cleared. Add compute job results to start over.'
      )

      // TODO: Use real database when ready
      // await clearChatbot()
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
        {/* Backend status indicator */}
        <div
          className={`mb-4 p-3 rounded-lg ${
            backendStatus === 'healthy'
              ? 'bg-green-50 border border-green-200'
              : backendStatus === 'degraded'
              ? 'bg-yellow-50 border border-yellow-200'
              : backendStatus === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-gray-50 border border-gray-200'
          }`}
        >
          <p
            className={`text-sm ${
              backendStatus === 'healthy'
                ? 'text-green-600'
                : backendStatus === 'degraded'
                ? 'text-yellow-600'
                : backendStatus === 'error'
                ? 'text-red-600'
                : 'text-gray-600'
            }`}
          >
            {backendStatus === 'healthy' &&
              '✅ Chatbot backend connected (port 8001)'}
            {backendStatus === 'degraded' &&
              '⚠️ Backend connected but Ollama may be offline'}
            {backendStatus === 'error' &&
              '❌ Cannot connect to chatbot backend. Check if server is running on port 8001.'}
            {backendStatus === 'checking' &&
              '🔄 Checking backend connection...'}
          </p>
        </div>

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
          <Button
            onClick={() => clearData()}
            disabled={isUploadingKnowledge || backendStatus === 'error'}
          >
            Clear Data
          </Button>
        </div>
      </Accordion>
    </div>
  )
}
