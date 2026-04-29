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

export interface AtCoderProblemsUserInfo {
  user_id?: string
  accepted_count?: number
  accepted_count_rank?: number
  rated_point_sum?: number
  rated_point_sum_rank?: number
}

export interface AtCoderProblemsSubmission {
  id: number
  epoch_second: number
  problem_id: string
  contest_id: string
  user_id: string
  language: string
  point?: number
  result: string
  execution_time?: number
}

export interface AtCoderProblemMeta {
  title?: string
  difficulty?: number
}

export interface LuoguUserInfo {
  uid: number
  name: string
  avatar?: string
  color?: string
  ccfLevel?: number
  xcpcLevel?: number
  ranking?: number
  passedProblemCount?: number | null
  submittedProblemCount?: number | null
  eloValue?: number | null
  elo?: number | null
  registerTime?: number
}

export interface LuoguSearchResponse {
  users?: LuoguUserInfo[]
}

export interface LuoguPracticeProblem {
  type: string
  title: string
  difficulty: number
  pid: string
  tags?: Array<number | string>
}

export interface LuoguPracticeResponse {
  status: number
  data: {
    user: LuoguUserInfo
    passed?: LuoguPracticeProblem[]
    submitted?: LuoguPracticeProblem[]
    privacy?: boolean
  }
}

export interface LuoguTag {
  id: number
  name: string
  type?: number
  parent?: number | null
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

  if (verdict === 'WRONG_ANSWER') {
    return 'Wrong Answer'
  }

  if (verdict === 'TIME_LIMIT_EXCEEDED') {
    return 'Time Limit'
  }

  if (verdict === 'RUNTIME_ERROR') {
    return 'Runtime Error'
  }

  if (verdict === 'COMPILATION_ERROR') {
    return 'Compilation Error'
  }

  return 'Unknown'
}

function normalizeAtCoderVerdict(result?: string): SubmissionStatus {
  if (result === 'AC') {
    return 'Accepted'
  }

  if (result === 'WA') {
    return 'Wrong Answer'
  }

  if (result === 'TLE') {
    return 'Time Limit'
  }

  if (result === 'RE' || result === 'OLE' || result === 'MLE') {
    return 'Runtime Error'
  }

  if (result === 'CE') {
    return 'Compilation Error'
  }

  return 'Unknown'
}

const luoguDifficultyRatings = new Map<number, number>([
  [0, 800],
  [1, 800],
  [2, 1100],
  [3, 1300],
  [4, 1500],
  [5, 1800],
  [6, 2200],
  [7, 2600],
])

const luoguDifficultyLabels = new Map<number, string>([
  [0, '暂无评定'],
  [1, '入门'],
  [2, '普及-'],
  [3, '普及/提高-'],
  [4, '普及+/提高'],
  [5, '提高+/省选-'],
  [6, '省选/NOI-'],
  [7, 'NOI/NOI+/CTSC'],
])

function getProblemId(problem: CodeforcesProblem) {
  if (problem.contestId) {
    return `${problem.contestId}-${problem.index}`
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

export function normalizeAtCoderUser(handle: string, user: AtCoderProblemsUserInfo): OjProfile {
  return {
    platform: 'AtCoder',
    handle: user.user_id || handle,
    rating: user.rated_point_sum ?? 0,
    maxRating: user.rated_point_sum ?? 0,
    rank:
      typeof user.rated_point_sum_rank === 'number' ? `#${user.rated_point_sum_rank}` : undefined,
  }
}

export function normalizeAtCoderSubmission(
  submission: AtCoderProblemsSubmission,
  meta?: AtCoderProblemMeta,
): OjSubmission {
  const problemId = submission.problem_id
  const problemTitle = meta?.title
    ? `${problemId} ${meta.title}`
    : `${problemId} (${submission.contest_id})`

  return {
    id: `atcoder-${submission.id}`,
    platform: 'AtCoder',
    problemId,
    problemTitle,
    difficulty:
      typeof meta?.difficulty === 'number' ? String(Math.round(meta.difficulty)) : 'Unrated',
    tags: [submission.contest_id],
    verdict: normalizeAtCoderVerdict(submission.result),
    language: submission.language,
    submittedAt: formatDateTimeFromSeconds(submission.epoch_second),
    runtime:
      typeof submission.execution_time === 'number' ? `${submission.execution_time} ms` : 'N/A',
  }
}

export function normalizeLuoguUser(user: LuoguUserInfo): OjProfile {
  const rating = user.eloValue ?? user.elo ?? 0

  return {
    platform: 'Luogu',
    handle: user.name,
    rating,
    maxRating: rating,
    rank: typeof user.ranking === 'number' ? `#${user.ranking}` : undefined,
    avatar: user.avatar,
    registeredAt: formatDateTimeFromSeconds(user.registerTime),
  }
}

export function normalizeLuoguPracticeProblem(
  problem: LuoguPracticeProblem,
  verdict: SubmissionStatus,
  tagNames: string[] = [],
): OjSubmission {
  const rating = luoguDifficultyRatings.get(problem.difficulty)
  const label = luoguDifficultyLabels.get(problem.difficulty) ?? '未知难度'
  const tags = [...new Set([...tagNames, label, problem.type])]

  return {
    id: `luogu-${verdict === 'Accepted' ? 'ac' : 'tried'}-${problem.pid}`,
    platform: 'Luogu',
    problemId: problem.pid,
    problemTitle: `${problem.pid} ${problem.title}`,
    difficulty: typeof rating === 'number' ? String(rating) : 'Unrated',
    tags,
    verdict,
    language: 'N/A',
    submittedAt: '公开练习页',
    runtime: 'N/A',
  }
}

export function toSubmissionRecord(submission: OjSubmission): SubmissionRecord {
  return {
    id: submission.id,
    platform: submission.platform,
    problemId: submission.problemId,
    problem: submission.problemTitle,
    difficulty: submission.difficulty,
    tags: submission.tags,
    status: submission.verdict,
    language: submission.language,
    submittedAt: submission.submittedAt,
    runtime: submission.runtime,
  }
}
