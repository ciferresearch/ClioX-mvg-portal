import { ReactElement } from 'react'
import Head from 'next/head'

import { isBrowser } from '@utils/index'
import { useMarketMetadata } from '@context/MarketMetadata'
import { SchemaManager } from './SchemaManager'

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

  // Determine page type for schema
  const getPageType = (): 'home' | 'article' | 'resource' | 'page' => {
    if (uri === '/') return 'home'
    if (uri.startsWith('/articles/')) return 'article'
    if (uri.startsWith('/resources')) return 'resource'
    return 'page'
  }

  const pageType = getPageType()

  return (
    <Head>
      <html lang="en" />

      <title>{pageTitle}</title>

      {isBrowser && window?.location?.hostname !== 'cliox.org' && (
        <meta name="robots" content="noindex,nofollow" />
      )}

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
      {isBrowser && window?.location?.hostname === 'cliox.org' && (
        <meta name="twitter:creator" content="@ClioX" />
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || siteContent?.siteTitle} />
      <meta name="twitter:description" content={pageDescription} />

      <SchemaManager
        type={pageType}
        title={title}
        description={pageDescription}
        url={canonical}
        author="ClioX Team"
        publishDate={new Date().toISOString()}
        modifiedDate={new Date().toISOString()}
        image={`${siteContent?.siteUrl}${siteContent?.siteImage}`}
        tags={['digital heritage', 'cultural archives', 'web3', 'gaia-x']}
      />

      <script
        defer
        data-domain="cliox.org"
        src="https://plausible.io/js/script.js"
      ></script>
    </Head>
  )
}
