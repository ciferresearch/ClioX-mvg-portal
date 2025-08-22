import { useMarketMetadata } from '@context/MarketMetadata'

const OrganizationSchema = (): object => {
  const { siteContent } = useMarketMetadata()

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ClioX',
    alternateName: siteContent?.siteTitle,
    url: siteContent?.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteContent?.siteUrl}/images/cliox_icon.svg`,
      width: 500,
      height: 500
    },
    description: siteContent?.siteTagline,
    foundingDate: '2025',
    sameAs: [
      'https://t.me/ClioXorg',
      'https://linkedin.com/company/clio-x-org',
      'https://github.com/ciferresearch'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'general inquiry',
      email: 'info@cliox.org',
      availableLanguage: 'English'
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA'
    },
    areaServed: 'Worldwide',
    knowsAbout: [
      'Digital Archives',
      'Cultural Heritage',
      'Web3 Technology',
      'Ethical Humanities Computing',
      'Compute-to-Data',
      'Data Sovereignty',
      'AI-Powered Research',
      'Cultural Heritage Preservation',
      'Archive Management',
      'Privacy-First Computing',
      'Blockchain Technology'
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'ClioX Services',
      description:
        'Comprehensive services for archivists, researchers, and cultural heritage institutions',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Web3 Ecosystem for Cultural Heritage and Archives',
            description:
              'Building a sustainable and ethical future for digital archives and cultural heritage'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Archive Publishing & Protection Platform',
            description:
              'Publish and protect holdings with tools built for ethical AI stewardship and collaboration'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'AI-Powered Research Tools',
            description:
              'AI + visual analytic tools to help researchers analyze large volumes of archival data and discover new insights'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Compute-to-Data Platform',
            description:
              'Privacy-first computing where algorithms go to data, ensuring raw data is never moved or exposed'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Consent & Usage Rights Management',
            description:
              'Allow archives to manage consent and usage rights for their data while ensuring privacy protection'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Ecosystem Partnership Program',
            description:
              'Join a global values-aligned Web3 community for memory institutions and research labs'
          }
        }
      ]
    }
  }

  return organizationSchema
}

export { OrganizationSchema }
