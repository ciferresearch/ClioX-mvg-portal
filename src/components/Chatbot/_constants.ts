import type { UseCaseConfig } from '../@shared/VizHub/types'

/**
 * Mapping of { chainId: useCaseAlgorithmDID }
 * TODO: Update with correct Chatbot algorithm DID when backend provides
 */
export const CHATBOT_ALGO_DIDS = {
  32456:
    'did:op:ae86a4a2fa73e9e24f9bbae97fa6ca8033f1b0891a155db5aada92e618e0fed7'
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
 * Mock data for development and API testing
 *
 * NOTE: This is demo data for testing the RAG chatbot API integration.
 * In production, real Ocean Protocol compute jobs would be used instead.
 */
// export const MOCK_CHATBOT_COMPUTE_JOB = {
//   // Base ComputeJob properties from Ocean Protocol
//   jobId: 'demo-chatbot-job-001',
//   status: 70, // completed status
//   statusText: 'Demo Job - Click Add to test API integration', // Clear demo labeling
//   dateCreated: Math.floor(Date.now() / 1000).toString(), // Unix timestamp as string
//   dateFinished: Math.floor(Date.now() / 1000).toString(), // Unix timestamp as string
//   dateStarted: Math.floor(Date.now() / 1000).toString(), // Unix timestamp as string
//   algoDID: CHATBOT_ALGO_DIDS[32456],
//   inputDID: ['did:op:demo-dataset'], // Demo dataset DID
//   outputDID: 'did:op:demo-chatbot-output-001', // Demo output DID
//   owner: '0x1234567890abcdef', // Demo wallet address
//   results: [
//     {
//       type: 'output' as const,
//       filename: 'demo_knowledge_base.json',
//       filesize: 2048,
//       index: 0
//     },
//     {
//       type: 'output' as const,
//       filename: 'demo_metadata.json',
//       filesize: 512,
//       index: 1
//     },
//     {
//       type: 'algorithmLog' as const,
//       filename: 'demo_algorithm.log',
//       filesize: 256,
//       index: 2
//     }
//   ],
//   // ComputeJobExtended properties
//   providerUrl: 'https://demo-provider.oceanprotocol.com', // Demo provider URL
//   // ComputeJobExtended properties
//   expireTimestamp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
//   // ComputeJobMetaData properties (added by the application)
//   assetName: '🔧 Demo Job (Mock Data)', // Clear demo labeling
//   assetDtSymbol: 'DEMO-CHATBOT',
//   networkId: 32456
// }
