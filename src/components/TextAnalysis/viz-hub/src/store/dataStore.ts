import { create } from 'zustand'
import { TextAnalysisUseCaseData } from '@/@context/UseCases/models/TextAnalysis.model'
import {
  WordCloud,
  DateDistribution,
  EmailDistribution,
  SentimentCategory,
  SentimentData,
  DocumentSummary
} from '@/components/TextAnalysis/_types'

// Storage keys for different data types
export const STORAGE_KEYS = {
  WORD_CLOUD: 'wordCloudData',
  DATE_DISTRIBUTION: 'dateDistributionData',
  EMAIL_DISTRIBUTION: 'emailDistributionData',
  SENTIMENT: 'sentimentData',
  DOCUMENT_SUMMARY: 'documentSummaryData'
} as const

// Define the types for our store
interface DataStatus {
  wordCloudData: boolean
  dateDistributionData: boolean
  emailDistributionData: boolean
  sentimentData: boolean
  documentSummaryData: boolean
}

export type ProcessingStatus = 'ready' | 'not_ready' | 'error'

// Data types for each visualization
export interface DateDistributionData extends DateDistribution {}
export interface EmailDistributionData extends EmailDistribution {}
export interface SentimentDataArray extends Array<SentimentData> {}
export interface DocumentSummaryData extends DocumentSummary {}
export interface WordCloudData {
  wordCloudData: WordCloud[]
}

interface DataStore {
  // Data status for each component
  dataStatus: DataStatus
  setDataStatus: (dataType: string, status: boolean) => void

  // Global processing status
  processingStatus: ProcessingStatus
  setProcessingStatus: (status: ProcessingStatus) => void

  // Status message
  statusMessage: string
  setStatusMessage: (message: string) => void

  // Check data status
  checkDataStatus: (data: TextAnalysisUseCaseData[]) => void

  // Data fetching functions for components
  fetchEmailDistribution: (
    data: TextAnalysisUseCaseData[]
  ) => Promise<EmailDistributionData[]>
  fetchDateDistribution: (
    data: TextAnalysisUseCaseData[]
  ) => Promise<DateDistributionData[]>
  fetchSentimentData: (
    data: TextAnalysisUseCaseData[]
  ) => Promise<SentimentDataArray>
  fetchWordCloudData: (
    data: TextAnalysisUseCaseData[]
  ) => Promise<WordCloudData>
  fetchDocumentSummary: (
    data: TextAnalysisUseCaseData[]
  ) => Promise<DocumentSummaryData>
}

export const useDataStore = create<DataStore>((set, get) => ({
  // Initial data status
  dataStatus: {
    wordCloudData: false,
    dateDistributionData: false,
    emailDistributionData: false,
    sentimentData: false,
    documentSummaryData: false
  },

  // Set status for a data type
  setDataStatus: (dataType: string, status: boolean) =>
    set((state) => ({
      dataStatus: {
        ...state.dataStatus,
        [dataType]: status
      }
    })),

  // Global processing status
  processingStatus: 'ready',
  setProcessingStatus: (status: ProcessingStatus) =>
    set({ processingStatus: status }),

  // Status message
  statusMessage: '',
  setStatusMessage: (message: string) => set({ statusMessage: message }),

  // Check data status
  checkDataStatus: (data: TextAnalysisUseCaseData[]) => {
    if (!data || data.length === 0) {
      set({
        dataStatus: {
          wordCloudData: false,
          dateDistributionData: false,
          emailDistributionData: false,
          sentimentData: false,
          documentSummaryData: false
        }
      })
      return
    }

    const hasWordCloud = data.some((item) =>
      item.result.some((result) => result.wordcloud)
    )
    const hasDateDistribution = data.some((item) =>
      item.result.some((result) => result.dataDistribution)
    )
    const hasEmailDistribution = data.some((item) =>
      item.result.some((result) => result.emailDistribution)
    )
    const hasSentiment = data.some((item) =>
      item.result.some((result) => result.sentiment)
    )
    const hasDocumentSummary = data.some((item) =>
      item.result.some((result) => result.documentSummary)
    )

    set({
      dataStatus: {
        wordCloudData: hasWordCloud,
        dateDistributionData: hasDateDistribution,
        emailDistributionData: hasEmailDistribution,
        sentimentData: hasSentiment,
        documentSummaryData: hasDocumentSummary
      }
    })
  },

  // Data fetching functions for components
  fetchEmailDistribution: async (data: TextAnalysisUseCaseData[]) => {
    const emailDistributionData: EmailDistributionData[] = []

    data.forEach((item) => {
      item.result.forEach((result) => {
        if (result.emailDistribution) {
          try {
            const rows = result.emailDistribution.trim().split('\n')
            const parsedData = rows
              .slice(1)
              .map((row) => ({
                emails_per_day: parseInt(row.trim())
              }))
              .filter((item) => !isNaN(item.emails_per_day))

            emailDistributionData.push(...parsedData)
          } catch (error) {
            console.error('Error parsing email distribution data:', error)
          }
        }
      })
    })

    return emailDistributionData
  },

  fetchDateDistribution: async (data: TextAnalysisUseCaseData[]) => {
    const dateDistributionData: DateDistributionData[] = []

    data.forEach((item) => {
      item.result.forEach((result) => {
        if (result.dataDistribution) {
          try {
            const rows = result.dataDistribution.trim().split('\n')
            const headers = rows[0].split(',')
            const parsedData = rows
              .slice(1)
              .map((row) => {
                const values = row.split(',')
                return {
                  time: values[0].trim(),
                  count: parseInt(values[1])
                }
              })
              .filter((item) => item.time && !isNaN(item.count))

            dateDistributionData.push(...parsedData)
          } catch (error) {
            console.error('Error parsing date distribution data:', error)
          }
        }
      })
    })

    return dateDistributionData
  },

  fetchSentimentData: async (data: TextAnalysisUseCaseData[]) => {
    console.log('Starting fetchSentimentData with input:', data)
    const sentimentData: SentimentDataArray = []

    data.forEach((item) => {
      item.result.forEach((result) => {
        if (result.sentiment) {
          const sentimentArray = Array.isArray(result.sentiment)
            ? result.sentiment
            : [result.sentiment]

          sentimentArray.forEach((sentiment) => {
            const category = sentiment as SentimentCategory
            sentimentData.push({
              name: category.name,
              values: category.values
            })
          })
        }
      })
    })

    return sentimentData
  },

  fetchWordCloudData: async (data: TextAnalysisUseCaseData[]) => {
    console.log('Starting fetchWordCloudData with input:', data)
    let wordCloudData: WordCloudData = { wordCloudData: [] }

    // Find the word cloud data in the results
    for (const item of data) {
      for (const result of item.result) {
        if (result.wordcloud) {
          console.log('Found wordcloud data:', result.wordcloud)
          wordCloudData = {
            wordCloudData: Array.isArray(result.wordcloud)
              ? result.wordcloud
              : []
          }
          return wordCloudData
        }
      }
    }

    console.log('No valid wordcloud data found in input')
    return wordCloudData
  },

  fetchDocumentSummary: async (data: TextAnalysisUseCaseData[]) => {
    console.log('Starting fetchDocumentSummary with input:', data)
    let documentSummary: DocumentSummaryData

    data.forEach((item) => {
      item.result.forEach((result) => {
        if (result.documentSummary) {
          documentSummary = result.documentSummary
        }
      })
    })

    if (!documentSummary) {
      throw new Error('No document summary data found')
    }

    return documentSummary
  }
}))
