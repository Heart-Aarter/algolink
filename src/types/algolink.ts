export type OjPlatform = 'Codeforces' | 'Luogu' | 'AtCoder' | 'LeetCode'

export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit'
  | 'Runtime Error'
  | 'Compilation Error'
  | 'Unknown'

export interface OjAccount {
  id: string
  platform: OjPlatform
  handle: string
  status: 'bound'
  rating: number
  maxRating?: number
  solved: number
  lastSyncAt: string
  color: string
}

export interface SubmissionRecord {
  id: string
  platform: OjPlatform
  problemId?: string
  problem: string
  difficulty: string
  tags: string[]
  status: SubmissionStatus
  language: string
  submittedAt: string
  runtime: string
}

export interface AbilityMetric {
  name: string
  score: number
  target: number
  trend: 'up' | 'down' | 'stable'
}

export interface TrainingAdvice {
  id: string
  title: string
  priority: 'High' | 'Medium' | 'Low'
  reason: string
  action: string
  estimatedDays: number
}

export interface TrainingTask {
  id: string
  title: string
  platform: OjPlatform
  difficulty: string
  focus: string
  status: 'todo' | 'doing' | 'done'
  progress?: number
  dueDate?: string
}

export type TrainingPlanStatus = 'not-started' | 'doing' | 'done'

export interface WeeklyTrainingPlanDay {
  id: string
  dayLabel: string
  theme: string
  problemCount: number
  tags: string[]
  goal: string
  reviewAdvice: string
}

export interface RecommendedProblem {
  id: string
  platform: OjPlatform
  title: string
  difficulty: string
  tags: string[]
  reason: string
}

export interface UserSettings {
  syncInterval: 'manual' | 'daily' | 'weekly'
  aiTone: 'strict' | 'balanced' | 'encouraging'
  showOnlyPublicData: boolean
  defaultPlatform: OjPlatform
}

export interface PlatformSyncState {
  platform: OjPlatform
  status: 'synced' | 'queued' | 'warning'
  coverage: number
  latency: string
  nextSync: string
  note: string
}

export interface TopicInsight {
  topic: string
  solved: number
  accuracy: number
  weakPoint: string
  nextAction: string
}

export interface ProblemRecommendation {
  id: string
  title: string
  platform: OjPlatform
  difficulty: string
  tags: string[]
  reason: string
  fitScore: number
}

export interface AiFinding {
  id: string
  type: 'risk' | 'opportunity' | 'habit'
  title: string
  detail: string
  impact: string
}

export interface ContestMilestone {
  date: string
  platform: OjPlatform
  title: string
  goal: string
}
