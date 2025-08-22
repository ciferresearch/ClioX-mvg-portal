interface SitemapPage {
  url: string
  lastmod?: string
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'
  priority?: number
}

export class SitemapGenerator {
  static async generateSitemap(): Promise<string> {
    const staticPages: SitemapPage[] = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/resources', changefreq: 'weekly', priority: 0.8 },
      { url: '/privacy/en', changefreq: 'monthly', priority: 0.3 },
      { url: '/terms', changefreq: 'monthly', priority: 0.3 },
      { url: '/imprint', changefreq: 'monthly', priority: 0.3 }
    ]

    const dynamicPages = await this.getDynamicPages()
    const allPages = [...staticPages, ...dynamicPages]

    return this.buildXML(allPages)
  }

  private static async getDynamicPages(): Promise<SitemapPage[]> {
    const pages: SitemapPage[] = []

    try {
      // Add article pages
      const articles = await this.getArticles()
      articles.forEach((article) => {
        pages.push({
          url: `/articles/${article.slug}`,
          lastmod: article.publishDate,
          changefreq: 'monthly',
          priority: 0.6
        })
      })

      // Add resource pages
      const resources = await this.getResources()
      resources.forEach((resource) => {
        pages.push({
          url: resource.link,
          lastmod: resource.lastModified,
          changefreq: 'monthly',
          priority: 0.5
        })
      })

      // Note: Use case pages are blocked by robots.txt for privacy
      // We don't include them in sitemap to maintain consistency
    } catch (error) {
      console.warn('Error fetching dynamic pages for sitemap:', error)
    }

    return pages
  }

  private static async getArticles(): Promise<any[]> {
    try {
      // This would typically fetch from your CMS or API
      // For now, return the hardcoded article we know exists
      return [
        {
          slug: 'web-evolution',
          publishDate: '2025-06-05'
        }
      ]
    } catch (error) {
      return []
    }
  }

  private static async getResources(): Promise<any[]> {
    try {
      // This would typically fetch from your resources API
      return []
    } catch (error) {
      return []
    }
  }

  // Note: Use case pages are blocked by robots.txt for privacy
  // This method is kept for future reference but not used in sitemap
  private static async getUseCases(): Promise<any[]> {
    try {
      // This would typically fetch from your use cases API
      // Currently blocked by robots.txt for privacy protection
      return []
    } catch (error) {
      return []
    }
  }

  private static buildXML(pages: SitemapPage[]): string {
    const baseUrl = 'https://cliox.org'
    const now = new Date().toISOString()

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    pages.forEach((page) => {
      xml += '  <url>\n'
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`
      if (page.lastmod) {
        xml += `    <lastmod>${page.lastmod}</lastmod>\n`
      } else {
        xml += `    <lastmod>${now}</lastmod>\n`
      }
      if (page.changefreq) {
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`
      }
      if (page.priority) {
        xml += `    <priority>${page.priority}</priority>\n`
      }
      xml += '  </url>\n'
    })

    xml += '</urlset>'
    return xml
  }
}
