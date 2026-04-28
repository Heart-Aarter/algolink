import type { RecommendedProblem } from '@/types/algolink'

export const recommendedProblems: RecommendedProblem[] = [
  {
    id: 'rp-01',
    platform: 'AtCoder',
    title: 'ABC350 E Toward 0',
    difficulty: '1600',
    tags: ['dp', 'expectation', 'memoization'],
    reason: '近期 DP 和记忆化题出现 RE，适合训练状态定义、递归出口和浮点期望处理。',
  },
  {
    id: 'rp-02',
    platform: 'Luogu',
    title: 'P4779 单源最短路径',
    difficulty: '提高+',
    tags: ['graph', 'heap', 'shortest path'],
    reason: '最短路 mock 记录出现 TLE，建议用堆优化 Dijkstra 复盘复杂度和松弛条件。',
  },
  {
    id: 'rp-03',
    platform: 'Codeforces',
    title: '1904D2 Set To Max',
    difficulty: '1800',
    tags: ['data structures', 'greedy'],
    reason: '数据结构和贪心结合题有 WA 记录，适合练习区间约束和反例构造。',
  },
  {
    id: 'rp-05',
    platform: 'AtCoder',
    title: 'ABC348 D Medicines on Grid',
    difficulty: '800',
    tags: ['bfs', 'graph'],
    reason: '搜索和图论表现较稳定，保留一题作为状态搜索热身，避免只刷薄弱题导致节奏过重。',
  },
]

