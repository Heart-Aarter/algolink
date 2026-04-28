import type { SubmissionRecord, SubmissionStatus } from '@/types/algolink'

export interface TagAnalysisItem {
  tag: string
  total: number
  accepted: number
  failed: number
  acceptanceRate: number
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

export function getStatusCounts(submissions: SubmissionRecord[]) {
  const statusSeed: Record<SubmissionStatus, number> = {
    Accepted: 0,
    'Wrong Answer': 0,
    'Time Limit': 0,
    'Runtime Error': 0,
  }

  return submissions.reduce((acc, submission) => {
    acc[submission.status] += 1
    return acc
  }, statusSeed)
}

export function getTrainingSummary(submissions: SubmissionRecord[]) {
  const statusCounts = getStatusCounts(submissions)
  const weakTags = getWeakTags(submissions, 3)
  const total = submissions.length
  const accepted = statusCounts.Accepted
  const acceptanceRate = Math.round((accepted / Math.max(total, 1)) * 100)

  return {
    total,
    accepted,
    acceptanceRate,
    weakTags,
    stableTags: ['bfs', 'graph', 'greedy'],
    headline: '最近训练较稳定，搜索和图论保持较好手感',
    focus: '动态规划和数学题仍是本周主要补强方向',
    suggestion: '建议进行 7 天专题训练：先补 DP 边界，再复盘图论模板，最后用混合题检验效果。',
  }
}
