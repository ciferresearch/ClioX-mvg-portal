// Main VizHub component
export { default as VizHub } from './VizHub'

// Hooks
export { useVizHubData } from './hooks/useVizHubData'

// Stores (if needed externally)
// Legacy exports removed in pure mode
export {
  useTheme,
  ThemeProvider,
  VizHubThemeProvider
} from './store/themeStore'

// Types
export type {
  VizHubProps,
  VizHubData,
  VizHubConfig,
  HistogramData,
  TimelineData,
  SentimentData,
  WordCloudData,
  DocumentSummaryData
} from './types'

// Default configuration
export { DEFAULT_VIZHUB_CONFIG } from './types'

// Individual visualization components (if needed)
export { default as SentimentChart } from './visualizations/sentiment/SentimentChart'
export { default as DataDistribution } from './visualizations/distribution/DataDistribution'
export { default as WordCloud } from './visualizations/wordcloud'
export { default as DocumentSummary } from './visualizations/summary/DocumentSummary'

// UI components (if needed)
export { default as VisualizationWrapper } from './ui/common/VisualizationWrapper'
export { default as LoadingIndicator } from './ui/common/LoadingIndicator'
export { default as FutureFeatures } from './ui/common/FutureFeatures'
