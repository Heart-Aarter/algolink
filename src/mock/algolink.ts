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
    id: 'cf-demo',
    platform: 'Codeforces',
    handle: 'algo_runner',
    status: 'bound',
    rating: 1684,
    solved: 2,
    lastSyncAt: '2026-04-27 21:30',
    color: '#7fa4d8',
  },
  {
    id: 'luogu-demo',
    platform: 'Luogu',
    handle: 'dp_starter',
    status: 'bound',
    rating: 2380,
    solved: 2,
    lastSyncAt: '2026-04-27 20:12',
    color: '#78c891',
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
    title: '集中修复 DP 状态设计和边界处理',
    priority: 'High',
    reason: '最近的 mock 记录里，DP 与记忆化相关题目出现 WA/RE，说明状态转移和边界验证仍不稳定。',
    action: '复盘 ABC350 E，再补 3 道 1400-1700 的 DP 题。',
    estimatedDays: 4,
  },
  {
    id: 'a-02',
    title: '补齐最短路模板熟练度',
    priority: 'Medium',
    reason: 'Luogu 最短路题出现 TLE，优先检查堆优化 Dijkstra 和数据范围处理。',
    action: '重写 P3371 和 P4779，并记录复杂度和反例。',
    estimatedDays: 2,
  },
  {
    id: 'a-03',
    title: '维持贪心题手感',
    priority: 'Low',
    reason: '贪心类 Accepted 比例较高，适合作为每日热身。',
    action: '每天完成 1 道 Codeforces B/C 题。',
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
    title: '完成 P4779 单源最短路径',
    platform: 'Luogu',
    difficulty: '提高+',
    focus: '图论和堆优化',
    status: 'todo',
    progress: 0,
    dueDate: '04-30',
  },
  {
    id: 't-03',
    title: 'Codeforces 1400 贪心训练 3 题',
    platform: 'Codeforces',
    difficulty: '1400',
    focus: '贪心建模',
    status: 'todo',
    progress: 20,
    dueDate: '05-02',
  },
]

export const platformSyncStates: PlatformSyncState[] = [
  {
    platform: 'Codeforces',
    status: 'synced',
    coverage: 96,
    latency: '1.2s',
    nextSync: '手动触发',
    note: '公开 rating、提交和题目标签已用于 mock 分析。',
  },
  {
    platform: 'Luogu',
    status: 'warning',
    coverage: 82,
    latency: '2.8s',
    nextSync: '手动触发',
    note: '仅展示公开用户名关联的模拟提交，不需要密码。',
  },
  {
    platform: 'AtCoder',
    status: 'queued',
    coverage: 74,
    latency: '排队中',
    nextSync: '手动触发',
    note: 'contest history 使用 mock 数据占位。',
  },
]

export const topicInsights: TopicInsight[] = [
  {
    topic: '动态规划',
    solved: 128,
    accuracy: 71,
    weakPoint: '状态定义较慢，边界用例容易漏判。',
    nextAction: '优先复盘 2 道网格 DP 和 1 道期望 DP。',
  },
  {
    topic: '图论',
    solved: 94,
    accuracy: 63,
    weakPoint: '最短路模板和 BFS 状态压缩需要继续巩固。',
    nextAction: '整理 Dijkstra、BFS 的复杂度和常见坑。',
  },
  {
    topic: '数学',
    solved: 76,
    accuracy: 58,
    weakPoint: '取模和组合计数题的推导稳定性不足。',
    nextAction: '补 AtCoder E 难度的数学题。',
  },
  {
    topic: '贪心',
    solved: 151,
    accuracy: 84,
    weakPoint: '构造型贪心仍需加强证明过程。',
    nextAction: '继续刷 Codeforces 1500-1700 贪心题。',
  },
]

export const problemRecommendations: ProblemRecommendation[] = [
  {
    id: 'r-01',
    title: 'ABC350 E Toward 0',
    platform: 'AtCoder',
    difficulty: '1600',
    tags: ['expectation', 'memoization'],
    reason: '适合补强期望 DP 和记忆化搜索。',
    fitScore: 94,
  },
  {
    id: 'r-02',
    title: 'P4779 单源最短路径',
    platform: 'Luogu',
    difficulty: '提高+',
    tags: ['graph', 'heap'],
    reason: '适合检查 Dijkstra 模板熟练度。',
    fitScore: 88,
  },
  {
    id: 'r-03',
    title: 'Codeforces 1904D2 Set To Max',
    platform: 'Codeforces',
    difficulty: '1800',
    tags: ['data structures', 'greedy'],
    reason: '适合训练数据结构与贪心结合的建模。',
    fitScore: 86,
  },
]

export const aiFindings: AiFinding[] = [
  {
    id: 'f-01',
    type: 'risk',
    title: '高难度题 WA 占比偏高',
    detail: '1800 左右题目的错误主要集中在数据结构和边界验证。',
    impact: '建议把复盘和反例构造放进训练计划。',
  },
  {
    id: 'f-02',
    type: 'opportunity',
    title: '贪心题稳定性较好',
    detail: 'Codeforces B/C 级别题目通过率较高，可以作为提速突破口。',
    impact: '保持每日热身，逐步迁移到 1600 以上题目。',
  },
  {
    id: 'f-03',
    type: 'habit',
    title: '晚间提交效率最高',
    detail: '20:00-23:00 的 Accepted 比例最高。',
    impact: '训练计划可以把难题安排到该时间段。',
  },
]

export const contestMilestones: ContestMilestone[] = [
  {
    date: '04-29',
    platform: 'AtCoder',
    title: 'ABC 赛前训练',
    goal: '完成 4 题并控制罚时。',
  },
  {
    date: '05-01',
    platform: 'Codeforces',
    title: 'Div.3 训练',
    goal: '稳定通过 B/C 题。',
  },
  {
    date: '05-03',
    platform: 'Luogu',
    title: '图论模板复盘',
    goal: '完成最短路和 BFS 专项。',
  },
]

export const defaultSettings: UserSettings = {
  syncInterval: 'manual',
  aiTone: 'balanced',
  showOnlyPublicData: true,
  defaultPlatform: 'Codeforces',
}

