'use client'

import { useMemo } from 'react'
import { Text, Badge } from '@radix-ui/themes'
import { useTheme } from '../../store/themeStore'
import { type SentimentData } from '../../store/dataStore'

interface SentimentTableProps {
  sentimentData: SentimentData[]
  hoveredDate: Date | null
  selectedDate: Date | null
  isTableVisible: boolean
  onToggleVisibility: () => void
}

// Consistent with SentimentChart colors
const getSentimentColor = (
  sentiment: string,
  theme: string = 'light'
): string => {
  if (theme === 'dark') {
    const colors = {
      '-2': '#63ccfa',
      '-1': '#af8fe0',
      '0': '#f3f4f6',
      '1': '#ffc069',
      '2': '#ff9f7b'
    }
    return colors[sentiment as keyof typeof colors] || '#f3f4f6'
  } else {
    const colors = {
      '-2': '#4fc3f7',
      '-1': '#9575cd',
      '0': '#e0e0e0',
      '1': '#ffb74d',
      '2': '#ff8a65'
    }
    return colors[sentiment as keyof typeof colors] || '#e0e0e0'
  }
}

const getSentimentLabel = (sentiment: string): string => {
  const labels = {
    '-2': 'Very Negative',
    '-1': 'Negative',
    '0': 'Neutral',
    '1': 'Positive',
    '2': 'Very Positive'
  }
  return labels[sentiment as keyof typeof labels] || 'Unknown'
}

