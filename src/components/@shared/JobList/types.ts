import { IndexableType } from 'dexie'

export interface ComputeFile {
  filename: string
  url: string
  content: string
}

export interface JobListDataStore<TUseCaseData> {
  list: TUseCaseData[] | undefined
  createOrUpdate: (data: TUseCaseData) => Promise<IndexableType | undefined>
  delete: (id: number) => Promise<void>
  clear: () => Promise<void>
}

export interface JobListUIConfig {
  accordionTitle: string
  clearButtonText: string
  successMessages: {
    added: string
    removed: string
    cleared: string
  }
  infoMessages?: {
    alreadyExists?: string
  }
}

export interface JobListOptions {
  enableActiveJobTracking?: boolean
  sessionStorageKey?: string
  maxResultFiles?: number
  enableViewAction?: boolean
}

export interface JobListConfig<TUseCaseData, TResult> {
  // Algorithm configuration
  algoDids: string[]
  useCaseName: string

  // Data store operations
  dataStore: JobListDataStore<TUseCaseData>

  // Result processing
  resultProcessor: (files: ComputeFile[]) => TResult[]

  // UI configuration
  ui: JobListUIConfig

  // Optional features
  options?: JobListOptions
}

export interface JobListProps<TUseCaseData, TResult> {
  config: JobListConfig<TUseCaseData, TResult>
  onDataChange: (data: TUseCaseData[]) => void
}

// Helper type for creating use case data
export interface BaseUseCaseData<TResult> {
  id?: number
  job: ComputeJobMetaData
  result: TResult[]
}
