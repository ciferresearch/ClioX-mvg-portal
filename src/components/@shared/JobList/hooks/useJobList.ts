import { LoggerInstance, ProviderInstance } from '@oceanprotocol/lib'
import { useCallback, useEffect, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { useAccount, useSigner } from 'wagmi'
import { useAutomation } from '../../../../@context/Automation/AutomationProvider'
import { useUserPreferences } from '../../../../@context/UserPreferences'
import { useCancelToken } from '../../../../@hooks/useCancelToken'
import { getAsset } from '../../../../@utils/aquarius'
import { getComputeJobs } from '../../../../@utils/compute'
import { GetCustomActions } from '../../../Profile/History/ComputeJobs'
import type { JobListConfig, BaseUseCaseData } from '../types'

export function useJobList<
  TUseCaseData extends BaseUseCaseData<TResult>,
  TResult
>(
  config: JobListConfig<TUseCaseData, TResult>,
  onDataChange: (data: TUseCaseData[]) => void
) {
  const { chainIds } = useUserPreferences()
  const { address: accountId } = useAccount()
  const { data: signer } = useSigner()
  const { autoWallet } = useAutomation()
  const newCancelToken = useCancelToken()

  // State management
  const [jobs, setJobs] = useState<ComputeJobMetaData[]>([])
  const [refetchJobs, setRefetchJobs] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)

  // Prevent double rendering
  const lastDataChangeRef = useRef<string>('')

  // Active job tracking (if enabled)
  const [activeJobId, setActiveJobId] = useState<string>(() => {
    if (
      !config.options?.enableActiveJobTracking ||
      !config.options.sessionStorageKey
    ) {
      return ''
    }
    return typeof window !== 'undefined'
      ? sessionStorage.getItem(config.options.sessionStorageKey) || ''
      : ''
  })

  // Data management effect with debouncing to prevent double rendering
  useEffect(() => {
    const handleDataChange = () => {
      if (!config.dataStore.list) {
        const dataKey = 'empty'
        if (lastDataChangeRef.current !== dataKey) {
          lastDataChangeRef.current = dataKey
          onDataChange([])
        }
        return
      }

      // If active job tracking is enabled and we have an active job
      if (config.options?.enableActiveJobTracking && activeJobId) {
        const row = config.dataStore.list.find(
          (r) => r.job.jobId === activeJobId
        )
        if (row) {
          const dataKey = `active-${activeJobId}-${row.id}`
          if (lastDataChangeRef.current !== dataKey) {
            lastDataChangeRef.current = dataKey
            onDataChange([row])
          }
          return
        }
      }

      // Default behavior: show all data or empty array based on configuration
      if (config.options?.enableActiveJobTracking) {
        const dataKey = 'tracking-empty'
        if (lastDataChangeRef.current !== dataKey) {
          lastDataChangeRef.current = dataKey
          onDataChange([])
        }
      } else {
        const dataKey = `all-${
          config.dataStore.list.length
        }-${config.dataStore.list.map((r) => r.id).join(',')}`
        if (lastDataChangeRef.current !== dataKey) {
          lastDataChangeRef.current = dataKey
          onDataChange(config.dataStore.list)
        }
      }
    }

    // Small delay to allow database updates to settle
    const timeoutId = setTimeout(handleDataChange, 10)
    return () => clearTimeout(timeoutId)
  }, [
    config.dataStore.list,
    activeJobId,
    onDataChange,
    config.options?.enableActiveJobTracking
  ])

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    if (!accountId) {
      return
    }

    try {
      setIsLoadingJobs(true)

      // Fetch computeJobs for all selected networks
      const computeJobs = await getComputeJobs(
        chainIds,
        accountId,
        null,
        newCancelToken()
      )

      // Include auto wallet jobs if available
      if (autoWallet) {
        const autoComputeJobs = await getComputeJobs(
          chainIds,
          autoWallet?.address,
          null,
          newCancelToken()
        )
        autoComputeJobs.computeJobs.forEach((job) => {
          computeJobs.computeJobs.push(job)
        })
      }

      // Filter jobs based on configured algorithm DIDs
      setJobs(
        computeJobs.computeJobs.filter(
          (job) => config.algoDids.includes(job.algoDID) && job.status === 70
        )
      )
      setIsLoadingJobs(!computeJobs.isLoaded)
    } catch (error) {
      LoggerInstance.error(error.message)
      setIsLoadingJobs(false)
    }
  }, [chainIds, config.algoDids, accountId, autoWallet, newCancelToken])

  // Refetch jobs when dependencies change
  useEffect(() => {
    fetchJobs()
  }, [refetchJobs, chainIds, fetchJobs])

  // Add compute result to database
  const addComputeResultToUseCaseDB = async (job: ComputeJobMetaData) => {
    if (config.dataStore.list?.find((row) => row.job.jobId === job.jobId)) {
      toast.info(
        config.ui.infoMessages?.alreadyExists ||
          'This compute job result already is part of the view.'
      )
      return
    }

    try {
      const datasetDDO = await getAsset(job.inputDID[0], newCancelToken())
      const signerToUse =
        job.owner.toLowerCase() === autoWallet?.address.toLowerCase()
          ? autoWallet
          : signer

      const maxFiles = config.options?.maxResultFiles || 5
      const resultFiles = job.results.slice(0, maxFiles)
      const results = []

      // Fetch all result files
      for (let i = 0; i < resultFiles.length; i++) {
        const url = await ProviderInstance.getComputeResultUrl(
          datasetDDO.services[0].serviceEndpoint,
          signerToUse,
          job.jobId,
          i
        )

        const response = await fetch(url)
        const content = await response.text()

        results.push({
          filename: resultFiles[i].filename,
          url,
          content
        })

        // Add time delay to avoid nonce collision
        if (i < resultFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }

      // Process results using provided processor
      const processedResults = config.resultProcessor(results)

      // Create new use case data
      const newUseCaseData: TUseCaseData = {
        job,
        result: processedResults
      } as TUseCaseData

      await config.dataStore.createOrUpdate(newUseCaseData)

      // Handle active job tracking
      if (config.options?.enableActiveJobTracking) {
        setActiveJobId(job.jobId)
        if (typeof window !== 'undefined' && config.options.sessionStorageKey) {
          sessionStorage.setItem(config.options.sessionStorageKey, job.jobId)
        }
        // Don't call onDataChange here - let the useEffect handle it
        // to avoid double rendering
      }

      toast.success(config.ui.successMessages.added)
    } catch (error) {
      LoggerInstance.error(error)
      toast.error('Could not add compute result')
    }
  }

  // View job result (for active job tracking)
  const viewJobResult = (job: ComputeJobMetaData) => {
    if (!config.options?.enableActiveJobTracking) {
      return
    }

    setActiveJobId(job.jobId)
    if (typeof window !== 'undefined' && config.options.sessionStorageKey) {
      sessionStorage.setItem(config.options.sessionStorageKey, job.jobId)
    }

    const row = config.dataStore.list?.find((r) => r.job.jobId === job.jobId)
    if (row) {
      onDataChange([row])
    } else {
      onDataChange([])
    }
  }

  // Delete job result from database
  const deleteJobResultFromDB = async (job: ComputeJobMetaData) => {
    if (
      !confirm(`Are you sure you want to delete the result from visualization?`)
    ) {
      return
    }

    const rowToDelete = config.dataStore.list?.find(
      (row) => row.job.jobId === job.jobId
    )
    if (!rowToDelete) return

    await config.dataStore.delete(rowToDelete.id!)

    // Handle active job tracking
    if (config.options?.enableActiveJobTracking && activeJobId === job.jobId) {
      setActiveJobId('')
      if (typeof window !== 'undefined' && config.options.sessionStorageKey) {
        sessionStorage.removeItem(config.options.sessionStorageKey)
      }
      onDataChange([])
    }

    toast.success(config.ui.successMessages.removed)
  }

  // Clear all data
  const clearData = async () => {
    if (!confirm('All data will be removed from your cache. Proceed?')) return

    await config.dataStore.clear()

    // Handle active job tracking
    if (config.options?.enableActiveJobTracking) {
      setActiveJobId('')
      if (typeof window !== 'undefined' && config.options.sessionStorageKey) {
        sessionStorage.removeItem(config.options.sessionStorageKey)
      }
    }

    toast.success(config.ui.successMessages.cleared)
  }

  // Get custom actions per compute job
  const getCustomActionsPerComputeJob: GetCustomActions = (
    job: ComputeJobMetaData
  ) => {
    const viewContainsResult = config.dataStore.list?.find(
      (row) => row.job.jobId === job.jobId
    )

    const actionArray = []

    if (!viewContainsResult) {
      // Job not in database - show add action
      actionArray.push({
        label: 'Cache & View',
        onClick: () => addComputeResultToUseCaseDB(job)
      })
    } else {
      // Job is in database
      if (
        config.options?.enableActiveJobTracking &&
        config.options?.enableViewAction
      ) {
        const isActive = activeJobId === job.jobId
        actionArray.push({
          label: isActive ? 'Viewing' : 'View',
          onClick: () => {
            if (!isActive) viewJobResult(job)
          }
        })
      }

      actionArray.push({
        label: 'Remove',
        onClick: () => deleteJobResultFromDB(job)
      })
    }

    return actionArray
  }

  return {
    jobs,
    isLoadingJobs,
    refetchJobs: () => setRefetchJobs(!refetchJobs),
    addComputeResultToUseCaseDB,
    deleteJobResultFromDB,
    clearData,
    viewJobResult,
    getCustomActionsPerComputeJob,
    activeJobId
  }
}
