import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext
} from 'next/document'
import site from '../../content/site.json'

function resolvePathFromNextData(
  page?: string,
  query?: Record<string, any>
): string {
  if (!page) return '/'
  // Replace dynamic segments like /privacy/[slug]
  const filled = page.replace(/\[([^\]]+)\]/g, (_m, key) => {
    const value = query?.[key]
    return Array.isArray(value) ? value.join('/') : value || ''
  })
  return filled || '/'
}

export default class MyDocument extends Document<{
  canonical: string
  pagePath: string
}> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)

    const nextData = (initialProps as any).__NEXT_DATA__ || {}
    const page = nextData.page as string
    const query = (nextData.query || {}) as Record<string, any>

    const resolvedPath = resolvePathFromNextData(page, query)
    const normalizedPath = resolvedPath === '/' ? '' : resolvedPath
    const canonical = `${site.siteUrl}${normalizedPath}`.replace(/\/$/, '')

    return {
      ...initialProps,
      canonical,
      pagePath: resolvedPath
    }
  }

  render() {
    const nextData = (this.props as any).__NEXT_DATA__ || {}
    const providedPath = (this.props as any).pagePath as string
    const computedPath = resolvePathFromNextData(
      nextData.page as string,
      (nextData.query || {}) as Record<string, any>
    )
    const pagePath = providedPath || computedPath || '/'
    const canonical = `${(site as any).siteUrl}${
      pagePath === '/' ? '' : pagePath
    }`.replace(/\/$/, '')
    const isHome = !pagePath || pagePath === '/'
    const robots =
      process.env.VERCEL_ENV === 'production' ||
      process.env.NODE_ENV === 'production'
        ? 'index,follow'
        : 'noindex,nofollow'

    const organizationLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: (site as any).siteTitle,
      url: (site as any).siteUrl,
      logo: `${(site as any).siteUrl}${(site as any).siteImage}`
    }

    const websiteLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: (site as any).siteUrl,
      name: (site as any).siteTitle
    }

    return (
      <Html lang="en">
        <Head>
          <link rel="canonical" href={canonical} />
          <meta name="robots" content={robots} />
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationLd).replace(/</g, '\\u003c')
            }}
          />
          {isHome && (
            <script
              type="application/ld+json"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(websiteLd).replace(/</g, '\\u003c')
              }}
            />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
