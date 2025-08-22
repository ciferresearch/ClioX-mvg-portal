interface ArticleSchemaProps {
  title: string
  description: string
  author?: string
  publishDate?: string
  modifiedDate?: string
  image?: string
  tags?: string[]
  url: string
}

const ArticleSchema = ({
  title,
  description,
  author = 'ClioX Team',
  publishDate,
  modifiedDate,
  image,
  tags = [],
  url
}: ArticleSchemaProps): object => {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description.substring(0, 200), // Limit description length
    author: {
      '@type': 'Person',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: 'ClioX',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cliox.org/images/cliox_icon.svg',
        width: 500,
        height: 500
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    ...(publishDate && { datePublished: publishDate }),
    ...(modifiedDate && { dateModified: modifiedDate }),
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
        width: 1200,
        height: 630
      }
    }),
    ...(tags.length > 0 && { keywords: tags.join(', ') }),
    articleSection: 'Digital Heritage & Web3 Technology',
    inLanguage: 'en',
    isAccessibleForFree: true,
    wordCount: description.split(' ').length,
    timeRequired: `PT${Math.ceil(description.split(' ').length / 150)}M`, // Estimate reading time
    knowsAbout: [
      'Digital Archives',
      'Cultural Heritage',
      'Web3 Technology',
      'AI-Powered Research',
      'Blockchain Technology',
      'Internet Evolution'
    ],
    contentType: 'Research Article',
    audience: {
      '@type': 'Audience',
      audienceType:
        'Researchers, Archivists, Cultural Heritage Professionals, Web3 Enthusiasts'
    }
  }

  return articleSchema
}

export { ArticleSchema }
