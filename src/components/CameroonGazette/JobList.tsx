import { ReactElement } from 'react'
import { useUseCases } from '../../@context/UseCases'
import { CameroonGazetteUseCaseData } from '../../@context/UseCases/models/CameroonGazette.model'
import { JobList } from '../@shared/JobList'
import { createCameroonGazetteJobListConfig } from './_jobListConfig'

export default function CameroonGazetteJobList(props: {
  setTextAnalysisData: (
    cameroonGazetteData: CameroonGazetteUseCaseData[]
  ) => void
}): ReactElement {
  const {
    cameroonGazetteList,
    createOrUpdateCameroonGazette,
    deleteCameroonGazette,
    clearCameroonGazette
  } = useUseCases()

  const config = createCameroonGazetteJobListConfig({
    cameroonGazetteList,
    createOrUpdateCameroonGazette,
    deleteCameroonGazette,
    clearCameroonGazette
  })

  return <JobList config={config} onDataChange={props.setTextAnalysisData} />
}
