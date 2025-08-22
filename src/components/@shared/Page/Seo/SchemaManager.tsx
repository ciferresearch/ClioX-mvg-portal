import { ReactElement } from 'react'
import { OrganizationSchema } from './Schemas/OrganizationSchema'
import { WebSiteSchema } from './Schemas/WebSiteSchema'
import { ArticleSchema } from './Schemas/ArticleSchema'
import { BreadcrumbSchema } from './Schemas/BreadcrumbSchema'

interface SchemaManagerProps {
  type: 'home' | 'article' | 'resource' | 'page'
  title?: string
  description?: string
  author?: string
  publishDate?: string
  modifiedDate?: string
  image?: string
  tags?: string[]
  url: string
  breadcrumbs?: Array<{ name: string; url: string }>
}

export const SchemaManager = ({
  type,
  title,
  description,
  author,
  publishDate,
  modifiedDate,
  image,
  tags,
  url,
  breadcrumbs
}: SchemaManagerProps): ReactElement => {
  const schemas = []

  // Always include Organization schema for brand consistency
  const organizationSchema = OrganizationSchema()
  if (organizationSchema) {
    schemas.push(organizationSchema)
  }

  // Add WebSite schema for home page
  if (type === 'home') {
    const webSiteSchema = WebSiteSchema()
    if (webSiteSchema) {
      schemas.push(webSiteSchema)
    }
  }

  // Add Article schema for article pages
  if (type === 'article' && title && description) {
    const articleSchema = ArticleSchema({
      title,
      description,
      author,
      publishDate,
      modifiedDate,
      image,
      tags,
      url
    })
    if (articleSchema) {
      schemas.push(articleSchema)
    }
  }

  // Add Breadcrumb schema if available
  if (breadcrumbs && breadcrumbs.length > 0) {
    const breadcrumbSchema = BreadcrumbSchema({ items: breadcrumbs })
    if (breadcrumbSchema) {
      schemas.push(breadcrumbSchema)
    }
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, '\\u003c')
          }}
        />
      ))}
    </>
  )
}
