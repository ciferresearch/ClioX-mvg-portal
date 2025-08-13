import { ReactElement } from 'react'
import Accordion from '../Accordion'
import Button from '../atoms/Button'
import ComputeJobs from '../../Profile/History/ComputeJobs'
import { useJobList } from './hooks/useJobList'
import type { JobListProps, BaseUseCaseData } from './types'
import styles from './JobList.module.css'

/**
 * Generic JobList component for managing compute jobs across different use cases.
 *
 * Features:
 * - Fetches and displays compute jobs
 * - Caches and manages job results
 * - Optional active job tracking with session persistence
 * - Configurable UI and behavior
 * - Type-safe with generics for different use case data types
 *
 * @template TUseCaseData - The use case data type (extends BaseUseCaseData)
 * @template TResult - The processed result type
 */
export default function JobList<
  TUseCaseData extends BaseUseCaseData<TResult>,
  TResult
>({ config, onDataChange }: JobListProps<TUseCaseData, TResult>): ReactElement {
  const {
    jobs,
    isLoadingJobs,
    refetchJobs,
    clearData,
    getCustomActionsPerComputeJob
  } = useJobList(config, onDataChange)

  return (
    <div className={styles.accordionWrapper}>
      <Accordion title={config.ui.accordionTitle} defaultExpanded>
        <ComputeJobs
          jobs={jobs}
          isLoading={isLoadingJobs}
          refetchJobs={refetchJobs}
          getActions={getCustomActionsPerComputeJob}
          hideDetails
        />

        <div className={styles.actions}>
          <Button onClick={clearData} disabled={!config.dataStore.list?.length}>
            {config.ui.clearButtonText}
          </Button>
        </div>
      </Accordion>
    </div>
  )
}
