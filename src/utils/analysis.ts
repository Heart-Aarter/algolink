import type { SubmissionRecord, SubmissionStatus } from '@/types/algolink'
import { getAlgorithmTags } from '@/utils/tags'
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
  { value: 'lt-1200', label: '<1200' },
  { value: '1200-1399', label: '1200-1399' },
  { value: '1400-1599', label: '1400-1599' },
  { value: '1600-1899', label: '1600-1899' },
  { value: '1900-2099', label: '1900-2099' },
  { value: '2100-2399', label: '2100-2399' },
  { value: '2400-plus', label: '2400+' },
  { value: 'unknown', label: 'Unknown' },
] as const

export type DifficultyBucket = (typeof difficultyBucketOptions)[number]['value']
type ActualDifficultyBucket = Exclude<DifficultyBucket, 'All'>

const difficultyBucketColors: Record<ActualDifficultyBucket, string> = {
  '2400-plus': '#8e2724',
  '2100-2399': '#c28a2e',
  '1900-2099': '#b77955',
  '1600-1899': '#8cab9f',
  '1400-1599': '#6e9286',
  '1200-1399': '#8f9f79',
  'lt-1200': '#b3aa9b',
  unknown: '#8f877a',
}

const difficultyBucketOrder = new Map<string, number>(
  difficultyBucketOptions.map((item, index) => [item.label, index]),
)

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

export function getDifficultyBucket(difficulty: string): ActualDifficultyBucket {
  const value = parseDifficulty(difficulty)

  if (value === null) {
    return 'unknown'
  }

  if (value >= 2400) {
    return '2400-plus'
  }

  if (value >= 2100) {
    return '2100-2399'
  }

  if (value >= 1900) {
    return '1900-2099'
  }

  if (value >= 1600) {
    return '1600-1899'
  }

  if (value >= 1400) {
    return '1400-1599'
  }

  if (value >= 1200) {
    return '1200-1399'
  }

  return 'lt-1200'
}

export function getDifficultyBucketLabel(bucket: DifficultyBucket) {
  return difficultyBucketOptions.find((item) => item.value === bucket)?.label ?? bucket
}

export function getDifficultyBucketColor(bucket: ActualDifficultyBucket) {
  return difficultyBucketColors[bucket]
}

export function getDifficultyLabelColor(label: string) {
  const bucket = difficultyBucketOptions.find((item) => item.label === label)?.value

  if (!bucket || bucket === 'All') {
    return difficultyBucketColors.unknown
  }

  return getDifficultyBucketColor(bucket)
}

export function sortDifficultyDistribution<T extends DistributionItem>(items: T[]): T[] {
  return [...items].sort(
    (left, right) =>
      (difficultyBucketOrder.get(left.name) ?? Number.MAX_SAFE_INTEGER) -
        (difficultyBucketOrder.get(right.name) ?? Number.MAX_SAFE_INTEGER) ||
      left.name.localeCompare(right.name),
  )
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
    for (const tag of getAlgorithmTags(submission.tags)) {
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

    for (const tag of getAlgorithmTags(submission.tags)) {
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

export function getTrainingSummary(
  submissions: SubmissionRecord[],
  aiTone: 'strict' | 'balanced' | 'encouraging' = 'balanced',
) {
  const analysis = calculateSubmissionAnalysis(submissions)
  const dpCount = analysis.tagDistribution.find((item) => item.name.toLowerCase() === 'dp')?.value ?? 0
  const waCount = analysis.verdictDistribution.find((item) => item.name === 'WA')?.value ?? 0
  const lowerDifficultyCount = analysis.difficultyDistribution
    .filter((item) => item.name === '<1200' || item.name === '1200-1399')
    .reduce((sum, item) => sum + item.value, 0)

  const suggestions: string[] = []

  if (analysis.total && dpCount / analysis.total < 0.08) {
    suggestions.push(
      aiTone === 'strict'
        ? 'DP 标签覆盖率不足，必须补充动态规划专题：重点训练状态定义和转移方程推导。'
        : aiTone === 'encouraging'
          ? 'DP 方向还有不少拓展空间，试着找几道经典状态转移题热热身吧～'
          : 'DP 标签覆盖偏低，建议加入短周期 DP 专题，重点复盘状态定义和转移方程。',
    )
  }

  if (analysis.total && waCount / analysis.total >= 0.35) {
    suggestions.push(
      aiTone === 'strict'
        ? 'WA 占比过高，提交前必须完成样例验证、边界条件检查和对拍测试。'
        : aiTone === 'encouraging'
          ? 'WA 占比略高不用太着急，每次提交前多做一步本地校验，正确率会慢慢提上来。'
          : 'WA 占比较高，提交前应补充样例、边界条件和对拍检查。',
    )
  }

  if (analysis.recent30Total < 10) {
    suggestions.push(
      aiTone === 'strict'
        ? '近 30 天提交量严重不足，本周必须恢复至少 5 次有主题的训练提交。'
        : aiTone === 'encouraging'
          ? '最近训练节奏稍有放缓，不用给自己太大压力，这周慢慢恢复几次提交就很好！'
          : '最近 30 天提交量偏低，建议本周先恢复 3-5 次有主题的训练提交。',
    )
  }

  if (analysis.total && lowerDifficultyCount / analysis.total >= 0.5) {
    suggestions.push(
      aiTone === 'strict'
        ? '难度过度集中在入门分段，需要立即向 1100-1300 的 Codeforces 题迁移。'
        : aiTone === 'encouraging'
          ? '你的基础已经很扎实啦～可以适当挑战更高难度的题目，看看自己在 1100-1300 分段的表现。'
          : '难度集中在入门分段，可以开始尝试 1100-1300 的 Codeforces 题目。',
    )
  }

  if (!suggestions.length) {
    const tag = analysis.weakestTag
    suggestions.push(
      aiTone === 'strict'
        ? `当前节奏较稳定，仍需围绕 ${tag} 定向复盘薄弱环节。`
        : aiTone === 'encouraging'
          ? `节奏保持得很不错！如果想更进一步，可以稍微关注一下 ${tag} 的题目哦～`
          : `当前节奏较稳定，建议围绕 ${tag} 做小规模定向复盘。`,
    )
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
