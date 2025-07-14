import { useState, useEffect } from 'react'
import { ChatbotResult, KnowledgeBase } from './_types'

// Temporary interface until we create the proper model
interface ChatbotUseCaseData {
  id?: number
  job: ComputeJobMetaData
  result: ChatbotResult[]
}

export interface DataLoadingState {
  knowledgeBase: KnowledgeBase | null
  isLoading: boolean
  error: string | null
}

/**
 * Custom hook for loading and transforming chatbot data from compute results
 * Converts ChatbotUseCaseData into KnowledgeBase format for the chat interface
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

        // Aggregate data from all chatbot results
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

              // Merge search index
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

              // Count chunks for this domain
              const domainChunks = aggregatedKnowledgeBase.allChunks.filter(
                (chunk) =>
                  chunk.metadata.source?.includes(domainName.split('-')[0])
              )
              aggregatedKnowledgeBase.domains[domainName].chunkCount =
                domainChunks.length
            }
          }
        }

        // Remove duplicate chunks (by ID)
        const uniqueChunks = aggregatedKnowledgeBase.allChunks.filter(
          (chunk, index, self) =>
            index === self.findIndex((c) => c.id === chunk.id)
        )
        aggregatedKnowledgeBase.allChunks = uniqueChunks
        aggregatedKnowledgeBase.totalChunks = uniqueChunks.length

        // Remove duplicate entries from search index
        Object.keys(aggregatedKnowledgeBase.searchIndex).forEach((term) => {
          aggregatedKnowledgeBase.searchIndex[term] = [
            ...new Set(aggregatedKnowledgeBase.searchIndex[term])
          ]
        })

        setState({
          knowledgeBase: aggregatedKnowledgeBase,
          isLoading: false,
          error: null
        })
      } catch (err) {
        console.error('Error transforming chatbot data:', err)
        setState({
          knowledgeBase: null,
          isLoading: false,
          error:
            err instanceof Error
              ? err.message
              : 'Unknown error occurred while processing chatbot data'
        })
      }
    }

    transformData()
  }, [chatbotData])

  return state
}

/**
 * Helper function to search knowledge base for relevant chunks
 */
export function searchKnowledgeBase(
  query: string,
  knowledgeBase: KnowledgeBase,
  maxResults: number = 3
): Array<{ content: string; metadata: any; relevance: number }> {
  if (!knowledgeBase || !query.trim()) {
    return []
  }

  const searchTerms = query.toLowerCase().split(' ')
  const results: Array<{ content: string; metadata: any; relevance: number }> =
    []

  // Search through all chunks
  knowledgeBase.allChunks.forEach((chunk) => {
    let relevance = 0
    const chunkContent = chunk.content.toLowerCase()

    // Check for exact matches in content
    searchTerms.forEach((term) => {
      const termCount = (chunkContent.match(new RegExp(term, 'g')) || []).length
      relevance += termCount * 2
    })

    // Check for matches in metadata
    const metadataStr = JSON.stringify(chunk.metadata).toLowerCase()
    searchTerms.forEach((term) => {
      if (metadataStr.includes(term)) {
        relevance += 1
      }
    })

    // Check search index for additional relevance
    searchTerms.forEach((term) => {
      if (
        knowledgeBase.searchIndex[term] &&
        knowledgeBase.searchIndex[term].includes(chunk.id)
      ) {
        relevance += 3
      }
    })

    if (relevance > 0) {
      results.push({
        content: chunk.content,
        metadata: chunk.metadata,
        relevance
      })
    }
  })

  // Sort by relevance and return top results
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, maxResults)
}
