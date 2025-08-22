interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps): object => {
  if (!items || items.length === 0) return null

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return breadcrumbSchema
}

export { BreadcrumbSchema }
export type { BreadcrumbItem }
