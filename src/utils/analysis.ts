import type { SubmissionRecord, SubmissionStatus } from '@/types/algolink'
import { getVerdictCode } from '@/utils/verdict'

export interface DistributionItem {
  name: string
  value: number
}

export interface TagAnalysisItem {
  tag: string
  total: number
  accepted: number
  failed: number
  acceptanceRate: number
}

export interface AnalysisResult {
  total: number
  accepted: number
  nonAccepted: number
  acceptanceRate: number
  solvedProblems: number
  recent30Total: number
  recent30Accepted: number
  tagDistribution: DistributionItem[]
  difficultyDistribution: DistributionItem[]
  verdictDistribution: DistributionItem[]
  languageDistribution: DistributionItem[]
  tagAnalysis: TagAnalysisItem[]
  topTrainingTag: string
  weakestTag: string
  weakTags: string[]
}

export const difficultyBucketOptions = [
  { value: 'All', label: 'All' },
  { value: 'le-800', label: '<= 800' },
  { value: '900-1200', label: '900-1200' },
  { value: '1300-1600', label: '1300-1600' },
  { value: '1600-plus', label: '1600+' },
  { value: 'unknown', label: 'Unknown' },
] as const

export type DifficultyBucket = (typeof difficultyBucketOptions)[number]['value']

const statusSeed: Record<SubmissionStatus, number> = {
  Accepted: 0,
  'Wrong Answer': 0,
  'Time Limit': 0,
  'Runtime Error': 0,
  'Compilation Error': 0,
  Unknown: 0,
}

export function parseDifficulty(difficulty: string) {
  const match = difficulty.match(/\d+/)
  return match ? Number(match[0]) : null
}

export function getDifficultyBucket(difficulty: string): Exclude<DifficultyBucket, 'All'> {
  const value = parseDifficulty(difficulty)

  if (value === null) {
    return 'unknown'
  }

  if (value <= 800) {
    return 'le-800'
  }

  if (value >= 900 && value <= 1200) {
    return '900-1200'
  }

  if (value >= 1300 && value <= 1600) {
    return '1300-1600'
  }

  return '1600-plus'
}

export function getDifficultyBucketLabel(bucket: DifficultyBucket) {
  return difficultyBucketOptions.find((item) => item.value === bucket)?.label ?? bucket
}

