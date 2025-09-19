import {
  ResearchPaper,
  ResearchTopic,
  ResearchSortBy,
  ResearchGroup
} from '@/components/Resources/types'
import presentationsIndex from '../../content/resources/research/presentations.json'

// Research papers data (publications, education modules, etc.)
const researchPapers: ResearchPaper[] = [
  {
    id: 'cameron-2025-navigating',
    title:
      'Navigating accountability: the role of paradata in AI documentation and governance',
    authors: ['Cameron', 'Franks', 'Huvila', 'Mooradian'],
    year: 2025,
    link: 'https://doi.org/10.1108/JD-01-2025-0009',
    group: 'governance',
    topic: 'publications',
    doi: '10.1108/JD-01-2025-0009',
    abstract:
      'This paper explores the role of paradata in AI documentation and governance frameworks.'
  },
  {
    id: 'lemieux-2024-protecting',
    title:
      'Protecting Privacy in Digital Records: The Potential of Privacy-Enhancing Technologies',
    authors: ['Lemieux', 'Werner'],
    year: 2024,
    link: 'https://doi.org/10.1145/3633477',
    group: 'privacy',
    topic: 'publications',
    doi: '10.1145/3633477',
    abstract:
      'An examination of privacy-enhancing technologies for digital records protection.'
  },
  {
    id: 'lemieux-2024-distant',
    title:
      'Using Distant Reading to Enhance Archival Access Whilst Protecting Privacy',
    authors: ['Lemieux', 'Chung', 'Zhou', 'Wang'],
    year: 2024,
    link: 'https://interparestrustai.org/assets/public/dissemination/UsingDistantReadingtoEnhanceArchivalAccessWhilstProtectingPrivacyFINAL_V2.docx',
    group: 'privacy',
    topic: 'publications',
    abstract:
      'RA06 research on using distant reading techniques to enhance archival access while maintaining privacy.'
  },
  {
    id: 'ad01-2024-ai-module',
    title:
      'Archivist & Records Managers AI Competencies – Module 1: Introduction to Artificial Intelligence for the Archival Professions',
    authors: ['AD01-Teachable AI'],
    year: 2024,
    link: 'https://interparestrustai.org/assets/public/dissemination/AD_01_Module1_v_1_1_20241018.pdf',
    group: 'education',
    topic: 'education',
    abstract:
      'Educational module introducing AI competencies for archival professionals.'
  }
]

// Map presentations JSON to ResearchPaper shape with presentation-specific fields populated
const presentationsPapers: ResearchPaper[] = (
  (presentationsIndex as any).presentations || []
).map((p: any) => {
  const date = p.date as string | undefined
  const endDate = p.endDate as string | undefined
  const city = p.city as string | undefined
  const country = p.country as string | undefined
  const eventName = p.eventName as string | undefined
  const role = p.role as string | undefined

  return {
    id: p.id,
    title: p.title,
    authors: p.authors || [],
    year: date ? new Date(date).getFullYear() : new Date().getFullYear(),
    link: p.link || '#',
    group: 'presentations',
    topic: 'presentations',
    abstract: undefined,
    date,
    endDate,
    eventName,
    location:
      city && country ? `${city}, ${country}` : city || country || undefined,
    role
  } as ResearchPaper
})

// Research topics configuration
const researchTopics: ResearchTopic[] = [
  {
    id: 'publications',
    title: 'Publications',
    papers: researchPapers.filter((paper) => paper.topic === 'publications')
  },
  {
    id: 'presentations',
    title: 'Presentations',
    papers: presentationsPapers
  },
  {
    id: 'education',
    title: 'Education Modules',
    papers: researchPapers.filter((paper) => paper.topic === 'education')
  },
  {
    id: 'public-relations',
    title: 'Public Relations',
    papers: [],
    comingSoon: true
  }
]

// Sort papers by different criteria
export function sortResearchPapers(
  papers: ResearchPaper[],
  sortBy: ResearchSortBy
): ResearchPaper[] {
  const sortedPapers = [...papers]
  const toTimestamp = (p: ResearchPaper) =>
    p.date ? new Date(p.date).getTime() : new Date(`${p.year}-01-01`).getTime()

  switch (sortBy) {
    case 'date-desc':
      return sortedPapers.sort((a, b) => toTimestamp(b) - toTimestamp(a))
    case 'date-asc':
      return sortedPapers.sort((a, b) => toTimestamp(a) - toTimestamp(b))
    case 'title-asc':
      return sortedPapers.sort((a, b) => a.title.localeCompare(b.title))
    case 'title-desc':
      return sortedPapers.sort((a, b) => b.title.localeCompare(a.title))
    case 'author-asc':
      return sortedPapers.sort((a, b) =>
        a.authors[0].localeCompare(b.authors[0])
      )
    case 'author-desc':
      return sortedPapers.sort((a, b) =>
        b.authors[0].localeCompare(a.authors[0])
      )
    default:
      return sortedPapers
  }
}

