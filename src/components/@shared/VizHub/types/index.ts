// VizHub component data types
export interface HistogramData {
  value: number
}

export interface TimelineData {
  time: string
  count: number
}

export interface SentimentData {
  name: string
  values: [string, number, string[]?][]
}

export interface WordCloudData {
  wordCloudData: Array<{ value: string; count: number }>
}

export interface DocumentSummaryData {
  totalDocuments: number
  totalWords: number
  uniqueWords: number
  vocabularyDensity: number
  readabilityIndex: number
  wordsPerSentence: number
  frequentWords: Array<{ word: string; count: number }>
  created: string
}

// Main data interface for VizHub
export interface VizHubData {
  histogram?: HistogramData[]
  timeline?: TimelineData[]
  sentiment?: SentimentData[]
  wordCloud?: WordCloudData
  documentSummary?: DocumentSummaryData
}

// Use case specific configuration
export interface UseCaseConfig {
  /**
   * The use case name - used for data storage keys and identification
   */
  useCaseName: string

  /**
   * Algorithm DIDs mapping for different chains
   */
  algoDids: Record<number, string>

  /**
   * Result ZIP file configuration
   */
  resultZip: {
    fileName: string
    metadataFileName: string
    detectionsFileName: string
    imagesFolderName: string
  }
}

// Configuration interface for controlling which visualizations to show
export interface VizHubConfig {
  // Legacy support (keep for backward compatibility)
  showEmailDistribution?: boolean
  showDateDistribution?: boolean
  showSentiment?: boolean
  showWordCloud?: boolean
  showDocumentSummary?: boolean
  showFutureFeatures?: boolean

  // NEW: Focused component visibility control
  components?: {
    wordCloud?: boolean
    sentiment?: boolean
    histogram?: boolean
    timeline?: boolean
    documentSummary?: boolean
    futureFeatures?: boolean
  }

  // NEW: Customization for components that need it
  customization?: {
    histogram?: {
      title?: string
      xAxisLabel?: string
      yAxisLabel?: string
      chartType?: 'bar' | 'line' | 'area'
      unit?: string
    }
    timeline?: {
      title?: string
      xAxisLabel?: string
      yAxisLabel?: string
      dateFormat?: string
      aggregation?: 'day' | 'week' | 'month'
    }
    sentiment?: {
      title?: string
    }
    wordCloud?: {
      title?: string
    }
    documentSummary?: {
      title?: string
    }
  }

  // NEW: Extension system
  extensions?: VizHubExtension[]
}

// Extension interface
export interface VizHubExtension {
  id: string
  name: string
  component: React.ComponentType<any>
  position:
    | 'before-wordcloud'
    | 'after-wordcloud'
    | 'after-sentiment'
    | 'before-sentiment'
    | 'sidebar'
    | 'footer'
  requiredData?: string[]
  props?: Record<string, any>
}

// Main VizHub component props
export interface VizHubProps {
  data?: VizHubData
  config?: VizHubConfig
  useCaseConfig: UseCaseConfig
  className?: string
  theme?: 'light' | 'dark'
  /** Optional: namespace to isolate user preferences (e.g., stoplist/whitelist) */
  preferencesNamespace?: string
}

// Default configuration
export const DEFAULT_VIZHUB_CONFIG: VizHubConfig = {
  showEmailDistribution: true,
  showDateDistribution: true,
  showSentiment: true,
  showWordCloud: true,
  showDocumentSummary: true,
  showFutureFeatures: true
}
