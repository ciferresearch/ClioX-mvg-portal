import { ReactElement, useMemo } from 'react'
import { getSortOptions, getResearchGroups } from '@/utils/loadResearch'
import {
  ResearchGroup,
  ResearchPaper,
  ResearchSortBy,
  ResearchTopic
} from './types'
import Pagination from '@shared/Pagination'
import CustomDropdown from './shared/CustomDropdown'
import { motion } from 'motion/react'
import { IconArrowLeft, IconExternalLink } from '@tabler/icons-react'

const ROWS_PER_PAGE = 10

type SortOption = ReturnType<typeof getSortOptions>[number]
type GroupOption = ReturnType<typeof getResearchGroups>[number]

function useGroupLabelMap(options: GroupOption[]): Record<string, string> {
  return useMemo(() => {
    return options.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] = option.label
      return acc
    }, {})
  }, [options])
}

interface ResearchTopicListViewProps {
  topic?: ResearchTopic
  processedPapers: ResearchPaper[]
  sortBy: ResearchSortBy
  filterGroup: ResearchGroup
  onChangeSort: (value: string) => void
  onChangeGroup: (value: string) => void
  page: number
  onChangePage: (zeroBased: number) => void
  sortOptions: SortOption[]
  filterOptions: GroupOption[]
  onBack: () => void
  variant?: 'standalone' | 'embedded'
  showControls?: boolean
}

function getPaginationMeta(papers: ResearchPaper[], page: number) {
  const visibleResults = papers.length
  const totalPages = Math.max(1, Math.ceil(visibleResults / ROWS_PER_PAGE))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE
  const pageItems = papers.slice(startIndex, startIndex + ROWS_PER_PAGE)
  const currentRangeStart = visibleResults === 0 ? 0 : startIndex + 1
  const currentRangeEnd = Math.min(startIndex + ROWS_PER_PAGE, visibleResults)

  return {
    visibleResults,
    totalPages,
    currentPage,
    pageItems,
    currentRangeStart,
    currentRangeEnd
  }
}

// Helpers: date formatting and presentation meta
const formatShortDate = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return iso ?? ''
  }
}

const buildPresentationMeta = (paper: ResearchPaper) => {
  const segs: string[] = []
  if (paper?.authors && paper.authors.length > 0) {
    segs.push(
      paper.authors.length > 2
        ? `${paper.authors[0]} et al.`
        : paper.authors.join(', ')
    )
  }
  if ((paper as any)?.eventName) segs.push((paper as any).eventName as string)
  if ((paper as any)?.location) segs.push((paper as any).location as string)
  if ((paper as any)?.date)
    segs.push(formatShortDate((paper as any).date as string))
  return (
    segs.join(' • ') + ((paper as any)?.role ? ` [${(paper as any).role}]` : '')
  )
}

