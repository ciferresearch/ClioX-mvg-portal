import { LoggerInstance, ProviderInstance } from '@oceanprotocol/lib'
import {
  MutableRefObject,
  ReactElement,
  useCallback,
  useEffect,
  useState
} from 'react'
import { toast } from 'react-toastify'
import { useAccount, useSigner } from 'wagmi'
import { useAutomation } from '../../@context/Automation/AutomationProvider'
import { useUseCases } from '../../@context/UseCases'
// TODO: Create ChatbotUseCaseData model
// import { ChatbotUseCaseData } from '../../@context/UseCases/models/Chatbot.model'
import { useUserPreferences } from '../../@context/UserPreferences'
import { useCancelToken } from '../../@hooks/useCancelToken'
import { getAsset } from '../../@utils/aquarius'
import { getComputeJobs } from '../../@utils/compute'
import Accordion from '../@shared/Accordion'
import Button from '../@shared/atoms/Button'
import ComputeJobs, { GetCustomActions } from '../Profile/History/ComputeJobs'
import styles from './JobList.module.css'
import {
  CHATBOT_ALGO_DIDS,
  CHATBOT_RESULT_ZIP,
  MOCK_CHATBOT_COMPUTE_JOB
} from './_constants'
import { ChatbotResult } from './_types'

