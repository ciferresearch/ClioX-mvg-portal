import { useMarketMetadata } from '@context/MarketMetadata'

const WebSiteSchema = (): object => {
  const { siteContent } = useMarketMetadata()

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ClioX',
    alternateName: siteContent?.siteTitle,
    url: siteContent?.siteUrl,
    description: siteContent?.siteTagline,
    inLanguage: 'en',
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Organization',
      name: 'ClioX',
      url: siteContent?.siteUrl
    },

    mainEntity: {
      '@type': 'ItemList',
      name: 'ClioX Platform Features',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'WebPage',
            name: 'Privacy-First Platform for Archival Research',
            url: `${siteContent?.siteUrl}/`,
            description:
              siteContent?.siteTagline ||
              'Building a sustainable and ethical future for digital archives and cultural heritage'
          }
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'WebPage',
            name: 'The Reading Room',
            url: `${siteContent?.siteUrl}/resources`,
            description:
              'Your go-to hub for valuable resources including articles, academy, events, glossary, and research materials'
          }
        }
      ]
    }
  }

  return webSiteSchema
}

export { WebSiteSchema }