function ResearchTopicListView({
  topic,
  processedPapers,
  sortBy,
  filterGroup,
  onChangeSort,
  onChangeGroup,
  page,
  onChangePage,
  sortOptions,
  filterOptions,
  onBack,
  variant = 'standalone',
  showControls = true
}: ResearchTopicListViewProps): ReactElement {
  const groupLabelMap = useGroupLabelMap(filterOptions)
  const hasActiveFilters = filterGroup !== 'all'
  const nounPlural =
    topic?.id === 'presentations'
      ? 'presentations'
      : topic?.id === 'education'
      ? 'modules'
      : topic?.id === 'public-relations'
      ? 'posts'
      : 'papers'

  const {
    visibleResults,
    totalPages,
    currentPage,
    pageItems,
    currentRangeStart,
    currentRangeEnd
  } = getPaginationMeta(processedPapers, page)

  const containerClassName =
    variant === 'standalone' ? 'bg-slate-50/40 py-10 sm:py-12' : 'py-6'

  const innerClassName =
    variant === 'standalone' ? 'mx-auto max-w-5xl px-4 sm:px-6 lg:px-8' : 'px-0'

  const sectionSpacingClass =
    variant === 'standalone' ? 'mt-6 space-y-6' : 'mt-6 space-y-5'

  const backButtonClasses =
    variant === 'standalone'
      ? 'group inline-flex items-center gap-2 text-base font-semibold transition cursor-pointer text-[color:var(--color-primary)] hover:text-[color:var(--color-secondary)]'
      : 'group inline-flex items-center gap-2 text-base font-semibold transition cursor-pointer text-[color:var(--color-primary)] hover:text-[color:var(--color-secondary)]'

  if (!topic) {
    return (
      <div className={containerClassName}>
        <div className={innerClassName}>
          <button type="button" onClick={onBack} className={backButtonClasses}>
            <IconArrowLeft className="h-4 w-4" /> Back to research overview
          </button>
          <h2 className="mt-6 text-3xl font-semibold text-slate-900">
            Unknown topic
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            We couldn&apos;t find the topic you were looking for. Please return
            to the research page and select a category.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      <div className={innerClassName}>
        <button type="button" onClick={onBack} className={backButtonClasses}>
          <IconArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          Back
        </button>

        <div className={sectionSpacingClass}>
          <div className="space-y-3">
            <div
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--color-secondary)' }}
            >
              Research Library
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                  {topic.title}
                </h2>
                <p className="text-sm text-slate-600">
                  {visibleResults === 0
                    ? 'No matching items at the moment.'
                    : `Showing ${currentRangeStart}-${currentRangeEnd} of ${visibleResults} curated ${nounPlural}.`}
                </p>
              </div>
              {hasActiveFilters && (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-tight text-[color:var(--color-primary)] bg-[color:var(--button-secondary-background)]">
                  Active filter: {groupLabelMap[filterGroup] ?? 'Custom'}
                </span>
              )}
            </div>
          </div>

          {showControls && (
            <div className="flex flex-wrap items-center gap-4">
              <CustomDropdown
                label="Sort by"
                value={sortBy}
                options={sortOptions}
                onChange={onChangeSort}
                id="topic-sort-select"
              />
              <CustomDropdown
                label="Filter"
                value={filterGroup}
                options={filterOptions}
                onChange={onChangeGroup}
                id="topic-filter-select"
              />
              <span
                className="ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{
                  borderColor: 'var(--color-highlight)',
                  color: 'var(--color-primary)'
                }}
              >
                Total {visibleResults}
              </span>
            </div>
          )}

          {!showControls && (
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{
                borderColor: 'var(--color-highlight)',
                color: 'var(--color-primary)'
              }}
            >
              Total {visibleResults}
            </span>
          )}

          <div>
            {topic.comingSoon ? (
              <div
                className="rounded-2xl border border-dashed bg-white p-10 text-center shadow-sm"
                style={{ borderColor: 'var(--color-highlight)' }}
              >
                <p
                  className="text-base font-medium"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Content for this topic is on the way.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Check back soon for newly published research.
                </p>
              </div>
            ) : visibleResults === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="text-base font-medium text-slate-700">
                  No items match your current filter.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Try choosing another group or resetting filters to view all
                  research.
                </p>
              </div>
            ) : (
              <motion.ul
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1, delayChildren: 0.12 }
                  }
                }}
              >
                {pageItems.map((paper) => {
                  const groupLabel = groupLabelMap[paper.group] ?? 'Research'
                  return (
                    <motion.li
                      key={paper.id}
                      className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md hover:border-[color:var(--color-primary)]"
                      style={{ borderColor: 'var(--border-color)' }}
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 }
                      }}
                      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <a
                            href={paper.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 transition-colors hover:text-[color:var(--color-primary)]"
                          >
                            <span>{paper.title}</span>
                            <IconExternalLink className="h-4 w-4" />
                          </a>
                          {paper.group === 'presentations' ? (
                            <div className="text-sm text-slate-600">
                              {buildPresentationMeta(paper)}
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                              <span>{paper.authors.join(', ')}</span>
                              <span className="hidden text-slate-300 sm:inline">
                                •
                              </span>
                              <span className="font-medium text-slate-700">
                                {paper.year}
                              </span>
                            </div>
                          )}
                          {paper.abstract && (
                            <p className="text-sm leading-relaxed text-slate-600">
                              {paper.abstract}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-tight text-[color:var(--color-primary)] bg-[color:var(--button-secondary-background)]">
                            {groupLabel}
                          </span>
                          <a
                            href={paper.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 text-[color:var(--color-primary)] border-[color:var(--color-highlight)] bg-[color:var(--background-body-transparent)] hover:text-[color:var(--color-highlight)] hover:border-[color:var(--color-highlight)]"
                          >
                            {paper.group === 'presentations'
                              ? 'View presentation'
                              : 'View paper'}
                            <IconExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    </motion.li>
                  )
                })}
              </motion.ul>
            )}
          </div>

          {visibleResults > ROWS_PER_PAGE && (
            <div className="pt-4">
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onChangePage={onChangePage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface EmbeddedProps {
  topic?: ResearchTopic
  sortBy: ResearchSortBy
  filterGroup: ResearchGroup
  onChangeSort: (value: ResearchSortBy) => void
  onChangeGroup: (value: ResearchGroup) => void
  page: number
  onChangePage: (zeroBased: number) => void
  onBack: () => void
}

export function ResearchTopicListEmbedded({
  topic,
  sortBy,
  filterGroup,
  onChangeSort,
  onChangeGroup,
  page,
  onChangePage,
  onBack
}: EmbeddedProps): ReactElement {
  const sortOptions = useMemo(() => getSortOptions(), [])
  const filterOptions = useMemo(() => getResearchGroups(), [])
  const processedPapers = useMemo(() => topic?.papers ?? [], [topic])

  return (
    <ResearchTopicListView
      topic={topic}
      processedPapers={processedPapers}
      sortBy={sortBy}
      filterGroup={filterGroup}
      onChangeSort={(value) => onChangeSort(value as ResearchSortBy)}
      onChangeGroup={(value) => onChangeGroup(value as ResearchGroup)}
      page={page}
      onChangePage={onChangePage}
      sortOptions={sortOptions}
      filterOptions={filterOptions}
      onBack={onBack}
      variant="embedded"
      showControls={false}
    />
  )
}
