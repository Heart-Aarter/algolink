import type {
  OjAccount,
  TrainingPlanStatus,
  TrainingTask,
  WeeklyTrainingPlanDay,
} from '@/types/algolink'

export type StoredOjAccount = Partial<OjAccount> & { lastSync?: string }

export type CodeforcesAvatarCacheEntry = {
  avatar: string
  rating: number
  rank?: string
  fetchedAt: string
}

export type CodeforcesAvatarCache = Record<string, CodeforcesAvatarCacheEntry>

export interface TrainingPlanCache {
  trainingTasks: TrainingTask[]
  weeklyPlanItems: WeeklyTrainingPlanDay[]
  weeklyPlanStatus: Record<string, TrainingPlanStatus>
}
