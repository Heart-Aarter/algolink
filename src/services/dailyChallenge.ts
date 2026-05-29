import type { DailyDifficulty, DailyProblem } from '@/types/algolink'

interface CodeforcesApiResponse<T> {
  status: 'OK' | 'FAILED'
  comment?: string
  result: T
}

interface CodeforcesProblemset {
  problems: Array<{
    contestId?: number
    index: string
    name: string
    rating?: number
  }>
}

let problemsetCache: { data: DailyProblem[]; timestamp: number } | null = null
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

function pickRandom<T>(items: T[], seed: string) {
  if (!items.length) {
    throw new Error('No matching Codeforces problems found')
  }

  let hash = 0

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  const item = items[hash % items.length]

  if (!item) {
    throw new Error('No matching Codeforces problems found')
  }

  return item
}

function toProblemLevel(difficulty: number): DailyDifficulty {
  if (difficulty < 1400) {
    return 'easy'
  }

  return difficulty <= 1800 ? 'medium' : 'hard'
}

export async function fetchDailyProblems(date: string): Promise<DailyProblem[]> {
  const codeforces = await fetchCodeforcesProblems()
  const easyPool = codeforces.filter((problem) => problem.difficulty < 1400)
  const mediumPool = codeforces.filter(
    (problem) => problem.difficulty >= 1400 && problem.difficulty <= 1800,
  )
  const hardPool = codeforces.filter((problem) => problem.difficulty > 1800)

  return [
    pickRandom(easyPool, `${date}:easy`),
    pickRandom(mediumPool, `${date}:medium`),
    pickRandom(hardPool, `${date}:hard`),
  ]
}

async function fetchCodeforcesProblems(): Promise<DailyProblem[]> {
  const now = Date.now()

  if (problemsetCache && now - problemsetCache.timestamp < CACHE_TTL_MS) {
    return problemsetCache.data
  }

  const response = await fetch('https://codeforces.com/api/problemset.problems')
  const data = (await response.json()) as CodeforcesApiResponse<CodeforcesProblemset>

  if (data.status !== 'OK') {
    throw new Error(data.comment || 'Failed to fetch Codeforces problemset')
  }

  const problems = data.result.problems
    .filter((problem) => typeof problem.contestId === 'number' && typeof problem.rating === 'number')
    .map((problem) => {
      const difficulty = problem.rating ?? 0

      return {
        id: `cf-${problem.contestId}-${problem.index}`,
        platform: 'Codeforces' as const,
        title: `${problem.contestId}${problem.index} ${problem.name}`,
        difficulty,
        level: toProblemLevel(difficulty),
        url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
      }
    })

  problemsetCache = { data: problems, timestamp: now }
  return problems
}
