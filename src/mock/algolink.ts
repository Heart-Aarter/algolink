import type {
  AbilityMetric,
  OjAccount,
  SubmissionRecord,
  TrainingAdvice,
  TrainingTask,
  UserSettings,
} from '@/types/algolink'

export const mockAccounts: OjAccount[] = [
  {
    id: 'cf-tourist-lite',
    platform: 'Codeforces',
    handle: 'algo_runner',
    rating: 1684,
    solved: 426,
    lastSync: '2026-04-27 21:30',
    color: '#4f8cff',
  },
  {
    id: 'luogu-blue',
    platform: 'Luogu',
    handle: 'dp_starter',
    rating: 2380,
    solved: 618,
    lastSync: '2026-04-27 20:12',
    color: '#28c76f',
  },
  {
    id: 'atcoder-cyan',
    platform: 'AtCoder',
    handle: 'abc_focus',
    rating: 1216,
    solved: 203,
    lastSync: '2026-04-26 23:05',
    color: '#00c2ff',
  },
]

export const mockSubmissions: SubmissionRecord[] = [
  {
    id: 's-1001',
    platform: 'Codeforces',
    problem: '1832C Contrast Value',
    difficulty: '1200',
    tags: ['greedy', 'implementation'],
    status: 'Accepted',
    language: 'GNU C++17',
    submittedAt: '2026-04-27 22:14',
    runtime: '46 ms',
  },
  {
    id: 's-1002',
    platform: 'Luogu',
    problem: 'P1002 过河卒',
    difficulty: '普及-',
    tags: ['dp', 'grid'],
    status: 'Accepted',
    language: 'C++14',
    submittedAt: '2026-04-27 21:40',
    runtime: '12 ms',
  },
  {
    id: 's-1003',
    platform: 'AtCoder',
    problem: 'ABC348 D Medicines on Grid',
    difficulty: '800',
    tags: ['bfs', 'graph'],
    status: 'Wrong Answer',
    language: 'C++20',
    submittedAt: '2026-04-26 19:28',
    runtime: '92 ms',
  },
  {
    id: 's-1004',
    platform: 'Codeforces',
    problem: '1995B1 Bouquet',
    difficulty: '1100',
    tags: ['sort', 'two pointers'],
    status: 'Accepted',
    language: 'GNU C++20',
    submittedAt: '2026-04-25 22:03',
    runtime: '62 ms',
  },
  {
    id: 's-1005',
    platform: 'Luogu',
    problem: 'P3371 单源最短路径',
    difficulty: '普及+/提高',
    tags: ['shortest path', 'heap'],
    status: 'Time Limit',
    language: 'C++17',
    submittedAt: '2026-04-24 18:52',
    runtime: '1000 ms',
  },
  {
    id: 's-1006',
    platform: 'AtCoder',
    problem: 'ABC350 E Toward 0',
    difficulty: '1600',
    tags: ['expectation', 'memoization'],
    status: 'Runtime Error',
    language: 'C++20',
    submittedAt: '2026-04-23 22:31',
    runtime: '31 ms',
  },
]

export const trendSeries = [
  { date: '04-21', solved: 4, attempts: 6 },
  { date: '04-22', solved: 6, attempts: 8 },
  { date: '04-23', solved: 3, attempts: 7 },
  { date: '04-24', solved: 5, attempts: 9 },
  { date: '04-25', solved: 7, attempts: 10 },
  { date: '04-26', solved: 2, attempts: 5 },
  { date: '04-27', solved: 8, attempts: 11 },
]

export const abilityMetrics: AbilityMetric[] = [
  { name: '动态规划', score: 68, target: 82, trend: 'up' },
  { name: '图论', score: 61, target: 78, trend: 'stable' },
  { name: '贪心', score: 82, target: 86, trend: 'up' },
  { name: '数据结构', score: 74, target: 84, trend: 'up' },
  { name: '数学', score: 55, target: 75, trend: 'down' },
  { name: '搜索', score: 71, target: 80, trend: 'stable' },
]

export const trainingAdvice: TrainingAdvice[] = [
  {
    id: 'a-01',
    title: '补齐期望 DP 与记忆化搜索',
    priority: 'High',
    reason: '近 14 天在概率期望题上出现 2 次 RE/WA，且提交间隔较长。',
    action: '先复盘 ABC350 E，再完成 3 道 1400-1700 分段的期望 DP 题。',
    estimatedDays: 4,
  },
  {
    id: 'a-02',
    title: '优化最短路模板稳定性',
    priority: 'Medium',
    reason: 'Dijkstra 模板在大数据图上出现超时，可能与优先队列去重策略有关。',
    action: '整理单源最短路模板，并用 Luogu P3371、P4779 做对照训练。',
    estimatedDays: 2,
  },
  {
    id: 'a-03',
    title: '保持贪心题手感',
    priority: 'Low',
    reason: '贪心正确率稳定，但最近题型集中在简单构造。',
    action: '每周加入 2 道含排序或双指针约束的 Codeforces B/C 题。',
    estimatedDays: 1,
  },
]

export const trainingTasks: TrainingTask[] = [
  {
    id: 't-01',
    title: '复盘 ABC350 E Toward 0',
    platform: 'AtCoder',
    difficulty: '1600',
    focus: '期望 DP',
    status: 'doing',
  },
  {
    id: 't-02',
    title: '完成 P4779 标准版最短路',
    platform: 'Luogu',
    difficulty: '提高+/省选-',
    focus: '图论模板',
    status: 'todo',
  },
  {
    id: 't-03',
    title: 'Codeforces 1400 贪心专题 3 题',
    platform: 'Codeforces',
    difficulty: '1400',
    focus: '贪心构造',
    status: 'todo',
  },
  {
    id: 't-04',
    title: '网格 BFS 状态设计复盘',
    platform: 'AtCoder',
    difficulty: '800',
    focus: '搜索',
    status: 'done',
  },
]

export const defaultSettings: UserSettings = {
  syncInterval: 'manual',
  aiTone: 'balanced',
  showOnlyPublicData: true,
  defaultPlatform: 'Codeforces',
}
