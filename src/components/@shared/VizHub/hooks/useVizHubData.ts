import { useEffect, useMemo } from 'react'
import type { VizHubData, VizHubConfig, UseCaseConfig } from '../types'
import { DEFAULT_VIZHUB_CONFIG } from '../types'

/**
 * Convert array data to CSV format for distribution charts
 */
const convertToCSV = (data: any[], headers: string[]): string => {
  const csvRows = [headers.join(',')]
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header === 'value' ? 'value' : header]
      return typeof value === 'string' ? value : String(value)
    })
    csvRows.push(values.join(','))
  })
  return csvRows.join('\n')
}

/**
 * Custom hook to handle VizHub data injection and processing
 * This hook manages the integration between external props data and localStorage
 * so that existing visualization components work without modification
 */
export function useVizHubData(
  externalData?: VizHubData,
  config?: VizHubConfig,
  _useCaseConfig?: UseCaseConfig
) {
  const effectiveConfig = useMemo(
    () => ({ ...DEFAULT_VIZHUB_CONFIG, ...config }),
    [config]
  )

  const dataStatus = useMemo(() => {
    return {
      wordCloudData: !!externalData?.wordCloud,
      timelineData: !!externalData?.timeline?.length,
      histogramData: !!externalData?.histogram?.length,
      sentimentData: !!externalData?.sentiment?.length,
      documentSummaryData: !!externalData?.documentSummary
    }
  }, [externalData])

  const processingStatus: 'ready' | 'not_ready' | 'error' = 'ready'
  const statusMessage = ''

  return {
    dataStatus,
    processingStatus,
    statusMessage,
    config: effectiveConfig,
    hasAnyData: Object.values(dataStatus).some((status) => status),
    dataSourceInfo: { usingExternalData: true, usingLocalStorage: false }
  }
}
