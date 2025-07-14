import type { UseCaseConfig } from '../@shared/VizHub/types'

/**
 * Mapping of { chainId: useCaseAlgorithmDID }
 * TODO: Update with correct Chatbot algorithm DID when backend provides
 */
export const CHATBOT_ALGO_DIDS = {
  32456: 'did:op:placeholder-chatbot-algorithm'
}

export const CHATBOT_USECASE_NAME = 'chatbot'

export const CHATBOT_RESULT_ZIP = {
  fileName: 'chatbot_result.zip',
  metadataFileName: 'metadata.json',
  detectionsFileName: 'knowledge_base.json',
  imagesFolderName: 'embeddings'
}

/**
 * Configuration for Chatbot use case
 */
export const CHATBOT_CONFIG: UseCaseConfig = {
  useCaseName: CHATBOT_USECASE_NAME,
  algoDids: CHATBOT_ALGO_DIDS,
  resultZip: CHATBOT_RESULT_ZIP
}

/**
 * VizHub configuration for Chatbot - disable all visualizations
 */
export const CHATBOT_VIZHUB_CONFIG = {
  // Disable all visualization components
  components: {
    wordCloud: false,
    sentiment: false,
    emailDistribution: false,
    dateDistribution: false,
    documentSummary: false,
    futureFeatures: false
  }
}

/**
 * Mock data for development
 */
export const MOCK_CHATBOT_COMPUTE_JOB = {
  jobId: 'mock-chatbot-job-001',
  status: 70, // completed status
  statusText: 'Job finished', // required by ComputeJobs table
  algoDID: CHATBOT_ALGO_DIDS[32456],
  inputDID: ['did:op:enron-dataset'],
  results: [
    { filename: 'knowledge_base.json', size: 2048 },
    { filename: 'metadata.json', size: 512 },
    { filename: 'domain_info.json', size: 256 }
  ],
  owner: '0x1234567890abcdef',
  dateCreated: Math.floor(Date.now() / 1000).toString(), // Unix timestamp as string
  dateFinished: Math.floor(Date.now() / 1000).toString(), // Unix timestamp as string
  providerUrl: 'https://v4.provider.oceanprotocol.com', // required by ComputeJobs table
  // Additional properties required by ComputeJobMetaData
  assetName: 'Enron Email Dataset',
  assetDtSymbol: 'ENRON-DT',
  networkId: 32456
}
