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

    // Prefer ctx.pathname/ctx.query which are available during SSG/SSR
    const pageFromCtx = (ctx as any).pathname as string
    const queryFromCtx = ((ctx as any).query || {}) as Record<string, any>

    let resolvedPath = resolvePathFromNextData(pageFromCtx, queryFromCtx)

    // Fallback to __NEXT_DATA__ if needed
    if (!resolvedPath || resolvedPath === '/') {
      const nextData = (initialProps as any).__NEXT_DATA__ || {}
      resolvedPath = resolvePathFromNextData(
        nextData.page as string,
        (nextData.query || {}) as Record<string, any>
      )
    }

    // Final fallback to request URL (SSR only)
    if ((!resolvedPath || resolvedPath === '/') && ctx.req?.url) {
      resolvedPath = ctx.req.url.split('?')[0].split('#')[0]
    }
    const normalizedPath = resolvedPath === '/' ? '' : resolvedPath
    const canonical = `${site.siteUrl}${normalizedPath}`.replace(/\/$/, '')

    return {
      ...initialProps,
      canonical,
      pagePath: resolvedPath
    }
  }

  render() {
    const pagePath = (this.props as any).pagePath as string
    const canonical = (this.props as any).canonical as string
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
