import { IndexableType } from 'dexie'
import { TextAnalysisUseCaseData } from '../../@context/UseCases/models/TextAnalysis.model'
import type { JobListConfig } from '../@shared/JobList'
import {
  processTextAnalysisResults,
  type TextAnalysisResult
} from '../@shared/JobList/utils/resultProcessors'
import { TEXT_ANALYSIS_ALGO_DIDS } from './_constants'

/**
 * JobList configuration for TextAnalysis use case
 * This function receives the use cases context as parameters to avoid Hook rules violation
 */
export function createTextAnalysisJobListConfig(useCases: {
  textAnalysisList: TextAnalysisUseCaseData[] | undefined
  createOrUpdateTextAnalysis: (
    data: TextAnalysisUseCaseData
  ) => Promise<IndexableType | undefined>
  deleteTextAnalysis: (id: number) => Promise<void>
  clearTextAnalysis: () => Promise<void>
}): JobListConfig<TextAnalysisUseCaseData, TextAnalysisResult> {
  return {
    algoDids: Object.values(TEXT_ANALYSIS_ALGO_DIDS),
    useCaseName: 'textAnalysis',

    dataStore: {
      list: useCases.textAnalysisList,
      createOrUpdate: useCases.createOrUpdateTextAnalysis,
      delete: useCases.deleteTextAnalysis,
      clear: useCases.clearTextAnalysis
    },

    resultProcessor: processTextAnalysisResults,

    ui: {
      accordionTitle: 'Compute Jobs',
      clearButtonText: 'Clear Data',
      successMessages: {
        added: 'Added a new compute result',
        removed: 'Removed compute job result from visualization.',
        cleared: 'Text Analysis data was cleared.'
      },
      infoMessages: {
        alreadyExists:
          'This compute job result already is part of the map view.'
      }
    },

    options: {
      enableActiveJobTracking: true,
      sessionStorageKey: 'textAnalysis.activeJobId',
      maxResultFiles: 5,
      enableViewAction: true
    }
  }
}