// Filter papers by group
export function filterResearchPapers(
  papers: ResearchPaper[],
  group: ResearchGroup
): ResearchPaper[] {
  if (group === 'all') {
    return papers
  }
  return papers.filter((paper) => paper.group === group)
}

// Get all research topics
export function getResearchTopics(): ResearchTopic[] {
  return researchTopics
}

// Get research papers by topic
export function getResearchPapersByTopic(topicId: string): ResearchPaper[] {
  const topic = researchTopics.find((t) => t.id === topicId)
  return topic ? topic.papers : []
}

// Get all research papers
export function getAllResearchPapers(): ResearchPaper[] {
  return [...researchPapers, ...presentationsPapers]
}

// Search research papers
export function searchResearchPapers(query: string): ResearchPaper[] {
  const searchTerm = query.toLowerCase()
  return [...researchPapers, ...presentationsPapers].filter(
    (paper) =>
      paper.title.toLowerCase().includes(searchTerm) ||
      paper.authors.some((author) =>
        author.toLowerCase().includes(searchTerm)
      ) ||
      paper.abstract?.toLowerCase().includes(searchTerm) ||
      paper.group.toLowerCase().includes(searchTerm) ||
      paper.eventName?.toLowerCase().includes(searchTerm) ||
      paper.location?.toLowerCase().includes(searchTerm) ||
      paper.role?.toLowerCase().includes(searchTerm)
  )
}

// Get research groups for filtering
export function getResearchGroups(): Array<{
  value: ResearchGroup
  label: string
}> {
  return [
    { value: 'all', label: 'All Topics' },
    { value: 'privacy', label: 'Privacy' },
    { value: 'governance', label: 'Governance' },
    { value: 'education', label: 'Education Modules' },
    { value: 'presentations', label: 'Presentations' },
    { value: 'public-relations', label: 'Public Relations' }
  ]
}

// Get sort options
export function getSortOptions(): Array<{
  value: ResearchSortBy
  label: string
}> {
  return [
    { value: 'date-desc', label: 'Date ↓' },
    { value: 'date-asc', label: 'Date ↑' },
    { value: 'title-asc', label: 'Title A→Z' },
    { value: 'title-desc', label: 'Title Z→A' },
    { value: 'author-asc', label: 'Author A→Z' },
    { value: 'author-desc', label: 'Author Z→A' }
  ]
}

/**
 * Escape XML/SVG special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Generate a custom SVG image for Research (optimized for list view)
 */
export function generateResearchImageForList(title: string): string {
  // Truncate title if too long for display
  const displayTitle =
    title.length > 25 ? title.substring(0, 22) + '...' : title

  // Escape special characters for XML/SVG
  const safeTitle = escapeXml(displayTitle)

  const svg = `
    <svg width="192" height="128" viewBox="0 0 192 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="192" height="128" fill="#f2e5d5"/>
      
      <!-- Subtle geometric pattern -->
      <defs>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="24" height="24">
          <circle cx="12" cy="12" r="1" fill="#e8ddd2" opacity="0.4"/>
        </pattern>
      </defs>
      <rect width="192" height="128" fill="url(#dots)"/>
      
      <!-- RESEARCH label -->
      <text x="16" y="25" font-family="IBM Plex Sans, sans-serif" font-size="10" font-weight="600" fill="#8b7355" text-transform="uppercase" letter-spacing="1px">
        RESEARCH
      </text>
      
      <!-- Research title -->
      <text x="16" y="45" font-family="IBM Plex Sans, sans-serif" font-size="12" font-weight="600" fill="#4a3f36" text-anchor="start">
        ${safeTitle
          .split(' ')
          .reduce((lines, word) => {
            const currentLine = lines[lines.length - 1]
            if (currentLine && currentLine.length + word.length + 1 <= 22) {
              lines[lines.length - 1] = currentLine + ' ' + word
            } else {
              lines.push(word)
            }
            return lines
          }, [] as string[])
          .slice(0, 4)
          .map(
            (line, i) =>
              `<tspan x="16" dy="${i === 0 ? 0 : 14}">${line}</tspan>`
          )
          .join('')}
      </text>
      
      <!-- Icon decoration -->
      <g transform="translate(130, 75)">
        <!-- Paper body -->
        <rect x="0" y="0" width="45" height="50" rx="3" fill="#e8ddd2" opacity="0.6"/>
        <!-- Folded corner -->
        <path d="M32 0 L45 13 L32 13 Z" fill="#ddd0c0" opacity="0.7"/>
        <!-- Text lines -->
        <rect x="6" y="14" width="24" height="2" fill="#c8b8a5" opacity="0.5"/>
        <rect x="6" y="20" width="18" height="2" fill="#c8b8a5" opacity="0.5"/>
        <rect x="6" y="26" width="22" height="2" fill="#c8b8a5" opacity="0.5"/>
        <rect x="6" y="32" width="16" height="2" fill="#c8b8a5" opacity="0.5"/>
        <rect x="6" y="38" width="14" height="2" fill="#c8b8a5" opacity="0.5"/>
      </g>
    </svg>
  `.trim()

  // Convert to base64 data URL with error handling
  try {
    return `data:image/svg+xml;base64,${btoa(svg)}`
  } catch (error) {
    console.error('Error generating research list image:', error)
    // Return a generic fallback image if generation fails
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDE5MiAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9Ijk2IiB5PSI2NCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOUNBM0FGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkltYWdlIFBsYWNlaG9sZGVyPC90ZXh0Pgo8L3N2Zz4='
  }
}

