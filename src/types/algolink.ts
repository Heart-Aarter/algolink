export type OjPlatform = 'Codeforces' | 'Luogu' | 'AtCoder'

export type SubmissionStatus = 'Accepted' | 'Wrong Answer' | 'Time Limit' | 'Runtime Error'

export interface OjAccount {
  id: string
  platform: OjPlatform
  handle: string
  rating: number
  solved: number
  lastSync: string
  color: string
}

export interface SubmissionRecord {
  id: string
  platform: OjPlatform
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
}

export interface UserSettings {
  syncInterval: 'manual' | 'daily' | 'weekly'
  aiTone: 'strict' | 'balanced' | 'encouraging'
  showOnlyPublicData: boolean
  defaultPlatform: OjPlatform
}
