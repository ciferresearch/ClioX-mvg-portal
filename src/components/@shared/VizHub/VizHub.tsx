'use client'

import { useMemo, useEffect } from 'react'
import SentimentChart from './visualizations/sentiment/SentimentChart'
import DataDistribution from './visualizations/distribution/DataDistribution'
import WordCloud from './visualizations/wordcloud'
import DocumentSummary from './visualizations/summary/DocumentSummary'
import VisualizationWrapper from './ui/common/VisualizationWrapper'
// import LoadingIndicator from './ui/common/LoadingIndicator'
import FutureFeatures from './ui/common/FutureFeatures'
import { useVizHubData } from './hooks/useVizHubData'
import { VizHubThemeProvider } from './store/themeStore'
import type {
  VizHubProps,
  VizHubConfig,
  UseCaseConfig,
  VizHubExtension
} from './types'
import {
  setWordCloudPrefsNamespace,
  useWordCloudStore
} from './visualizations/wordcloud/store'
import { setStoplistStorageNamespace } from './visualizations/wordcloud/useStoplistManager'

/**
 * Helper function to resolve component visibility with backward compatibility
 */
function resolveComponentVisibility(config: VizHubConfig) {
  // New components config takes precedence, fallback to legacy config
  return {
    wordCloud: config.components?.wordCloud ?? config.showWordCloud ?? true,
    sentiment: config.components?.sentiment ?? config.showSentiment ?? true,
    emailDistribution:
      config.components?.emailDistribution ??
      config.showEmailDistribution ??
      true,
    dateDistribution:
      config.components?.dateDistribution ??
      config.showDateDistribution ??
      true,
    documentSummary:
      config.components?.documentSummary ?? config.showDocumentSummary ?? true,
    futureFeatures:
      config.components?.futureFeatures ?? config.showFutureFeatures ?? true
  }
}

/**
 * Helper function to render extensions at a specific position
 */
function renderExtensions(
  extensions: VizHubExtension[] = [],
  position: VizHubExtension['position'],
  useCaseConfig: UseCaseConfig
) {
  return extensions
    .filter((ext) => ext.position === position)
    .map((ext) => {
      const Component = ext.component
      return (
        <Component
          key={ext.id}
          useCaseConfig={useCaseConfig}
          {...(ext.props || {})}
        />
      )
    })
}

/**
 * Internal VizHub component that expects to be within a theme provider
 */
function VizHubInternal({
  data,
  config,
  useCaseConfig,
  className = '',
  theme = 'light',
  preferencesNamespace
}: VizHubProps) {
  // Namespace preferences for word cloud
  useMemo(() => {
    setWordCloudPrefsNamespace(preferencesNamespace)
    setStoplistStorageNamespace(preferencesNamespace)
  }, [preferencesNamespace])

  // Reload namespaced preferences when namespace changes
  const { loadPreferencesFromStorage } = useWordCloudStore()
  useEffect(() => {
    loadPreferencesFromStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesNamespace])
  const {
    dataStatus,
    config: effectiveConfig,
    hasAnyData
  } = useVizHubData(data, config, useCaseConfig)

  // Resolve component visibility with backward compatibility
  const componentVisibility = resolveComponentVisibility(effectiveConfig)

  // Get customization settings
  const customization = effectiveConfig.customization || {}

  // Get extensions
  const extensions = effectiveConfig.extensions || []

  // No localStorage data side-effects in pure mode

  // Pure mode: no internal loading/error states here

  // Show empty state if no data is available
  if (!hasAnyData) {
    return (
      <div className={`vizhub-container ${className}`}>
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No Data Available</div>
          <div className="text-gray-400 text-sm">
            Please provide data via the data prop
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`vizhub-container ${theme} ${className}`}>
      <div className="p-6">
        <div className="w-full">
          <main>
            {/* Debug info removed: pure props mode */}

            {/* Distribution Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Email Distribution */}
              {componentVisibility.emailDistribution && (
                <VisualizationWrapper
                  isAvailable={dataStatus.emailDistributionData}
                  title={
                    customization.emailDistribution?.title ||
                    'Email Distribution'
                  }
                  className=""
                >
                  <DataDistribution
                    title={
                      customization.emailDistribution?.title ||
                      'Data Distribution on Email Counts'
                    }
                    description={`Shows the distribution of ${
                      customization.emailDistribution?.unit || 'email counts'
                    } over time`}
                    type="email"
                    data={data?.emailDistribution}
                    customization={customization.emailDistribution}
                  />
                </VisualizationWrapper>
              )}

              {/* Date Distribution */}
              {componentVisibility.dateDistribution && (
                <VisualizationWrapper
                  isAvailable={dataStatus.dateDistributionData}
                  title={
                    customization.dateDistribution?.title || 'Date Distribution'
                  }
                  className=""
                >
                  <DataDistribution
                    title={
                      customization.dateDistribution?.title ||
                      'Data Distribution on Date'
                    }
                    description="Shows the distribution of items by date"
                    type="date"
                    data={data?.dateDistribution}
                    customization={customization.dateDistribution}
                  />
                </VisualizationWrapper>
              )}
            </div>

            {/* Extensions: before-sentiment */}
            {renderExtensions(extensions, 'before-sentiment', useCaseConfig)}

            {/* Sentiment Analysis */}
            {componentVisibility.sentiment && (
              <VisualizationWrapper
                isAvailable={dataStatus.sentimentData}
                title="Sentiment Analysis"
              >
                <SentimentChart data={data?.sentiment} />
              </VisualizationWrapper>
            )}

            {/* Extensions: after-sentiment */}
            {renderExtensions(extensions, 'after-sentiment', useCaseConfig)}

            {/* Extensions: before-wordcloud */}
            {renderExtensions(extensions, 'before-wordcloud', useCaseConfig)}

            {/* Word Cloud */}
            {componentVisibility.wordCloud && (
              <VisualizationWrapper
                isAvailable={dataStatus.wordCloudData}
                title="Word Cloud"
              >
                <WordCloud
                  wordsOverride={data?.wordCloud?.wordCloudData || []}
                />
              </VisualizationWrapper>
            )}

            {/* Extensions: after-wordcloud */}
            {renderExtensions(extensions, 'after-wordcloud', useCaseConfig)}

            {/* Document Summary */}
            {componentVisibility.documentSummary && (
              <VisualizationWrapper
                isAvailable={dataStatus.documentSummaryData}
                title="Document Summary"
              >
                <DocumentSummary data={data?.documentSummary} />
              </VisualizationWrapper>
            )}

            {/* Future Features */}
            {componentVisibility.futureFeatures && <FutureFeatures />}

            {/* Extensions: footer */}
            {renderExtensions(extensions, 'footer', useCaseConfig)}
          </main>

          {/* Extensions: sidebar */}
          {extensions.some((ext) => ext.position === 'sidebar') && (
            <aside className="w-full md:w-80 mt-6 md:mt-0 md:ml-6">
              {renderExtensions(extensions, 'sidebar', useCaseConfig)}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * VizHub Component - A self-contained visualization dashboard
 *
 * This component can be used in two modes:
 * 1. With external data (passed via props) - recommended for integration
 * 2. With localStorage data (fallback mode) - for standalone usage
 */
export default function VizHub(props: VizHubProps) {
  return (
    <VizHubThemeProvider theme={props.theme}>
      <VizHubInternal {...props} />
    </VizHubThemeProvider>
  )
}
