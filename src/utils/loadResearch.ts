import {
  ResearchPaper,
  ResearchTopic,
  ResearchSortBy,
  ResearchGroup
} from '@/components/Resources/types'

// Research papers data
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
    papers: [],
    comingSoon: true
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

  switch (sortBy) {
    case 'date-desc':
      return sortedPapers.sort((a, b) => b.year - a.year)
    case 'date-asc':
      return sortedPapers.sort((a, b) => a.year - b.year)
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
  return researchPapers
}

// Search research papers
export function searchResearchPapers(query: string): ResearchPaper[] {
  const searchTerm = query.toLowerCase()
  return researchPapers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(searchTerm) ||
      paper.authors.some((author) =>
        author.toLowerCase().includes(searchTerm)
      ) ||
      paper.abstract?.toLowerCase().includes(searchTerm) ||
      paper.group.toLowerCase().includes(searchTerm)
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
