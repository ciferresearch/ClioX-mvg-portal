import { IndexableType } from 'dexie'
import { CameroonGazetteUseCaseData } from '../../@context/UseCases/models/CameroonGazette.model'
import type { JobListConfig } from '../@shared/JobList'
import {
  processCameroonGazetteResults,
  type CameroonGazetteResult
} from '../@shared/JobList/utils/resultProcessors'
import { CAMEROON_GAZETTE_ALGO_DIDS } from './_constants'

/**
 * JobList configuration for CameroonGazette use case
 * This function receives the use cases context as parameters to avoid Hook rules violation
 */
export function createCameroonGazetteJobListConfig(useCases: {
  cameroonGazetteList: CameroonGazetteUseCaseData[] | undefined
  createOrUpdateCameroonGazette: (
    data: CameroonGazetteUseCaseData
  ) => Promise<IndexableType | undefined>
  deleteCameroonGazette: (id: number) => Promise<void>
  clearCameroonGazette: () => Promise<void>
}): JobListConfig<CameroonGazetteUseCaseData, CameroonGazetteResult> {
  return {
    algoDids: Object.values(CAMEROON_GAZETTE_ALGO_DIDS),
    useCaseName: 'cameroonGazette',

    dataStore: {
      list: useCases.cameroonGazetteList,
      createOrUpdate: useCases.createOrUpdateCameroonGazette,
      delete: useCases.deleteCameroonGazette,
      clear: useCases.clearCameroonGazette
    },

    resultProcessor: processCameroonGazetteResults,

    ui: {
      accordionTitle: 'Compute Jobs',
      clearButtonText: 'Clear Data',
      successMessages: {
        added: 'Added a new compute result',
        removed: 'Removed compute job result from visualization.',
        cleared: 'Cameroon Gazette data was cleared.'
      },
      infoMessages: {
        alreadyExists:
          'This compute job result already is part of the map view.'
      }
    },

    options: {
      enableActiveJobTracking: true,
      sessionStorageKey: 'cameroonGazette.activeJobId',
      maxResultFiles: 5,
      enableViewAction: true
    }
  }
}