export function parseSubmittedAt(value: string) {
  const normalized = value.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getProblemKey(submission: SubmissionRecord) {
  return `${submission.platform}:${submission.problemId || submission.problem}`
}

function toDistribution(map: Map<string, number>) {
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
}

function addCount(map: Map<string, number>, key: string, count = 1) {
  map.set(key, (map.get(key) ?? 0) + count)
}

export function getStatusCounts(submissions: SubmissionRecord[]) {
  return submissions.reduce<Record<SubmissionStatus, number>>(
    (acc, submission) => {
      acc[submission.status] += 1
      return acc
    },
    { ...statusSeed },
  )
}

export function getTagAnalysis(submissions: SubmissionRecord[]): TagAnalysisItem[] {
  const stats = new Map<string, { total: number; accepted: number; failed: number }>()

  for (const submission of submissions) {
    for (const tag of submission.tags) {
      const current = stats.get(tag) ?? { total: 0, accepted: 0, failed: 0 }
      current.total += 1
      if (submission.status === 'Accepted') {
        current.accepted += 1
      } else {
        current.failed += 1
      }
      stats.set(tag, current)
    }
  }

  return [...stats.entries()]
    .map(([tag, item]) => ({
      tag,
      ...item,
      acceptanceRate: Math.round((item.accepted / Math.max(item.total, 1)) * 100),
    }))
    .sort((a, b) => b.failed - a.failed || a.acceptanceRate - b.acceptanceRate || b.total - a.total)
}

export function getWeakTags(submissions: SubmissionRecord[], limit = 3): string[] {
  return getTagAnalysis(submissions)
    .filter((item) => item.failed > 0)
    .slice(0, limit)
    .map((item) => item.tag)
}

export function calculateSubmissionAnalysis(
  submissions: SubmissionRecord[],
  now = new Date(),
): AnalysisResult {
  const statusCounts = getStatusCounts(submissions)
  const solvedProblems = new Set<string>()
  const tagCounts = new Map<string, number>()
  const difficultyCounts = new Map<string, number>()
  const verdictCounts = new Map<string, number>()
  const languageCounts = new Map<string, number>()
  const recentCutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000
  let recent30Total = 0
  let recent30Accepted = 0

  for (const submission of submissions) {
    if (submission.status === 'Accepted') {
      solvedProblems.add(getProblemKey(submission))
    }

    for (const tag of submission.tags) {
      addCount(tagCounts, tag)
    }

    addCount(difficultyCounts, getDifficultyBucketLabel(getDifficultyBucket(submission.difficulty)))
    addCount(verdictCounts, getVerdictCode(submission.status))
    addCount(languageCounts, submission.language || 'Unknown')

    const submittedAt = parseSubmittedAt(submission.submittedAt)
    if (submittedAt && submittedAt.getTime() >= recentCutoff && submittedAt.getTime() <= now.getTime()) {
      recent30Total += 1
      if (submission.status === 'Accepted') {
        recent30Accepted += 1
      }
    }
  }

  const total = submissions.length
  const accepted = statusCounts.Accepted
  const tagDistribution = toDistribution(tagCounts)
  const tagAnalysis = getTagAnalysis(submissions)
  const weakestTag = tagAnalysis[0]?.tag ?? '-'

  return {
    total,
    accepted,
    nonAccepted: total - accepted,
    acceptanceRate: Math.round((accepted / Math.max(total, 1)) * 100),
    solvedProblems: solvedProblems.size,
    recent30Total,
    recent30Accepted,
    tagDistribution,
    difficultyDistribution: toDistribution(difficultyCounts),
    verdictDistribution: toDistribution(verdictCounts),
    languageDistribution: toDistribution(languageCounts),
    tagAnalysis,
    topTrainingTag: tagDistribution[0]?.name ?? '-',
    weakestTag,
    weakTags: tagAnalysis
      .filter((item) => item.failed > 0)
      .slice(0, 3)
      .map((item) => item.tag),
  }
}

export function getTrainingSummary(submissions: SubmissionRecord[]) {
  const analysis = calculateSubmissionAnalysis(submissions)
  const dpCount = analysis.tagDistribution.find((item) => item.name.toLowerCase() === 'dp')?.value ?? 0
  const waCount = analysis.verdictDistribution.find((item) => item.name === 'WA')?.value ?? 0
  const lowerDifficultyCount = analysis.difficultyDistribution
    .filter((item) => item.name === '<= 800' || item.name === '900-1200')
    .reduce((sum, item) => sum + item.value, 0)

  const suggestions: string[] = []

  if (analysis.total && dpCount / analysis.total < 0.08) {
    suggestions.push('DP 标签覆盖偏低，建议加入短周期 DP 专题，重点复盘状态定义和转移方程。')
  }

  if (analysis.total && waCount / analysis.total >= 0.35) {
    suggestions.push('WA 占比较高，提交前应补充样例、边界条件和对拍检查。')
  }

  if (analysis.recent30Total < 10) {
    suggestions.push('最近 30 天提交量偏低，建议本周先恢复 3-5 次有主题的训练提交。')
  }

  if (analysis.total && lowerDifficultyCount / analysis.total >= 0.5) {
    suggestions.push('难度集中在入门分段，可以开始尝试 1100-1300 的 Codeforces 题目。')
  }

  if (!suggestions.length) {
    suggestions.push(`当前节奏较稳定，建议围绕 ${analysis.weakestTag} 做小规模定向复盘。`)
  }

  return {
    ...analysis,
    headline: `已分析 ${analysis.total} 次提交，识别出 ${analysis.solvedProblems} 道去重已解决题目。`,
    focus:
      analysis.weakTags.length > 0
        ? `优先关注标签：${analysis.weakTags.join(' / ')}。`
        : '当前样本中没有明显薄弱标签。',
    suggestion: suggestions.join(' '),
    suggestions,
  }
}
