import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const robotsTxt = `# ClioX Privacy-Focused Robots.txt
# We prioritize user privacy while maintaining search engine visibility

User-agent: *

# Sitemap for public content discovery
Sitemap: https://cliox.org/sitemap.xml

# === PUBLIC CONTENT - ALLOWED FOR SEARCH ENGINES ===
# Only essential public pages are allowed for indexing
Allow: /
Allow: /resources
Allow: /articles
Allow: /privacy/en
Allow: /terms
Allow: /imprint

# === PRIVATE USER DATA - BLOCKED ===
# Block access to all user-generated and personal data
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
Disallow: /profile/
Disallow: /asset/
Disallow: /search
Disallow: /bookmarks
Disallow: /onboarding/
Disallow: /usecases
Disallow: /verify
Disallow: /faucet

# === PLATFORM FUNCTIONALITY - BLOCKED FOR PRIVACY ===
# Block all publish pages to protect user intent and business data
Disallow: /publish/

# === INTERNAL SYSTEMS - BLOCKED ===
# Block access to internal system files
Disallow: /static/
Disallow: /scripts/
Disallow: /docs/
Disallow: /git/
Disallow: /content/

# === SEARCH ENGINE OPTIMIZATION ===
# Allow major search engines with reasonable limits
User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /profile/
Disallow: /asset/
Disallow: /search
Disallow: /publish/
Disallow: /usecases
Disallow: /verify
Disallow: /faucet

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /profile/
Disallow: /asset/
Disallow: /search
Disallow: /publish/
Disallow: /usecases
Disallow: /verify
Disallow: /faucet

# === AI TRAINING BOTS - COMPLETELY BLOCKED ===
# Block all AI training data collection
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: Omgilibot
Disallow: /

# === SOCIAL MEDIA BOTS - RESTRICTED ===
# Allow basic preview, block deep crawling
User-agent: facebookexternalhit
Allow: /
Disallow: /api/
Disallow: /profile/
Disallow: /search

User-agent: Twitterbot
Allow: /
Disallow: /api/
Disallow: /profile/
Disallow: /search

User-agent: LinkedInBot
Allow: /
Disallow: /api/
Disallow: /profile/
Disallow: /search

# === PRIVACY STATEMENT ===
# This robots.txt balances privacy protection with search visibility
# We allow search engines to index public content
# We block AI training bots and protect user data
# Contact: info@cliox.org
`

  res.setHeader('Content-Type', 'text/plain')
  res.setHeader(
    'Cache-Control',
    'public, max-age=86400, stale-while-revalidate'
  )
  res.write(robotsTxt)
  res.end()

  return { props: {} }
}

const RobotsTxt = () => null
export default RobotsTxt
