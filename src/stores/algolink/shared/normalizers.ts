import { defaultSettings, trainingTasks as mockTrainingTasks } from '@/mock/algolink'
import { weeklyTrainingPlan } from '@/mock/trainingPlan'
import type {
  AiProvider,
  DailyChallengeState,
  LeaderboardEntry,
  OjAccount,
  OjPlatform,
  SubmissionRecord,
  TrainingPlanStatus,
  TrainingTask,
  UserSettings,
  WeeklyTrainingPlanDay,
} from '@/types/algolink'
import { getCodeforcesRankColor } from '@/utils/codeforcesRank'
import { platformColors, supportedAiProviders, supportedPlatforms } from './constants'
import type { StoredOjAccount, TrainingPlanCache } from './types'

export function normalizeAccounts(value: StoredOjAccount[]): OjAccount[] {
  return value
    .filter(
      (account): account is StoredOjAccount & { platform: OjPlatform; handle: string } =>
        !!account.platform &&
        supportedPlatforms.includes(account.platform) &&
        typeof account.handle === 'string' &&
        account.handle.trim().length > 0,
    )
    .map((account) => ({
      id: account.id || `${account.platform.toLowerCase()}-${account.handle}`,
      platform: account.platform,
      handle: account.handle.trim(),
      status: 'bound',
      rating: Number(account.rating ?? 0),
      maxRating: Number(account.maxRating ?? account.rating ?? 0),
      rank: typeof account.rank === 'string' ? account.rank : undefined,
      maxRank: typeof account.maxRank === 'string' ? account.maxRank : undefined,
      avatar: typeof account.avatar === 'string' ? account.avatar : undefined,
      registeredAt: typeof account.registeredAt === 'string' ? account.registeredAt : undefined,
      lastOnlineAt: typeof account.lastOnlineAt === 'string' ? account.lastOnlineAt : undefined,
      solved: Number(account.solved ?? 0),
      lastSyncAt: account.lastSyncAt || account.lastSync || '暂无同步',
      color: account.color || platformColors[account.platform],
    }))
}

export function normalizeAiProvider(value: unknown): AiProvider {
  return supportedAiProviders.includes(value as AiProvider)
    ? (value as AiProvider)
    : defaultSettings.aiProvider
}

export function normalizeSettings(value: unknown): UserSettings {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<UserSettings>)
      : {}

  return {
    ...defaultSettings,
    ...source,
    aiProvider: normalizeAiProvider(source.aiProvider),
    aiEnabled: Boolean(source.aiEnabled),
    aiBaseUrl: typeof source.aiBaseUrl === 'string' ? source.aiBaseUrl : defaultSettings.aiBaseUrl,
    aiApiKey: typeof source.aiApiKey === 'string' ? source.aiApiKey : '',
    aiModel: typeof source.aiModel === 'string' ? source.aiModel : defaultSettings.aiModel,
    aiPromptPreference:
      typeof source.aiPromptPreference === 'string' ? source.aiPromptPreference : '',
  }
}

export function normalizeTrainingPlan(value: unknown): TrainingPlanCache {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<TrainingPlanCache>)
      : {}

  return {
    trainingTasks: Array.isArray(source.trainingTasks) ? source.trainingTasks : mockTrainingTasks,
    weeklyPlanItems: Array.isArray(source.weeklyPlanItems)
      ? source.weeklyPlanItems
      : weeklyTrainingPlan,
    weeklyPlanStatus:
      source.weeklyPlanStatus &&
      typeof source.weeklyPlanStatus === 'object' &&
      !Array.isArray(source.weeklyPlanStatus)
        ? (source.weeklyPlanStatus as Record<string, TrainingPlanStatus>)
        : {},
  }
}

export function normalizeDailyChallenge(value: unknown): DailyChallengeState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const source = value as Partial<DailyChallengeState>

  if (
    typeof source.date !== 'string' ||
    !Array.isArray(source.problems) ||
    !Array.isArray(source.completedProblemIds)
  ) {
    return null
  }

  return {
    date: source.date,
    problems: source.problems,
    completedProblemIds: source.completedProblemIds,
    awardedScore: Number(source.awardedScore ?? 0),
  }
}

export function normalizeLeaderboard(value: unknown): LeaderboardEntry[] {
  return Array.isArray(value)
    ? value
        .filter(
          (entry): entry is Partial<LeaderboardEntry> & { username: string; score: number } =>
            !!entry &&
            typeof entry === 'object' &&
            typeof entry.username === 'string' &&
            entry.username.trim().length > 0 &&
            Number.isFinite(entry.score),
        )
        .map((entry) => ({
          username: entry.username,
          score: Math.max(0, Math.floor(entry.score)),
          rank: typeof entry.rank === 'number' ? entry.rank : undefined,
          isCurrentUser: entry.isCurrentUser === true,
          gapToPrevious:
            typeof entry.gapToPrevious === 'number'
              ? Math.max(0, Math.floor(entry.gapToPrevious))
              : undefined,
          avatar: typeof entry.avatar === 'string' ? entry.avatar : undefined,
          displayRankColor:
            typeof entry.displayRankColor === 'string'
              ? entry.displayRankColor
              : getCodeforcesRankColor(Math.max(0, Math.floor(entry.score))),
        }))
    : []
}

export function normalizeSubmissionCache(value: unknown): Record<OjPlatform, SubmissionRecord[]> {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  return {
    Codeforces: Array.isArray(source.Codeforces)
      ? (source.Codeforces as SubmissionRecord[])
      : [],
    Luogu: Array.isArray(source.Luogu) ? (source.Luogu as SubmissionRecord[]) : [],
    AtCoder: Array.isArray(source.AtCoder) ? (source.AtCoder as SubmissionRecord[]) : [],
  }
}

export function hasSubmissionCache(value: Record<OjPlatform, SubmissionRecord[]>) {
  return Object.values(value).some((items) => items.length > 0)
}
