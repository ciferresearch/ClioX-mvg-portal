'use client'

import { database } from '../@context/UseCases'
import type { TextAnalysisResult as TextAnalysisResultType } from '../components/TextAnalysis/_types'
import type { CameroonGazetteResult as CameroonGazetteResultType } from '../components/CameroonGazette/_types'

async function fetchText(path: string): Promise<string> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to fetch ${path}`)
  return res.text()
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to fetch ${path}`)
  return res.json()
}

async function fetchTextWithFallback(paths: string[]): Promise<string> {
  for (const p of paths) {
    try {
      return await fetchText(p)
    } catch (_) {}
  }
  throw new Error(`Failed to fetch any of: ${paths.join(', ')}`)
}

async function fetchJsonWithFallback<T>(paths: string[]): Promise<T> {
  for (const p of paths) {
    try {
      return await fetchJson<T>(p)
    } catch (_) {}
  }
  throw new Error(`Failed to fetch any of: ${paths.join(', ')}`)
}

function buildSentimentMock(): any[] {
  const now = new Date().toISOString()
  const dayBefore = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  return [
    {
      name: '-2',
      values: [
        [dayBefore, 2],
        [now, 1]
      ]
    },
    {
      name: '-1',
      values: [
        [dayBefore, 5],
        [now, 3]
      ]
    },
    {
      name: '0',
      values: [
        [dayBefore, 10],
        [now, 8]
      ]
    },
    {
      name: '+1',
      values: [
        [dayBefore, 7],
        [now, 9]
      ]
    },
    {
      name: '+2',
      values: [
        [dayBefore, 1],
        [now, 2]
      ]
    }
  ]
}

export async function seedTextAnalysisFromSamples(): Promise<void> {
  // Prefer samples/text/* then fallback to samples/*
  const dateCsv = await fetchTextWithFallback([
    '/samples/text/date_distribution.csv',
    '/samples/date_distribution.csv'
  ])
  const emailCsv = await fetchTextWithFallback([
    '/samples/text/email_distribution.csv',
    '/samples/email_distribution.csv'
  ]).catch(() => dateCsv)
  const summary = await fetchJsonWithFallback<any>([
    '/samples/text/document_summary.json',
    '/samples/document_summary.json'
  ])
  const sentimentJson = await fetchJsonWithFallback<any[]>([
    '/samples/text/sentiment.json',
    '/samples/sentiment.json'
  ]).catch(() => [])
  const wordcloudJson = await fetchJsonWithFallback<any>([
    '/samples/text/wordcloud.json',
    '/samples/wordcloud.json'
  ]).catch(() => null)

  const wordcloud = Array.isArray(wordcloudJson?.wordCloudData)
    ? wordcloudJson.wordCloudData
    : Array.isArray(wordcloudJson)
    ? wordcloudJson
    : []

  const sentiment = Array.isArray(sentimentJson) ? sentimentJson : []

  const result: TextAnalysisResultType = {
    wordcloud,
    sentiment,
    dataDistribution: dateCsv,
    emailDistribution: emailCsv,
    documentSummary: summary
  }

  const row: any = {
    job: { jobId: `mock-${Date.now()}` },
    result: [result]
  }

  await database.textAnalysises.put(row as any)
}

export async function clearTextAnalysis(): Promise<void> {
  await database.textAnalysises.clear()
}

export async function seedCameroonGazetteFromSamples(): Promise<void> {
  const dateCsv = await fetchTextWithFallback([
    '/samples/cameroon/date_distribution.csv',
    '/samples/date_distribution.csv'
  ])
  const emailCsv = await fetchTextWithFallback([
    '/samples/cameroon/email_distribution.csv',
    '/samples/email_distribution.csv'
  ]).catch(() => dateCsv)
  const summary = await fetchJsonWithFallback<any>([
    '/samples/cameroon/document_summary.json',
    '/samples/document_summary.json'
  ])
  const sentiment = await fetchJsonWithFallback<any[]>([
    '/samples/cameroon/sentiment.json',
    '/samples/sentiment.json'
  ]).catch(() => [])
  const wordcloudJson = await fetchJsonWithFallback<any>([
    '/samples/cameroon/wordcloud.json',
    '/samples/wordcloud.json'
  ]).catch(() => null)

  const wordcloud = Array.isArray(wordcloudJson?.wordCloudData)
    ? wordcloudJson.wordCloudData
    : Array.isArray(wordcloudJson)
    ? wordcloudJson
    : []

  const result: CameroonGazetteResultType = {
    wordcloud,
    sentiment,
    dataDistribution: dateCsv,
    emailDistribution: emailCsv,
    documentSummary: summary
  }

  const row: any = {
    job: { jobId: `mock-${Date.now()}` },
    result: [result]
  }

  await database.cameroonGazettes.put(row as any)
}

export async function clearCameroonGazette(): Promise<void> {
  await database.cameroonGazettes.clear()
}

// Optional: expose helpers in dev for console use
if (typeof window !== 'undefined') {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEV_SEED === 'true'
  if (enabled) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__dev = {
      seed: async (which: 'text' | 'cameroon') =>
        which === 'text'
          ? seedTextAnalysisFromSamples()
          : seedCameroonGazetteFromSamples(),
      clear: async (which: 'text' | 'cameroon') =>
        which === 'text' ? clearTextAnalysis() : clearCameroonGazette()
    }
  }
}