/**
 * Generate a custom SVG image for Research (original for grid view)
 */
export function generateResearchImage(title: string): string {
  // Truncate title if too long for display
  const displayTitle =
    title.length > 35 ? title.substring(0, 32) + '...' : title

  // Escape special characters for XML/SVG
  const safeTitle = escapeXml(displayTitle)

  const svg = `
    <svg width="320" height="160" viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="320" height="160" fill="#f2e5d5"/>
      
      <!-- Subtle geometric pattern -->
      <defs>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="30" height="30">
          <circle cx="15" cy="15" r="1.5" fill="#e8ddd2" opacity="0.4"/>
        </pattern>
      </defs>
      <rect width="320" height="160" fill="url(#dots)"/>
      
      <!-- RESEARCH label -->
      <text x="20" y="35" font-family="IBM Plex Sans, sans-serif" font-size="12" font-weight="600" fill="#8b7355" text-transform="uppercase" letter-spacing="1px">
        RESEARCH
      </text>
      
      <!-- Research title -->
      <text x="20" y="65" font-family="IBM Plex Sans, sans-serif" font-size="16" font-weight="600" fill="#4a3f36" text-anchor="start">
        ${safeTitle
          .split(' ')
          .reduce((lines, word) => {
            const currentLine = lines[lines.length - 1]
            if (currentLine && currentLine.length + word.length + 1 <= 30) {
              lines[lines.length - 1] = currentLine + ' ' + word
            } else {
              lines.push(word)
            }
            return lines
          }, [] as string[])
          .slice(0, 4)
          .map(
            (line, i) =>
              `<tspan x="20" dy="${i === 0 ? 0 : 20}">${line}</tspan>`
          )
          .join('')}
      </text>
      
      <!-- Icon decoration -->
      <g transform="translate(230, 95)">
        <!-- Paper body -->
        <rect x="0" y="0" width="55" height="65" rx="4" fill="#e8ddd2" opacity="0.6"/>
        <!-- Folded corner -->
        <path d="M40 0 L55 15 L40 15 Z" fill="#ddd0c0" opacity="0.7"/>
        <!-- Text lines -->
        <rect x="8" y="16" width="30" height="2.5" fill="#c8b8a5" opacity="0.5"/>
        <rect x="8" y="24" width="24" height="2.5" fill="#c8b8a5" opacity="0.5"/>
        <rect x="8" y="32" width="28" height="2.5" fill="#c8b8a5" opacity="0.5"/>
        <rect x="8" y="40" width="22" height="2.5" fill="#c8b8a5" opacity="0.5"/>
        <rect x="8" y="48" width="20" height="2.5" fill="#c8b8a5" opacity="0.5"/>
      </g>
    </svg>
  `.trim()

  // Convert to base64 data URL with error handling
  try {
    return `data:image/svg+xml;base64,${btoa(svg)}`
  } catch (error) {
    console.error('Error generating research image:', error)
    // Return a generic fallback image if generation fails
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDMyMCAxNjAiIGZpbGw9Im5vbGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTYwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjAuM2VtIj5JbWFnZSBQbGFjZWhvbGRlcjwvdGV4dD4KPC9zdmc+'
  }
}
