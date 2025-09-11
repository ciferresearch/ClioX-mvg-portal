import { ReactElement } from 'react'
import Head from 'next/head'
import Script from 'next/script'

import { useMarketMetadata } from '@context/MarketMetadata'
import { DatasetSchema } from './DatasetSchema'

export default function Seo({
  title,
  description,
  uri
}: {
  title?: string
  description?: string
  uri: string
}): ReactElement {
  const { siteContent } = useMarketMetadata()

  // Remove trailing slash from all URLs
  const canonical = `${siteContent?.siteUrl}${uri}`.replace(/\/$/, '')

  // Avoid client/server divergence by not depending on window during render
  let isProdHostname = false
  try {
    const host = new URL(siteContent?.siteUrl || '').hostname
    isProdHostname = host === 'cliox.org' || host === 'www.cliox.org'
  } catch {
    isProdHostname = false
  }

  const pageTitle =
    uri === '/'
      ? siteContent?.siteTitle
      : title
      ? `${title} - ${siteContent?.siteTitle}`
      : `${siteContent?.siteTitle} — ${siteContent?.siteTagline}`

  // Provide fallback description if none is provided
  const pageDescription =
    description ||
    siteContent?.siteTagline ||
    'Building a sustainable and ethical future for digital archives and cultural heritage'

  const datasetSchema = DatasetSchema()

  return (
    <>
      <Head>
        <title>{pageTitle}</title>

        {!isProdHostname && <meta name="robots" content="noindex,nofollow" />}

        <link rel="canonical" href={canonical} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="var(--background-content)" />

        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={title || siteContent?.siteTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonical} />

        <meta
          name="image"
          content={`${siteContent?.siteUrl}${siteContent?.siteImage}`}
        />
        <meta
          property="og:image"
          content={`${siteContent?.siteUrl}${siteContent?.siteImage}`}
        />

        <meta property="og:site_name" content={siteContent?.siteTitle} />
        {isProdHostname && <meta name="twitter:creator" content="@ClioX" />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title || siteContent?.siteTitle} />
        <meta name="twitter:description" content={pageDescription} />

        {datasetSchema && (
          <script type="application/ld+json" id="datasetSchema">
            {JSON.stringify(datasetSchema).replace(/</g, '\\u003c')}
          </script>
        )}
      </Head>
      <Script
        strategy="afterInteractive"
        data-domain="cliox.org"
        src="https://plausible.io/js/script.js"
      />
    </>
  )
}
