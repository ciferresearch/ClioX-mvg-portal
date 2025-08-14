import { ResourceCard } from '@/components/Resources/types'

interface ArticleMetadata {
  id: string
  slug: string
  category: string
  tag: string
  title: string
  description: string
  author: string
  publishDate: string
  readTime: string
  heroImage: string
  cardImage: string
  isPublished: boolean
  tags: string[]
  sections: Array<{
    title: string
    content: string
  }>
  quote: string
  finalParagraph: string
  furtherReading: Array<{
    source: string
    title: string
    url: string
  }>
}

// Function to load article metadata
export async function loadArticleMetadata(
  slug: string
): Promise<ArticleMetadata | null> {
  try {
    // In a real app, this would be a server-side function or API call
    // For now, we'll simulate loading from the file system
    const response = await fetch(
      `/content/resources/articles/${slug}/metadata.json`
    )
    if (!response.ok) {
      return null
    }
    const metadata: ArticleMetadata = await response.json()
    return metadata
  } catch (error) {
    console.error(`Error loading article metadata for ${slug}:`, error)
    return null
  }
}

// Convert article metadata to resource card format
function articleToResourceCard(article: ArticleMetadata): ResourceCard {
  // Combine all section content for search
  const combinedContent =
    article.sections
      ?.map((section) => `${section.title} ${section.content}`)
      .join(' ') || ''

  return {
    id: article.id,
    category: article.category,
    tag: article.tag,
    title: article.title,
    description: article.description,
    image: article.cardImage,
    link: `/articles/${article.slug}`,
    content: combinedContent,
    tags: article.tags
  }
}

// Load articles with full content from metadata files
async function loadAllArticles(): Promise<ResourceCard[]> {
  try {
    // First get the list of articles from the index
    const articlesIndex = await import(
      '../../content/resources/articles/index.json'
    )
    const articlesList = articlesIndex.articles || []

    // Then load the full metadata for each article
    const articlesWithContent: ResourceCard[] = []

    for (const article of articlesList) {
      try {
        const metadata = await loadArticleMetadata(article.slug)
        if (metadata && metadata.isPublished) {
          const resourceCard = articleToResourceCard(metadata)
          articlesWithContent.push(resourceCard)
        }
      } catch (error) {
        console.error(
          `Error loading metadata for article ${article.slug}:`,
          error
        )
        // Fallback to basic article data if metadata fails to load
        articlesWithContent.push(article)
      }
    }

    return articlesWithContent
  } catch (error) {
    console.error('Error loading articles:', error)
    return []
  }
}

// Load academy resources
async function loadAcademyResources(): Promise<ResourceCard[]> {
  try {
    const academyIndex = await import(
      '../../content/resources/academy/index.json'
    )
    return academyIndex.academy || []
  } catch (error) {
    console.error('Error loading academy resources:', error)
    return []
  }
}

// Load events
async function loadEvents(): Promise<ResourceCard[]> {
  try {
    const eventsIndex = await import(
      '../../content/resources/events/index.json'
    )
    return eventsIndex.events || []
  } catch (error) {
    console.error('Error loading events:', error)
    return []
  }
}

// Load guides
async function loadGuides(): Promise<ResourceCard[]> {
  try {
    const guidesIndex = await import(
      '../../content/resources/guides/index.json'
    )
    return guidesIndex.guides || []
  } catch (error) {
    console.error('Error loading guides:', error)
    return []
  }
}

// Load glossary (placeholder)
async function loadGlossary(): Promise<ResourceCard[]> {
  // TODO: Implement glossary content loading
  return []
}

// Load research papers (placeholder)
async function loadResearchPapers(): Promise<ResourceCard[]> {
  // TODO: Implement research papers loading
  return []
}

// Function to load resources by category
export async function loadResourcesByCategory(
  category: string
): Promise<ResourceCard[]> {
  switch (category) {
    case 'articles':
      return await loadAllArticles()
    case 'academy':
      return await loadAcademyResources()
    case 'events':
      return await loadEvents()
    case 'guides':
      return await loadGuides()
    case 'glossary':
      return await loadGlossary()
    case 'research':
      return await loadResearchPapers()
    default:
      return []
  }
}

/**
 * Generate a generic resource card image optimized for list view
 */
export function generateResourceCardImageForList(
  title: string,
  category: string
): string {
  // Truncate title if too long for display
  const displayTitle =
    title.length > 20 ? title.substring(0, 17) + '...' : title

  // Get category label
  const categoryLabel = category.toUpperCase()

  // Choose background color based on category
  const getBackgroundColor = (cat: string) => {
    switch (cat) {
      case 'articles':
        return '#e3f2fd'
      case 'academy':
        return '#f3e5f5'
      case 'events':
        return '#e8f5e8'
      case 'guides':
        return '#fff3e0'
      default:
        return '#f5f5f5'
    }
  }

  // Choose accent color based on category
  const getAccentColor = (cat: string) => {
    switch (cat) {
      case 'articles':
        return '#1976d2'
      case 'academy':
        return '#7b1fa2'
      case 'events':
        return '#388e3c'
      case 'guides':
        return '#f57c00'
      default:
        return '#666666'
    }
  }

  const backgroundColor = getBackgroundColor(category)
  const accentColor = getAccentColor(category)

  const svg = `
    <svg width="192" height="128" viewBox="0 0 192 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="192" height="128" fill="${backgroundColor}"/>
      
      <!-- Category label -->
      <text x="16" y="25" font-family="IBM Plex Sans, sans-serif" font-size="10" font-weight="600" fill="${accentColor}" text-transform="uppercase" letter-spacing="1px">
        ${categoryLabel}
      </text>
      
      <!-- Title -->
      <text x="16" y="45" font-family="IBM Plex Sans, sans-serif" font-size="14" font-weight="600" fill="#2c2c2c" text-anchor="start">
        ${displayTitle
          .split(' ')
          .map(
            (word, i) =>
              `<tspan x="16" dy="${i === 0 ? 0 : 16}">${word}</tspan>`
          )
          .join('')}
      </text>
      
      <!-- Decorative element -->
      <circle cx="160" cy="100" r="20" fill="${accentColor}" opacity="0.1"/>
      <circle cx="160" cy="100" r="12" fill="${accentColor}" opacity="0.2"/>
    </svg>
  `.trim()

  // Convert to base64 data URL
  try {
    return `data:image/svg+xml;base64,${btoa(svg)}`
  } catch (error) {
    console.error('Error generating resource card image:', error)
    // Return a generic fallback image if generation fails
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDE5MiAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9Ijk2IiB5PSI2NCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOUNBM0FGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkltYWdlIFBsYWNlaG9sZGVyPC90ZXh0Pgo8L3N2Zz4='
  }
}

export type { ArticleMetadata }
