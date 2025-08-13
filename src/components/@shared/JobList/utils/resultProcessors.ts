import type { ComputeFile } from '../types'

/**
 * Common result processing utilities for different use cases
 */

export interface TextAnalysisResult {
  wordcloud?: any
  sentiment?: any
  dataDistribution?: string
  emailDistribution?: string
  documentSummary?: any
}

export interface CameroonGazetteResult {
  wordcloud?: any
  sentiment?: any
  dataDistribution?: string
  emailDistribution?: string
  documentSummary?: any
}

/**
 * Process TextAnalysis compute results
 */
export function processTextAnalysisResults(
  files: ComputeFile[]
): TextAnalysisResult[] {
  return files.map((file) => {
    const { filename, content: fileContent } = file
    const filenameLower = filename.toLowerCase()
    let content = fileContent

    if (filenameLower.endsWith('.json')) {
      try {
        content = JSON.parse(fileContent)
      } catch (error) {
        console.error('Error parsing JSON content:', error)
        return {}
      }
    }

    const result: TextAnalysisResult = {}

    if (
      filenameLower.includes('wordcloud') ||
      filenameLower.includes('word_cloud')
    ) {
      result.wordcloud = content
    } else if (filenameLower.includes('sentiment')) {
      try {
        let parsedContent
        if (typeof content === 'string') {
          parsedContent = JSON.parse(content)
        } else if (typeof content === 'object' && content !== null) {
          parsedContent = content
        } else {
          console.warn('Invalid sentiment content type:', typeof content)
          return result
        }

        if (!Array.isArray(parsedContent)) {
          console.warn(
            'Sentiment data should be an array of sentiment categories'
          )
          return result
        }

        const validSentimentData = parsedContent.every((category) => {
          return (
            typeof category === 'object' &&
            category !== null &&
            typeof category.name === 'string' &&
            Array.isArray(category.values) &&
            category.values.every(
              (value) =>
                Array.isArray(value) &&
                (value.length === 2 || value.length === 3) &&
                typeof value[0] === 'string' &&
                typeof value[1] === 'number' &&
                !isNaN(value[1]) &&
                (value.length === 2 ||
                  (Array.isArray(value[2]) &&
                    value[2].every((v) => typeof v === 'string')))
            )
          )
        })

        if (!validSentimentData) {
          console.warn('Invalid sentiment data structure:', parsedContent)
          return result
        }

        result.sentiment = parsedContent
      } catch (error) {
        console.error('Error processing sentiment data:', error)
        return result
      }
    } else if (filenameLower.includes('date_distribution')) {
      result.dataDistribution = content
    } else if (filenameLower.includes('email_distribution')) {
      result.emailDistribution = content
    } else if (filenameLower.includes('document_summary')) {
      result.documentSummary = content
    }

    return result
  })
}

/**
 * Process CameroonGazette compute results
 * Uses the same logic as TextAnalysis for now, but can be customized
 */
export function processCameroonGazetteResults(
  files: ComputeFile[]
): CameroonGazetteResult[] {
  return processTextAnalysisResults(files) as CameroonGazetteResult[]
}
