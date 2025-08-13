import type { UseCaseConfig } from '../@shared/VizHub/types'

/**
 * Mapping of { chainId: useCaseAlgorithmDID }
 */
export const TEXT_ANALYSIS_ALGO_DIDS = {
  32456:
    'did:op:b0f6cccf8a8c1094e3b29c537271f2dcf025249e8b9324ae93c6b79b20db723c'
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