const SentimentTable: React.FC<SentimentTableProps> = ({
  sentimentData,
  hoveredDate,
  selectedDate,
  isTableVisible,
  onToggleVisibility
}) => {
  const { theme } = useTheme()

  // Use selectedDate if available, otherwise use hoveredDate
  const displayDate = selectedDate || hoveredDate

  // Smart data processing
  const { processedData, summary } = useMemo(() => {
    if (!displayDate || !sentimentData.length) {
      return {
        processedData: [],
        summary: {
          total: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
          sentimentCounts: {}
        }
      }
    }

    const targetTime = displayDate.getTime()

    // Create a map from existing data
    const dataMap = new Map<string, { count: number; words: string[] }>()

    sentimentData.forEach((dataset) => {
      // Find closest timestamp
      const closestEntry = dataset.values.reduce((prev, curr) => {
        const prevTime = Math.abs(new Date(prev[0]).getTime() - targetTime)
        const currTime = Math.abs(new Date(curr[0]).getTime() - targetTime)
        return currTime < prevTime ? curr : prev
      })

      const sentiment = dataset.name.replace('+', '')
      const count = closestEntry[1]
      const words: string[] =
        closestEntry.length > 2 && Array.isArray(closestEntry[2])
          ? (closestEntry[2] as string[]).slice(0, 8) // Show more words
          : []

      dataMap.set(sentiment, { count, words })
    })

    // Ensure all sentiment scores from -2 to +2 are represented
    const allSentiments = ['-2', '-1', '0', '1', '2']
    const data = allSentiments.map((sentiment) => {
      const existing = dataMap.get(sentiment) || { count: 0, words: [] }
      return {
        sentiment,
        label: getSentimentLabel(sentiment),
        count: existing.count,
        words: existing.words
      }
    })

    // Calculate summary for each sentiment score
    const total = data.reduce((sum, item) => sum + item.count, 0)
    const positive = data
      .filter((item) => parseInt(item.sentiment) > 0)
      .reduce((sum, item) => sum + item.count, 0)
    const negative = data
      .filter((item) => parseInt(item.sentiment) < 0)
      .reduce((sum, item) => sum + item.count, 0)
    const neutral = data
      .filter((item) => parseInt(item.sentiment) === 0)
      .reduce((sum, item) => sum + item.count, 0)

    // Individual sentiment counts
    const sentimentCounts = data.reduce((acc, item) => {
      acc[item.sentiment] = item.count
      return acc
    }, {} as Record<string, number>)

    return {
      processedData: data,
      summary: { total, positive, negative, neutral, sentimentCounts }
    }
  }, [sentimentData, displayDate])

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Show initial message when no date is selected
  if (!displayDate) {
    return (
      <div className="mt-6 p-6 text-center text-gray-500 dark:text-gray-400 w-full">
        <Text size="2">
          Click on the chart to select and pin a date for detailed sentiment
          analysis
        </Text>
        <Text size="1" className="mt-2 block">
          You can hover over the chart to preview data or click to keep it
          displayed
        </Text>
      </div>
    )
  }

  return (
    <div className="mt-6 w-full">
      {/* Header with collapse/expand button */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Text
            size="4"
            weight="medium"
            className="text-gray-700 dark:text-gray-300"
          >
            Sentiment Details for {formatDate(displayDate)}
          </Text>
          {selectedDate && (
            <Badge variant="soft" color="purple" size="1">
              Pinned
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="soft" color="blue">
            {summary.total} total mentions
          </Badge>
          <button
            onClick={onToggleVisibility}
            className="ml-2 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600 transition-colors"
          >
            {isTableVisible ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Collapsible table content */}
      {isTableVisible && (
        <>
          {/* Custom Grid Layout */}
          <div className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="col-span-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Sentiment
              </div>
              <div className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Count
              </div>
              <div className="col-span-7 text-sm font-medium text-gray-700 dark:text-gray-300">
                Sample Words
              </div>
            </div>

            {/* Data Rows */}
            {processedData.map((row, index) => (
              <div
                key={row.sentiment}
                className={`grid grid-cols-12 gap-4 p-4 ${
                  index < processedData.length - 1
                    ? 'border-b border-gray-100 dark:border-gray-800'
                    : ''
                } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
              >
                {/* Sentiment Column */}
                <div className="col-span-3 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: getSentimentColor(row.sentiment, theme)
                    }}
                  />
                  <div className="min-w-0">
                    <Text size="2" weight="medium">
                      {row.label}
                    </Text>
                    <Text size="1" color="gray" className="block">
                      Score: {row.sentiment}
                    </Text>
                  </div>
                </div>

                {/* Count Column */}
                <div className="col-span-2 flex items-center">
                  <Text size="2" weight="bold" className="font-mono">
                    {row.count.toLocaleString()}
                  </Text>
                </div>

                {/* Sample Words Column */}
                <div className="col-span-7 flex items-center">
                  {row.words.length > 0 ? (
                    <div className="flex gap-1 flex-wrap items-center">
                      {row.words.slice(0, 6).map((word) => (
                        <Badge
                          key={word}
                          variant="soft"
                          size="1"
                          style={{
                            backgroundColor: `${getSentimentColor(
                              row.sentiment,
                              theme
                            )}20`,
                            color: getSentimentColor(row.sentiment, theme)
                          }}
                        >
                          {word}
                        </Badge>
                      ))}
                      {row.words.length > 6 && (
                        <Text size="1" color="gray">
                          +{row.words.length - 6} more words
                        </Text>
                      )}
                    </div>
                  ) : (
                    <Text size="1" color="gray">
                      No words available
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Text size="2" weight="medium" className="block mb-2">
              Summary Statistics
            </Text>
            <div className="flex gap-3 flex-wrap">
              {processedData.map((item) => (
                <Badge
                  key={item.sentiment}
                  variant="soft"
                  size="2"
                  style={{
                    backgroundColor: `${getSentimentColor(
                      item.sentiment,
                      theme
                    )}20`,
                    color: getSentimentColor(item.sentiment, theme),
                    border: `1px solid ${getSentimentColor(
                      item.sentiment,
                      theme
                    )}40`
                  }}
                >
                  {item.label}: {item.count} (
                  {summary.total
                    ? ((item.count / summary.total) * 100).toFixed(1)
                    : 0}
                  %)
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SentimentTable
