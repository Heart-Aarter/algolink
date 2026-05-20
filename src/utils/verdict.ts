import type { SubmissionStatus } from '@/types/algolink'

export type VerdictFilter = 'All' | 'AC' | 'WA' | 'TLE' | 'RE' | 'CE' | 'UNKNOWN'

export const verdictOptions: VerdictFilter[] = ['All', 'AC', 'WA', 'TLE', 'RE', 'CE', 'UNKNOWN']

const statusToFilter: Record<SubmissionStatus, Exclude<VerdictFilter, 'All'>> = {
  Accepted: 'AC',
  'Wrong Answer': 'WA',
  'Time Limit': 'TLE',
  'Runtime Error': 'RE',
  'Compilation Error': 'CE',
  Unknown: 'UNKNOWN',
}

export function getVerdictCode(status: SubmissionStatus) {
  return statusToFilter[status]
}

export function matchesVerdictFilter(status: SubmissionStatus, filter: VerdictFilter) {
  return filter === 'All' || statusToFilter[status] === filter
}

