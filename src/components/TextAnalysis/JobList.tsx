import { ReactElement } from 'react'
import { useUseCases } from '../../@context/UseCases'
import { TextAnalysisUseCaseData } from '../../@context/UseCases/models/TextAnalysis.model'
import { JobList } from '../@shared/JobList'
import { createTextAnalysisJobListConfig } from './_jobListConfig'

export default function TextAnalysisJobList(props: {
  setTextAnalysisData: (textAnalysisData: TextAnalysisUseCaseData[]) => void
}): ReactElement {
  const {
    textAnalysisList,
    createOrUpdateTextAnalysis,
    deleteTextAnalysis,
    clearTextAnalysis
  } = useUseCases()

  const config = createTextAnalysisJobListConfig({
    textAnalysisList,
    createOrUpdateTextAnalysis,
    deleteTextAnalysis,
    clearTextAnalysis
  })

  return <JobList config={config} onDataChange={props.setTextAnalysisData} />
}
