import type { UseCaseConfig } from '../@shared/VizHub/types'

/**
 * Mapping of { chainId: useCaseAlgorithmDID }
 */
export const TEXT_ANALYSIS_ALGO_DIDS = {
  32456: [
    'did:op:735d46e04de418f8f671fe2bd6828c40490c99729c93d0c42c92bd5fe3d6bcb8'
  ]
}

export const TEXT_ANALYSIS_DATASET_DIDS: Record<number, string[]> = {
  32456: [
    'did:op:c5cebd876a1c7fd5dc7bc6fc3b9ca96871214f1299b0aaf779febdb91d12ec2a'
  ]
}

export const TEXT_ANALYSIS_USECASE_NAME = 'textAnalysises'

export const TEXT_ANALYSIS_RESULT_ZIP = {
  fileName: 'result.zip',
  metadataFileName: 'metadata.json',
  detectionsFileName: 'detections.json',
  imagesFolderName: 'images'
}

/**
 * Configuration for Text Analysis use case
 */
export const TEXT_ANALYSIS_CONFIG: UseCaseConfig = {
  useCaseName: TEXT_ANALYSIS_USECASE_NAME,
  algoDids: TEXT_ANALYSIS_ALGO_DIDS,
  resultZip: TEXT_ANALYSIS_RESULT_ZIP
}

/**
 * VizHub configuration for Text Analysis - demonstrating new flexibility
 */
export const TEXT_ANALYSIS_VIZHUB_CONFIG = {
  // Component visibility
  components: {
    wordCloud: true,
    sentiment: true,
    histogram: true,
    timeline: true,
    documentSummary: true,
    futureFeatures: false
  },

  // Customization for distribution charts
  customization: {
    timeline: {
      title: 'Email Count Over Time',
      xAxisLabel: 'Date',
      yAxisLabel: 'Count'
    },
    histogram: {
      title: 'Email Analysis Distribution',
      xAxisLabel: 'Emails per Day',
      yAxisLabel: 'Frequency',
      unit: 'email analysis results'
    }
  }
}