// Temporary interface until we create the proper model
interface ChatbotUseCaseData {
  id?: number
  job: ComputeJobMetaData
  result: ChatbotResult[]
}

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
  const newCancelToken = useCancelToken()

  const { setChatbotData } = props

  // TODO: Add chatbot methods to useUseCases context
  const {
    textAnalysisList, // TODO: Change to chatbotList
    clearTextAnalysis, // TODO: Change to clearChatbot
    createOrUpdateTextAnalysis, // TODO: Change to createOrUpdateChatbot
    deleteTextAnalysis // TODO: Change to deleteChatbot
  } = useUseCases()

  // Mock chatbot data for now
  const [chatbotList, setChatbotList] = useState<ChatbotUseCaseData[]>([])

  useEffect(() => {
    if (!chatbotList) {
      setChatbotData([])
      return
    }

    setChatbotData(chatbotList)
  }, [chatbotList, setChatbotData])

  // Auto-load mock knowledge base on component mount for demo purposes
  useEffect(() => {
    const autoLoadMockData = async () => {
      // Create mock knowledge base data
      const mockChatbotResults: ChatbotResult[] = [
        {
          knowledgeBase: {
            chunks: [
              {
                id: 'enron_chunk_1',
                content:
                  'Email from Jeff Skilling to Kenneth Lay discussing quarterly earnings and company performance metrics. The email mentions significant revenue growth in the energy trading division and concerns about regulatory compliance.',
                metadata: {
                  source: 'skilling_lay_email_001.msg',
                  topic: 'earnings',
                  date: '2001-01-15',
                  entities: [
                    'Jeff Skilling',
                    'Kenneth Lay',
                    'Enron',
                    'Energy Trading'
                  ]
                }
              },
              {
                id: 'enron_chunk_2',
                content:
                  'Internal communication regarding energy trading strategies and market positions. Discussion of risk management protocols and profit maximization techniques in volatile energy markets.',
                metadata: {
                  source: 'trading_strategy_email_002.msg',
                  topic: 'trading',
                  date: '2001-02-20',
                  entities: [
                    'Enron',
                    'Energy Trading',
                    'Market Analysis',
                    'Risk Management'
                  ]
                }
              },
              {
                id: 'enron_chunk_3',
                content:
                  'Discussion of accounting practices and financial reporting requirements. Mentions of special purpose entities (SPEs) and off-balance-sheet transactions that were part of Enron business model.',
                metadata: {
                  source: 'accounting_discussion_003.msg',
                  topic: 'accounting',
                  date: '2001-03-10',
                  entities: [
                    'Arthur Andersen',
                    'Financial Reporting',
                    'Accounting Standards',
                    'SPE'
                  ]
                }
              },
              {
                id: 'enron_chunk_4',
                content:
                  'Executive communication about corporate governance and board meetings. Discussion of strategic initiatives and shareholder value creation through innovative financial structures.',
                metadata: {
                  source: 'executive_board_email_004.msg',
                  topic: 'governance',
                  date: '2001-04-05',
                  entities: [
                    'Board of Directors',
                    'Corporate Governance',
                    'Shareholders',
                    'Strategy'
                  ]
                }
              },
              {
                id: 'enron_chunk_5',
                content:
                  'HR communication regarding employee stock options and retirement plans. Information about 401(k) investments in Enron stock and company matching policies.',
                metadata: {
                  source: 'hr_benefits_email_005.msg',
                  topic: 'benefits',
                  date: '2001-05-12',
                  entities: [
                    'Human Resources',
                    'Stock Options',
                    '401k',
                    'Employee Benefits'
                  ]
                }
              }
            ],
            searchIndex: {
              earnings: ['enron_chunk_1'],
              trading: ['enron_chunk_2'],
              accounting: ['enron_chunk_3'],
              governance: ['enron_chunk_4'],
              benefits: ['enron_chunk_5'],
              'jeff skilling': ['enron_chunk_1'],
              'kenneth lay': ['enron_chunk_1'],
              'arthur andersen': ['enron_chunk_3'],
              energy: ['enron_chunk_1', 'enron_chunk_2'],
              financial: ['enron_chunk_1', 'enron_chunk_3'],
              employee: ['enron_chunk_5'],
              stock: ['enron_chunk_5']
            }
          },
          domainInfo: {
            domain: 'enron-emails',
            entities: [
              'Jeff Skilling',
              'Kenneth Lay',
              'Arthur Andersen',
              'Enron',
              'Energy Trading',
              'Board of Directors'
            ],
            timeRange: '2001-01-15 to 2001-05-12',
            description:
              'Internal corporate communications from Enron Corporation covering various business aspects'
          }
        }
      ]

      const autoLoadedData: ChatbotUseCaseData = {
        job: MOCK_CHATBOT_COMPUTE_JOB,
        result: mockChatbotResults
      }

      // Auto-add to chatbot list so interface is immediately available
      setChatbotList([autoLoadedData])
    }

    // Auto-load on component mount
    autoLoadMockData()
  }, []) // Only run once on mount

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoadingJobs(true)

      // Add mock compute job for development (available without wallet connection)
      const mockJobs = [MOCK_CHATBOT_COMPUTE_JOB]
      setJobs(mockJobs)
      setIsLoadingJobs(false)

      // TODO: Uncomment when real backend is ready
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
        'This compute job result already is part of the chatbot knowledge base.'
      )
      return
    }

    try {
      // Mock processing for development
      const mockChatbotResults: ChatbotResult[] = [
        {
          knowledgeBase: {
            chunks: [
              {
                id: 'enron_chunk_1',
                content:
                  'Email from Jeff Skilling to Kenneth Lay discussing quarterly earnings and company performance metrics.',
                metadata: {
                  source: 'skilling_lay_email_001.msg',
                  topic: 'earnings',
                  date: '2001-01-15',
                  entities: ['Jeff Skilling', 'Kenneth Lay', 'Enron']
                }
              },
              {
                id: 'enron_chunk_2',
                content:
                  'Internal communication regarding energy trading strategies and market positions.',
                metadata: {
                  source: 'trading_strategy_email_002.msg',
                  topic: 'trading',
                  date: '2001-02-20',
                  entities: ['Enron', 'Energy Trading', 'Market Analysis']
                }
              },
              {
                id: 'enron_chunk_3',
                content:
                  'Discussion of accounting practices and financial reporting requirements.',
                metadata: {
                  source: 'accounting_discussion_003.msg',
                  topic: 'accounting',
                  date: '2001-03-10',
                  entities: [
                    'Arthur Andersen',
                    'Financial Reporting',
                    'Accounting Standards'
                  ]
                }
              }
            ],
            searchIndex: {
              earnings: ['enron_chunk_1'],
              trading: ['enron_chunk_2'],
              accounting: ['enron_chunk_3'],
              'jeff skilling': ['enron_chunk_1'],
              'kenneth lay': ['enron_chunk_1']
            }
          },
          domainInfo: {
            domain: 'enron-emails',
            entities: [
              'Jeff Skilling',
              'Kenneth Lay',
              'Arthur Andersen',
              'Enron'
            ],
            timeRange: '2001-01-15 to 2001-03-10',
            description:
              'Internal corporate communications from Enron Corporation'
          }
        }
      ]

      const newUseCaseData: ChatbotUseCaseData = {
        job,
        result: mockChatbotResults
      }

      // Add to mock list for now
      setChatbotList((prev) => [...prev, newUseCaseData])

      // TODO: Use real database when ready
      // await createOrUpdateChatbot(newUseCaseData)
      toast.success('Added compute result to chatbot knowledge base')
    } catch (error) {
      LoggerInstance.error(error)
      toast.error('Could not add compute result to chatbot')
    }
  }

  const deleteJobResultFromDB = async (job: ComputeJobMetaData) => {
    if (
      !confirm(
        `Are you sure you want to delete the result from chatbot knowledge base?`
      )
    )
      return

    const rowToDelete = chatbotList.find((row) => row.job.jobId === job.jobId)
    if (!rowToDelete) return

    // Remove from mock list
    setChatbotList((prev) =>
      prev.filter((item) => item.job.jobId !== job.jobId)
    )

    // TODO: Use real database when ready
    // await deleteChatbot(rowToDelete.id)
    toast.success(`Removed compute job result from chatbot knowledge base.`)
  }

  const clearData = async () => {
    if (!confirm('All chatbot data will be removed from your cache. Proceed?'))
      return

    setChatbotList([])
    // TODO: Use real database when ready
    // await clearChatbot()
    toast.success('Chatbot data was cleared.')
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
        <ComputeJobs
          jobs={jobs}
          isLoading={isLoadingJobs}
          refetchJobs={() => setRefetchJobs(!refetchJobs)}
          getActions={getCustomActionsPerComputeJob}
          hideDetails
        />

        <div className={styles.actions}>
          <Button onClick={() => clearData()}>Clear Data</Button>
        </div>
      </Accordion>
    </div>
  )
}
