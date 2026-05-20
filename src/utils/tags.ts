import type { SubmissionRecord } from '@/types/algolink'

const luoguDifficultyTags = new Set([
  '暂无评定',
  '入门',
  '普及-',
  '普及/提高-',
  '普及+/提高',
  '提高+/省选-',
  '省选/NOI-',
  'NOI/NOI+/CTSC',
])

const problemTypeTags = new Set(['P', 'B', 'CF', 'AT', 'UVA', 'SP', 'T'])

export function parseDifficulty(difficulty: string) {
  const match = difficulty.match(/\d+/)
  return match ? Number(match[0]) : null
}

function getDisplayDifficultyLabel(difficulty: string) {
  const value = parseDifficulty(difficulty)

  if (value === null) return 'Unknown'
  if (value >= 2400) return '2400+'
  if (value >= 2100) return '2100-2399'
  if (value >= 1900) return '1900-2099'
  if (value >= 1600) return '1600-1899'
  if (value >= 1400) return '1400-1599'
  if (value >= 1200) return '1200-1399'
  return '<1200'
}

function isAtCoderContestTag(tag: string) {
  return /^(abc|arc|agc|ahc|typical90|practice|dp|joi|past)\d*/i.test(tag)
}

export function isAlgorithmTag(tag: string) {
  const normalized = tag.trim()

  if (!normalized) {
    return false
  }

  if (luoguDifficultyTags.has(normalized) || problemTypeTags.has(normalized)) {
    return false
  }

  if (/^tag-\d+$/.test(normalized) || /^<\d+$/.test(normalized) || /^\d{3,4}(\+)?$/.test(normalized)) {
    return false
  }

  if (/^\d{3,4}-\d{3,4}$/.test(normalized) || isAtCoderContestTag(normalized)) {
    return false
  }

  return true
}

export function getAlgorithmTags(tags: string[]) {
  return tags.filter(isAlgorithmTag)
}

export function getDisplayTags(submission: SubmissionRecord) {
  const algorithmTags = getAlgorithmTags(submission.tags)

  if (algorithmTags.length) {
    return algorithmTags
  }

  return [getDisplayDifficultyLabel(submission.difficulty)]
}
