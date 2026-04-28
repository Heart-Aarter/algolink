import type { OjPlatform, SubmissionRecord } from '@/types/algolink'
import {
  getDifficultyBucket,
  parseDifficulty,
  parseSubmittedAt,
  type DifficultyBucket,
} from '@/utils/analysis'
import { matchesVerdictFilter, type VerdictFilter } from '@/utils/verdict'

export type PlatformFilter = 'All' | OjPlatform
export type SubmissionSortKey = 'time-desc' | 'time-asc' | 'difficulty-desc' | 'difficulty-asc'

export interface SubmissionFilterState {
  keyword: string
  platform: PlatformFilter
  verdict: VerdictFilter
  tag: 'All' | string
  difficulty: DifficultyBucket
  sort: SubmissionSortKey
}

export const sortOptions: Array<{ value: SubmissionSortKey; label: string }> = [
  { value: 'time-desc', label: 'Newest first' },
  { value: 'time-asc', label: 'Oldest first' },
  { value: 'difficulty-desc', label: 'Hardest first' },
  { value: 'difficulty-asc', label: 'Easiest first' },
]

export function extractSubmissionTags(submissions: SubmissionRecord[]) {
  return [...new Set(submissions.flatMap((submission) => submission.tags))]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
}

function matchesKeyword(submission: SubmissionRecord, keyword: string) {
  const query = keyword.trim().toLowerCase()

  if (!query) {
    return true
  }

  return [
    submission.problem,
    submission.problemId,
    submission.tags.join(' '),
    submission.language,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query)
}

function compareTime(left: SubmissionRecord, right: SubmissionRecord) {
  const leftTime = parseSubmittedAt(left.submittedAt)?.getTime() ?? 0
  const rightTime = parseSubmittedAt(right.submittedAt)?.getTime() ?? 0
  return leftTime - rightTime
}

function compareDifficulty(left: SubmissionRecord, right: SubmissionRecord) {
  const leftDifficulty = parseDifficulty(left.difficulty) ?? -1
  const rightDifficulty = parseDifficulty(right.difficulty) ?? -1
  return leftDifficulty - rightDifficulty
}

export function filterSubmissions(
  submissions: SubmissionRecord[],
  filters: SubmissionFilterState,
) {
  const filtered = submissions.filter((submission) => {
    const platformMatched = filters.platform === 'All' || submission.platform === filters.platform
    const verdictMatched = matchesVerdictFilter(submission.status, filters.verdict)
    const tagMatched = filters.tag === 'All' || submission.tags.includes(filters.tag)
    const difficultyMatched =
      filters.difficulty === 'All' || getDifficultyBucket(submission.difficulty) === filters.difficulty

    return (
      matchesKeyword(submission, filters.keyword) &&
      platformMatched &&
      verdictMatched &&
      tagMatched &&
      difficultyMatched
    )
  })

  return [...filtered].sort((left, right) => {
    if (filters.sort === 'time-asc') {
      return compareTime(left, right)
    }

    if (filters.sort === 'difficulty-desc') {
      return compareDifficulty(right, left)
    }

    if (filters.sort === 'difficulty-asc') {
      return compareDifficulty(left, right)
    }

    return compareTime(right, left)
  })
}
