import { GetServerSideProps } from 'next'
import { SitemapGenerator } from '../utils/seo/sitemapGenerator'

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const sitemap = await SitemapGenerator.generateSitemap()

    res.setHeader('Content-Type', 'application/xml')
    res.setHeader(
      'Cache-Control',
      'public, max-age=86400, stale-while-revalidate'
    )
    res.write(sitemap)
    res.end()
  } catch (error) {
    console.error('Error generating sitemap:', error)
    res.statusCode = 500
    res.end('Error generating sitemap')
  }

  return { props: {} }
}

const Sitemap = () => null
export default Sitemap
