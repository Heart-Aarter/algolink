import type { SubmissionRecord, SubmissionStatus } from '@/types/algolink'
import type { OjProfile, OjRatingChange, OjSubmission } from './ojTypes'

export interface CodeforcesUserInfo {
  handle: string
  rating?: number
  maxRating?: number
  rank?: string
  maxRank?: string
  avatar?: string
  titlePhoto?: string
  contribution?: number
  friendOfCount?: number
  registrationTimeSeconds?: number
  lastOnlineTimeSeconds?: number
}

export interface CodeforcesProblem {
  contestId?: number
  problemsetName?: string
  index: string
  name: string
  rating?: number
  tags?: string[]
}

export interface CodeforcesSubmission {
  id: number
  creationTimeSeconds: number
  programmingLanguage: string
  verdict?: string
  timeConsumedMillis?: number
  problem: CodeforcesProblem
}

export interface CodeforcesRatingChange {
  contestId: number
  contestName: string
  handle: string
  rank: number
  ratingUpdateTimeSeconds: number
  oldRating: number
  newRating: number
}

function formatDateTimeFromSeconds(seconds?: number) {
  if (!seconds) {
    return ''
  }

  const date = new Date(seconds * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function normalizeVerdict(verdict?: string): SubmissionStatus {
  if (verdict === 'OK') {
    return 'Accepted'
  }

  if (verdict === 'TIME_LIMIT_EXCEEDED') {
    return 'Time Limit'
  }

  if (verdict === 'RUNTIME_ERROR') {
    return 'Runtime Error'
  }

  return 'Wrong Answer'
}

function getProblemId(problem: CodeforcesProblem) {
  if (problem.contestId) {
    return `${problem.contestId}${problem.index}`
  }

  if (problem.problemsetName) {
    return `${problem.problemsetName}-${problem.index}`
  }

  return problem.index
}

export function normalizeCodeforcesUser(user: CodeforcesUserInfo): OjProfile {
  return {
    platform: 'Codeforces',
    handle: user.handle,
    rating: user.rating ?? 0,
    maxRating: user.maxRating ?? user.rating ?? 0,
    rank: user.rank,
    maxRank: user.maxRank,
    avatar: user.titlePhoto || user.avatar,
    contribution: user.contribution,
    friendOfCount: user.friendOfCount,
    registeredAt: formatDateTimeFromSeconds(user.registrationTimeSeconds),
    lastOnlineAt: formatDateTimeFromSeconds(user.lastOnlineTimeSeconds),
  }
}

export function normalizeCodeforcesSubmission(submission: CodeforcesSubmission): OjSubmission {
  const problemId = getProblemId(submission.problem)

  return {
    id: `cf-${submission.id}`,
    platform: 'Codeforces',
    problemId,
    problemTitle: `${problemId} ${submission.problem.name}`,
    difficulty: submission.problem.rating ? String(submission.problem.rating) : 'Unrated',
    tags: submission.problem.tags ?? [],
    verdict: normalizeVerdict(submission.verdict),
    language: submission.programmingLanguage,
    submittedAt: formatDateTimeFromSeconds(submission.creationTimeSeconds),
    runtime:
      typeof submission.timeConsumedMillis === 'number'
        ? `${submission.timeConsumedMillis} ms`
        : 'N/A',
  }
}

export function normalizeCodeforcesRating(change: CodeforcesRatingChange): OjRatingChange {
  return {
    id: `cf-rating-${change.contestId}-${change.ratingUpdateTimeSeconds}`,
    platform: 'Codeforces',
    contestId: change.contestId,
    contestName: change.contestName,
    rank: change.rank,
    oldRating: change.oldRating,
    newRating: change.newRating,
    ratingUpdatedAt: formatDateTimeFromSeconds(change.ratingUpdateTimeSeconds),
  }
}

export function toSubmissionRecord(submission: OjSubmission): SubmissionRecord {
  return {
    id: submission.id,
    platform: submission.platform,
    problem: submission.problemTitle,
    difficulty: submission.difficulty,
    tags: submission.tags,
    status: submission.verdict,
    language: submission.language,
    submittedAt: submission.submittedAt,
    runtime: submission.runtime,
  }
}
