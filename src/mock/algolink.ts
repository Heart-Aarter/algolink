import type {
  AbilityMetric,
  AiFinding,
  ContestMilestone,
  OjAccount,
  PlatformSyncState,
  ProblemRecommendation,
  SubmissionRecord,
  TopicInsight,
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
  {
    id: 's-1007',
    platform: 'Codeforces',
    problem: '1904D2 Set To Max',
    difficulty: '1800',
    tags: ['data structures', 'greedy'],
    status: 'Wrong Answer',
    language: 'GNU C++20',
    submittedAt: '2026-04-22 21:11',
    runtime: '108 ms',
  },
  {
    id: 's-1008',
    platform: 'Luogu',
    problem: 'P1434 滑雪',
    difficulty: '普及+/提高',
    tags: ['dfs', 'memoization'],
    status: 'Accepted',
    language: 'C++17',
    submittedAt: '2026-04-22 18:44',
    runtime: '20 ms',
  },
]

export const trendSeries = [
  { date: '04-21', solved: 4, attempts: 6, focus: 'dp' },
  { date: '04-22', solved: 6, attempts: 8, focus: 'dfs' },
  { date: '04-23', solved: 3, attempts: 7, focus: 'math' },
  { date: '04-24', solved: 5, attempts: 9, focus: 'graph' },
  { date: '04-25', solved: 7, attempts: 10, focus: 'greedy' },
  { date: '04-26', solved: 2, attempts: 5, focus: 'bfs' },
  { date: '04-27', solved: 8, attempts: 11, focus: 'mixed' },
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
    progress: 55,
    dueDate: '04-29',
  },
  {
    id: 't-02',
    title: '完成 P4779 标准版最短路',
    platform: 'Luogu',
    difficulty: '提高+/省选-',
    focus: '图论模板',
    status: 'todo',
    progress: 0,
    dueDate: '04-30',
  },
  {
    id: 't-03',
    title: 'Codeforces 1400 贪心专题 3 题',
    platform: 'Codeforces',
    difficulty: '1400',
    focus: '贪心构造',
    status: 'todo',
    progress: 20,
    dueDate: '05-02',
  },
  {
    id: 't-04',
    title: '网格 BFS 状态设计复盘',
    platform: 'AtCoder',
    difficulty: '800',
    focus: '搜索',
    status: 'done',
    progress: 100,
    dueDate: '04-27',
  },
]

export const platformSyncStates: PlatformSyncState[] = [
  {
    platform: 'Codeforces',
    status: 'synced',
    coverage: 96,
    latency: '1.2s',
    nextSync: '今日 23:30',
    note: 'rating、提交与题目标签均已更新。',
  },
  {
    platform: 'Luogu',
    status: 'warning',
    coverage: 82,
    latency: '2.8s',
    nextSync: '手动触发',
    note: '部分题目难度需等待下一次公开页面解析。',
  },
  {
    platform: 'AtCoder',
    status: 'queued',
    coverage: 74,
    latency: '排队中',
    nextSync: '今日 23:45',
    note: '等待 contest history 与最近提交合并。',
  },
]

export const topicInsights: TopicInsight[] = [
  {
    topic: '动态规划',
    solved: 128,
    accuracy: 71,
    weakPoint: '状态转移边界容易遗漏。',
    nextAction: '补 2 道网格 DP 与 1 道期望 DP。',
  },
  {
    topic: '图论',
    solved: 94,
    accuracy: 63,
    weakPoint: '最短路和 BFS 状态建模稳定性不足。',
    nextAction: '复用模板做压力样例对照。',
  },
  {
    topic: '数学',
    solved: 76,
    accuracy: 58,
    weakPoint: '组合计数与概率题提交间隔偏长。',
    nextAction: '用 AtCoder E 题做低频专项训练。',
  },
  {
    topic: '贪心',
    solved: 151,
    accuracy: 84,
    weakPoint: '高分构造题解释链偏弱。',
    nextAction: '补 Codeforces 1500-1700 构造题。',
  },
]

export const problemRecommendations: ProblemRecommendation[] = [
  {
    id: 'r-01',
    title: 'ABC350 E Toward 0',
    platform: 'AtCoder',
    difficulty: '1600',
    tags: ['expectation', 'memoization'],
    reason: '正好覆盖当前最低的数学/期望能力缺口。',
    fitScore: 94,
  },
  {
    id: 'r-02',
    title: 'P4779 单源最短路径标准版',
    platform: 'Luogu',
    difficulty: '提高+/省选-',
    tags: ['graph', 'heap'],
    reason: '用于验证 Dijkstra 模板在大图上的稳定性。',
    fitScore: 88,
  },
  {
    id: 'r-03',
    title: 'Codeforces 1904D2 Set To Max',
    platform: 'Codeforces',
    difficulty: '1800',
    tags: ['data structures', 'greedy'],
    reason: '连接优势贪心与待提升的数据结构维护。',
    fitScore: 86,
  },
]

export const aiFindings: AiFinding[] = [
  {
    id: 'f-01',
    type: 'risk',
    title: '高难题复盘缺口',
    detail: '最近 1800 分段题目 WA 后没有形成二次通过记录。',
    impact: '会让题型判断停留在局部样例层面。',
  },
  {
    id: 'f-02',
    type: 'opportunity',
    title: '贪心迁移价值高',
    detail: '贪心题通过率较高，适合向数据结构维护和构造题迁移。',
    impact: '能用优势能力带动中高分题通过率。',
  },
  {
    id: 'f-03',
    type: 'habit',
    title: '晚间训练效率更高',
    detail: '20:00-23:00 的 accepted 占比最高，适合安排主线训练。',
    impact: '训练计划可把复盘放在低峰时段，把新题放在高峰时段。',
  },
]

export const contestMilestones: ContestMilestone[] = [
  {
    date: '04-29',
    platform: 'AtCoder',
    title: 'ABC 虚拟赛',
    goal: '前 4 题 70 分钟内完成。',
  },
  {
    date: '05-01',
    platform: 'Codeforces',
    title: 'Div.3 训练场',
    goal: 'B/C 题保持一次通过。',
  },
  {
    date: '05-03',
    platform: 'Luogu',
    title: '图论模板日',
    goal: '完成最短路和拓扑排序复盘。',
  },
]

export const defaultSettings: UserSettings = {
  syncInterval: 'manual',
  aiTone: 'balanced',
  showOnlyPublicData: true,
  defaultPlatform: 'Codeforces',
}
