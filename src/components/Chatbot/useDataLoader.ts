import { useState, useEffect } from 'react'
import { ChatbotResult, KnowledgeBase } from './_types'
import { ChatbotUseCaseData } from '../../services/chatbotApi'

export interface DataLoadingState {
  knowledgeBase: KnowledgeBase | null
  isLoading: boolean
  error: string | null
}

/**
 * Custom hook for loading and transforming chatbot data from compute results
 * Converts ChatbotUseCaseData into KnowledgeBase format for the chat interface
 * Note: This is for local UI state only - the actual knowledge is handled by the API
 */
export function useDataLoader(
  chatbotData: ChatbotUseCaseData[] = []
): DataLoadingState {
  const [state, setState] = useState<DataLoadingState>({
    knowledgeBase: null,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const transformData = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        // Handle empty database
        if (!chatbotData || chatbotData.length === 0) {
          setState({
            knowledgeBase: null,
            isLoading: false,
            error: null
          })
          return
        }

        // Aggregate data from all chatbot results for local UI display
        const aggregatedKnowledgeBase: KnowledgeBase = {
          domains: {},
          allChunks: [],
          searchIndex: {},
          totalChunks: 0
        }

        // Process each chatbot record
        for (const record of chatbotData) {
          if (!record.result || record.result.length === 0) {
            continue
          }

          for (const result of record.result) {
            // Process knowledge base chunks
            if (result.knowledgeBase?.chunks) {
              // Add chunks to aggregated list
              aggregatedKnowledgeBase.allChunks.push(
                ...result.knowledgeBase.chunks
              )

              // Merge search index if available (for UI purposes only)
              if (result.knowledgeBase.searchIndex) {
                Object.entries(result.knowledgeBase.searchIndex).forEach(
                  ([term, chunkIds]) => {
                    if (!aggregatedKnowledgeBase.searchIndex[term]) {
                      aggregatedKnowledgeBase.searchIndex[term] = []
                    }
                    aggregatedKnowledgeBase.searchIndex[term].push(...chunkIds)
                  }
                )
              }
            }

            // Process domain information
            if (result.domainInfo) {
              const domainName = result.domainInfo.domain
              if (!aggregatedKnowledgeBase.domains[domainName]) {
                aggregatedKnowledgeBase.domains[domainName] = {
                  name: domainName,
                  entities: [],
                  timeRange: result.domainInfo.timeRange,
                  description: result.domainInfo.description,
                  chunkCount: 0
                }
              }

              // Merge entities (remove duplicates)
              const existingEntities =
                aggregatedKnowledgeBase.domains[domainName].entities || []
              const newEntities = result.domainInfo.entities || []
              aggregatedKnowledgeBase.domains[domainName].entities = [
                ...new Set([...existingEntities, ...newEntities])
              ]

              // Update chunk count for this domain
              const domainChunks = aggregatedKnowledgeBase.allChunks.filter(
                (chunk) => chunk.metadata.source?.includes(domainName)
              )
              aggregatedKnowledgeBase.domains[domainName].chunkCount =
                domainChunks.length
            }
          }
        }

        // Update total chunk count
        aggregatedKnowledgeBase.totalChunks =
          aggregatedKnowledgeBase.allChunks.length

        // Build search index for remaining terms (UI purposes only)
        aggregatedKnowledgeBase.allChunks.forEach((chunk) => {
          const content = chunk.content.toLowerCase()
          const words = content.split(/\s+/)

          words.forEach((word) => {
            // Skip very short words and common words
            if (word.length > 3) {
              const cleanWord = word.replace(/[^\w]/g, '')
              if (cleanWord.length > 3) {
                if (!aggregatedKnowledgeBase.searchIndex[cleanWord]) {
                  aggregatedKnowledgeBase.searchIndex[cleanWord] = []
                }
                if (
                  !aggregatedKnowledgeBase.searchIndex[cleanWord].includes(
                    chunk.id
                  )
                ) {
                  aggregatedKnowledgeBase.searchIndex[cleanWord].push(chunk.id)
                }
              }
            }
          })
        })

        setState({
          knowledgeBase: aggregatedKnowledgeBase,
          isLoading: false,
          error: null
        })
      } catch (error) {
        console.error('❌ Error transforming chatbot data:', error)
        setState({
          knowledgeBase: null,
          isLoading: false,
          error: error.message || 'Failed to process knowledge base'
        })
      }
    }

    transformData()
  }, [chatbotData])

  return state
}

/**
 * Legacy search function - kept for backward compatibility but not used with API
 * The actual search is now handled by the backend RAG pipeline
 */
export function searchKnowledgeBase(
  query: string,
  knowledgeBase: KnowledgeBase,
  maxResults: number = 3
): Array<{
  id: string
  content: string
  metadata: any
  score?: number
}> {
  console.warn(
    '⚠️ searchKnowledgeBase called - this is deprecated with API integration'
  )

  if (!knowledgeBase || !knowledgeBase.allChunks.length) {
    return []
  }

  // Simple keyword matching for backward compatibility
  const queryTerms = query
    .toLowerCase()
    .split(' ')
    .filter((term) => term.length > 2)

  const scoredChunks = knowledgeBase.allChunks.map((chunk) => {
    let score = 0
    const content = chunk.content.toLowerCase()

    queryTerms.forEach((term) => {
      const matches = (content.match(new RegExp(term, 'g')) || []).length
      score += matches
    })

    return { ...chunk, score }
  })

  return scoredChunks
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}
