import { CameroonGazetteResult } from '../../../components/CameroonGazette/_types'

// Dedicated model for Cameroon Gazette use case
export interface CameroonGazetteUseCaseData {
  id?: number
  job: ComputeJobMetaData
  result: CameroonGazetteResult[]
}

export const CAMEROON_GAZETTE_TABLE = {
  cameroonGazettes: '++id, job, result'
}
