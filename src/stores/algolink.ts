import { computed, ref, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'
import {
  defaultSettings,
  mockSubmissions,
  trainingTasks as mockTrainingTasks,
} from '@/mock/algolink'
import { formatDateKey } from '@/utils/date'
import {
  fetchCodeforcesRating,
  fetchCodeforcesSubmissions,
  fetchCodeforcesUser,
  fetchCodeforcesUsers,
  hasRecentCodeforcesBindingCe,
} from '@/services/codeforces'
import {
  fetchAtCoderSubmissions,
  fetchAtCoderUser,
} from '@/services/atcoder'
import { fetchDailyProblems } from '@/services/dailyChallenge'
import {
  clearAiApiKey as clearSavedAiApiKey,
  getLeaderboard,
  getUserData,
  loginUser,
  logoutUser,
  saveAccounts,
  saveAiAdvice as saveSavedAiAdvice,
  saveAiApiKey as saveSavedAiApiKey,
  saveDailyChallenge,
  saveSettings,
  saveSubmissions,
  saveTrainingPlan,
  setApiSession,
  setApiUnauthorizedHandler,
  submitLeaderboard,
} from '@/services/api'
import type { LeaderboardPeriod } from '@/services/api'
import { fetchLuoguSyncData } from '@/services/luogu'
import { toSubmissionRecord } from '@/services/normalizers'
import { weeklyTrainingPlan } from '@/mock/trainingPlan'
import type {
  AiAdviceResponse,
  OjAccount,
  OjPlatform,
  AiProvider,
  DailyChallengeState,
  DailyProblem,
  LeaderboardEntry,
  SubmissionRecord,
  TrainingPlanStatus,
  TrainingTask,
  UserSettings,
  WeeklyTrainingPlanDay,
} from '@/types/algolink'
import { readStorage, writeStorage } from '@/utils/storage'
import { getProblemKey } from '@/utils/analysis'
import { getCodeforcesRankColor } from '@/utils/codeforcesRank'

const storageKeys = {
  currentUserId: 'algolink:currentUserId',
  currentUsername: 'algolink:currentUsername',
  sessionToken: 'algolink:sessionToken',
  sessionExpiresAt: 'algolink:sessionExpiresAt',
  accounts: 'algolink.accounts',
  settings: 'algolink.settings',
  tasks: 'algolink.trainingTasks',
  weeklyPlanDays: 'algolink.weeklyPlanDays',
  weeklyPlanStatus: 'algolink.weeklyPlanStatus',
  codeforcesSubmissions: 'algolink.codeforcesSubmissions',
  atcoderSubmissions: 'algolink.atcoderSubmissions',
  luoguSubmissions: 'algolink.luoguSubmissions',
  dailyChallenge: 'algolink.dailyChallenge',
  leaderboard: 'algolink.leaderboard',
  codeforcesAvatars: 'algolink.cfAvatars',
}

export const supportedPlatforms: OjPlatform[] = ['Codeforces', 'Luogu', 'AtCoder']

const platformColors: Record<OjPlatform, string> = {
  Codeforces: '#8cab9f',
  Luogu: '#8f9f79',
  AtCoder: '#c28a2e',
}

const autoSyncIntervalMs = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
} as const

const autoSyncCheckMs = 60 * 60 * 1000

const defaultLeaderboard: LeaderboardEntry[] = []
const supportedAiProviders: AiProvider[] = ['openai-compatible', 'deepseek']

function formatDateTime(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function parseSyncTime(value: string) {
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

function getCodeforcesRatingSnapshot(
  profile: { rating: number; maxRating: number },
  ratingChanges: { newRating: number }[],
) {
  const historyMaxRating = ratingChanges.reduce(
    (maxRating, change) => Math.max(maxRating, change.newRating),
    0,
  )

  return {
    rating: profile.rating,
    maxRating: Math.max(profile.maxRating, historyMaxRating, profile.rating),
  }
}

type StoredOjAccount = Partial<OjAccount> & { lastSync?: string }
type CodeforcesAvatarCacheEntry = {
  avatar: string
  rating: number
  rank?: string
  fetchedAt: string
}

type CodeforcesAvatarCache = Record<string, CodeforcesAvatarCacheEntry>

const avatarCacheTtlMs = 24 * 60 * 60 * 1000

function normalizeHandleKey(handle: string) {
  return handle.trim().toLowerCase()
}

function normalizeAccounts(value: StoredOjAccount[]): OjAccount[] {
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

function getUserCacheKey(userId: string, key: string) {
  return `algolink:${userId}:${key}`
}

function hasStorageValue(key: string) {
  return localStorage.getItem(key) !== null
}

function hasSubmissionCache(value: Record<OjPlatform, SubmissionRecord[]>) {
  return Object.values(value).some((items) => items.length > 0)
}

function normalizeAiProvider(value: unknown): AiProvider {
  return supportedAiProviders.includes(value as AiProvider)
    ? (value as AiProvider)
    : defaultSettings.aiProvider
}

interface TrainingPlanCache {
  trainingTasks: TrainingTask[]
  weeklyPlanItems: WeeklyTrainingPlanDay[]
  weeklyPlanStatus: Record<string, TrainingPlanStatus>
}

function normalizeSettings(value: unknown): UserSettings {
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

function getServerSafeSettings(value: UserSettings) {
  const { aiApiKey: _aiApiKey, ...settings } = value
  return settings
}

function isSessionActive(expiresAt: string) {
  return Boolean(expiresAt) && new Date(expiresAt).getTime() > Date.now()
}

function normalizeTrainingPlan(value: unknown): TrainingPlanCache {
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
        ? source.weeklyPlanStatus
        : {},
  }
}

function normalizeDailyChallenge(value: unknown): DailyChallengeState | null {
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

function normalizeLeaderboard(value: unknown): LeaderboardEntry[] {
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
            typeof entry.gapToPrevious === 'number' ? Math.max(0, Math.floor(entry.gapToPrevious)) : undefined,
          avatar: typeof entry.avatar === 'string' ? entry.avatar : undefined,
          displayRankColor:
            typeof entry.displayRankColor === 'string'
              ? entry.displayRankColor
              : getCodeforcesRankColor(Math.max(0, Math.floor(entry.score))),
        }))
    : []
}

function normalizeSubmissionCache(value: unknown): Record<OjPlatform, SubmissionRecord[]> {
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

export const useAlgoLinkStore = defineStore('algolink', () => {
  const storedSessionToken = readStorage<string>(storageKeys.sessionToken, '')
  const storedSessionExpiresAt = readStorage<string>(storageKeys.sessionExpiresAt, '')
  const hasActiveSession = storedSessionToken && isSessionActive(storedSessionExpiresAt)
  const sessionToken = ref(hasActiveSession ? storedSessionToken : '')
  const sessionExpiresAt = ref(hasActiveSession ? storedSessionExpiresAt : '')
  const currentUserId = ref(hasActiveSession ? readStorage<string>(storageKeys.currentUserId, '') : '')

  if (!hasActiveSession) {
    localStorage.removeItem(storageKeys.sessionToken)
    localStorage.removeItem(storageKeys.sessionExpiresAt)
    localStorage.removeItem(storageKeys.currentUserId)
  }

  setApiSession(sessionToken.value)

  const accounts = shallowRef<OjAccount[]>(
    normalizeAccounts(
      readStorage<StoredOjAccount[]>(
        currentUserId.value ? getUserCacheKey(currentUserId.value, 'accounts') : storageKeys.accounts,
        [],
      ),
    ),
  )
  const currentUsername = ref(
    readStorage<string>(storageKeys.currentUsername, '') || accounts.value[0]?.handle || 'AlgoLinkUser',
  )
  const settings = ref<UserSettings>(
    normalizeSettings(
      currentUserId.value
        ? readStorage<unknown>(getUserCacheKey(currentUserId.value, 'settings'), defaultSettings)
        : readStorage<UserSettings>(storageKeys.settings, defaultSettings),
    ),
  )
  const hasAiApiKey = ref(false)
  const initialTrainingPlan = currentUserId.value
    ? normalizeTrainingPlan(
        readStorage<unknown>(getUserCacheKey(currentUserId.value, 'trainingPlan'), {}),
      )
    : {
        trainingTasks: readStorage<TrainingTask[]>(storageKeys.tasks, mockTrainingTasks),
        weeklyPlanItems: readStorage<WeeklyTrainingPlanDay[]>(
          storageKeys.weeklyPlanDays,
          weeklyTrainingPlan,
        ),
        weeklyPlanStatus: readStorage<Record<string, TrainingPlanStatus>>(
          storageKeys.weeklyPlanStatus,
          {},
        ),
      }
  const trainingTasks = shallowRef<TrainingTask[]>(initialTrainingPlan.trainingTasks)
  const weeklyPlanItems = shallowRef<WeeklyTrainingPlanDay[]>(initialTrainingPlan.weeklyPlanItems)
  const weeklyPlanStatus = shallowRef<Record<string, TrainingPlanStatus>>(
    initialTrainingPlan.weeklyPlanStatus,
  )
  const initialSubmissionCache = currentUserId.value
    ? normalizeSubmissionCache(readStorage<unknown>(getUserCacheKey(currentUserId.value, 'submissions'), {}))
    : {
        Codeforces: readStorage<SubmissionRecord[]>(storageKeys.codeforcesSubmissions, []),
        Luogu: readStorage<SubmissionRecord[]>(storageKeys.luoguSubmissions, []),
        AtCoder: readStorage<SubmissionRecord[]>(storageKeys.atcoderSubmissions, []),
      }
  const codeforcesSubmissions = shallowRef<SubmissionRecord[]>(initialSubmissionCache.Codeforces)
  const atcoderSubmissions = shallowRef<SubmissionRecord[]>(initialSubmissionCache.AtCoder)
  const luoguSubmissions = shallowRef<SubmissionRecord[]>(initialSubmissionCache.Luogu)
  const dailyChallenge = ref<DailyChallengeState | null>(
    currentUserId.value
      ? normalizeDailyChallenge(
          readStorage<unknown>(getUserCacheKey(currentUserId.value, 'dailyChallenge'), null),
        )
      : readStorage<DailyChallengeState | null>(storageKeys.dailyChallenge, null),
  )
  const aiAdvice = ref<AiAdviceResponse | null>(
    currentUserId.value
      ? readStorage<AiAdviceResponse | null>(getUserCacheKey(currentUserId.value, 'aiAdvice'), null)
      : null,
  )
  const aiAdviceGeneratedAt = ref(
    currentUserId.value
      ? readStorage<string>(getUserCacheKey(currentUserId.value, 'aiAdviceGeneratedAt'), '')
      : '',
  )
  const leaderboardEntries = shallowRef<LeaderboardEntry[]>(
    readStorage<LeaderboardEntry[]>(storageKeys.leaderboard, defaultLeaderboard),
  )
  const codeforcesAvatarCache = shallowRef<CodeforcesAvatarCache>(
    readStorage<CodeforcesAvatarCache>(storageKeys.codeforcesAvatars, {}),
  )
  const leaderboardCurrentUser = ref<LeaderboardEntry | null>(null)
  const leaderboardPeriod = ref<LeaderboardPeriod>('all')
  const leaderboardTotal = ref(leaderboardEntries.value.length)
  const isLeaderboardLoading = ref(false)
  const serverSyncMessage = ref('')
  const autoSyncState = ref({
    running: false,
    lastRunAt: '',
    message: '',
  })
  let autoSyncTimer: ReturnType<typeof window.setInterval> | undefined

  function persistAccounts() {
    const key = currentUserId.value
      ? getUserCacheKey(currentUserId.value, 'accounts')
      : storageKeys.accounts
    writeStorage(key, accounts.value)
  }

  function pushAccountsToServer() {
    if (!currentUserId.value) {
      return
    }

    saveAccounts(currentUserId.value, accounts.value)
      .then(() => {
        serverSyncMessage.value = ''
      })
      .catch(() => {
        serverSyncMessage.value = 'Server sync failed. Local cache is kept.'
      })
  }

  function getSubmissionCache() {
    return {
      Codeforces: codeforcesSubmissions.value,
      Luogu: luoguSubmissions.value,
      AtCoder: atcoderSubmissions.value,
    }
  }

  function persistSubmissions() {
    if (currentUserId.value) {
      writeStorage(getUserCacheKey(currentUserId.value, 'submissions'), getSubmissionCache())
      return
    }

    writeStorage(storageKeys.codeforcesSubmissions, codeforcesSubmissions.value)
    writeStorage(storageKeys.atcoderSubmissions, atcoderSubmissions.value)
    writeStorage(storageKeys.luoguSubmissions, luoguSubmissions.value)
  }

  function pushSubmissionsToServer() {
    if (!currentUserId.value) {
      return
    }

    saveSubmissions(currentUserId.value, getSubmissionCache())
      .then(() => {
        serverSyncMessage.value = ''
      })
      .catch(() => {
        serverSyncMessage.value = 'Server sync failed. Local cache is kept.'
      })
  }

  function getTrainingPlanCache(): TrainingPlanCache {
    return {
      trainingTasks: trainingTasks.value,
      weeklyPlanItems: weeklyPlanItems.value,
      weeklyPlanStatus: weeklyPlanStatus.value,
    }
  }

  function persistSettings() {
    const key = currentUserId.value
      ? getUserCacheKey(currentUserId.value, 'settings')
      : storageKeys.settings
    writeStorage(key, settings.value)
  }

  function pushSettingsToServer() {
    if (!currentUserId.value) {
      return
    }

    saveSettings(currentUserId.value, getServerSafeSettings(settings.value))
      .then((response) => {
        hasAiApiKey.value = response.hasAiApiKey
        serverSyncMessage.value = ''
      })
      .catch(() => {
        serverSyncMessage.value = 'Server sync failed. Local cache is kept.'
      })
  }

  function persistTrainingPlan() {
    if (currentUserId.value) {
      writeStorage(getUserCacheKey(currentUserId.value, 'trainingPlan'), getTrainingPlanCache())
      return
    }

    writeStorage(storageKeys.tasks, trainingTasks.value)
    writeStorage(storageKeys.weeklyPlanDays, weeklyPlanItems.value)
    writeStorage(storageKeys.weeklyPlanStatus, weeklyPlanStatus.value)
  }

  function pushTrainingPlanToServer() {
    if (!currentUserId.value) {
      return
    }

    saveTrainingPlan(currentUserId.value, getTrainingPlanCache())
      .then(() => {
        serverSyncMessage.value = ''
      })
      .catch(() => {
        serverSyncMessage.value = 'Server sync failed. Local cache is kept.'
      })
  }

  function persistDailyChallenge() {
    const key = currentUserId.value
      ? getUserCacheKey(currentUserId.value, 'dailyChallenge')
      : storageKeys.dailyChallenge
    writeStorage(key, dailyChallenge.value)
  }

  function persistAiAdvice() {
    const userId = currentUserId.value
    if (!userId) {
      return
    }
    writeStorage(getUserCacheKey(userId, 'aiAdvice'), aiAdvice.value)
    writeStorage(getUserCacheKey(userId, 'aiAdviceGeneratedAt'), aiAdviceGeneratedAt.value)
  }

  async function saveAiAdviceToServer() {
    if (!currentUserId.value) {
      persistAiAdvice()
      return
    }

    try {
      await saveSavedAiAdvice(currentUserId.value, {
        advice: aiAdvice.value,
        generatedAt: aiAdviceGeneratedAt.value,
      })
      persistAiAdvice()
      serverSyncMessage.value = ''
    } catch {
      persistAiAdvice()
      serverSyncMessage.value = 'Server sync failed. Local cache is kept.'
    }
  }

  function pushDailyChallengeToServer() {
    if (!currentUserId.value) {
      return
    }

    saveDailyChallenge(currentUserId.value, dailyChallenge.value)
      .then(() => {
        serverSyncMessage.value = ''
      })
      .catch(() => {
        serverSyncMessage.value = 'Server sync failed. Local cache is kept.'
      })
  }

  function persistLeaderboard() {
    writeStorage(storageKeys.leaderboard, leaderboardEntries.value)
  }

  function persistCodeforcesAvatarCache() {
    writeStorage(storageKeys.codeforcesAvatars, codeforcesAvatarCache.value)
  }

  function getCachedCodeforcesAvatar(handle: string) {
    return codeforcesAvatarCache.value[normalizeHandleKey(handle)]
  }

  function withCodeforcesProfile(entry: LeaderboardEntry): LeaderboardEntry {
    const cached = getCachedCodeforcesAvatar(entry.username)

    return {
      ...entry,
      avatar: entry.avatar || cached?.avatar,
      displayRankColor: getCodeforcesRankColor(entry.score),
    }
  }

  async function hydrateLeaderboardAvatars(handles: string[]) {
    const now = Date.now()
    const missingHandles = [
      ...new Set(
        handles
          .map((handle) => handle.trim())
          .filter((handle) => {
            const cached = getCachedCodeforcesAvatar(handle)
            return (
              handle.length > 0 &&
              (!cached || now - new Date(cached.fetchedAt).getTime() > avatarCacheTtlMs)
            )
          }),
      ),
    ]

    if (!missingHandles.length) {
      leaderboardEntries.value = leaderboardEntries.value.map(withCodeforcesProfile)
      leaderboardCurrentUser.value = leaderboardCurrentUser.value
        ? withCodeforcesProfile(leaderboardCurrentUser.value)
        : null
      persistLeaderboard()
      return
    }

    try {
      const profiles = await fetchCodeforcesUsers(missingHandles)
      const nextCache = { ...codeforcesAvatarCache.value }

      for (const profile of profiles) {
        nextCache[normalizeHandleKey(profile.handle)] = {
          avatar: profile.avatar || '',
          rating: profile.rating,
          rank: profile.rank,
          fetchedAt: new Date().toISOString(),
        }
      }

      codeforcesAvatarCache.value = nextCache
      persistCodeforcesAvatarCache()
      leaderboardEntries.value = leaderboardEntries.value.map(withCodeforcesProfile)
      leaderboardCurrentUser.value = leaderboardCurrentUser.value
        ? withCodeforcesProfile(leaderboardCurrentUser.value)
        : null
      persistLeaderboard()
    } catch {
      leaderboardEntries.value = leaderboardEntries.value.map(withCodeforcesProfile)
      leaderboardCurrentUser.value = leaderboardCurrentUser.value
        ? withCodeforcesProfile(leaderboardCurrentUser.value)
        : null
    }
  }

  async function syncLeaderboardFromServer(period: LeaderboardPeriod = leaderboardPeriod.value) {
    isLeaderboardLoading.value = true
    try {
      const response = await getLeaderboard({
        period,
        username: currentUserId.value ? currentUsername.value : undefined,
        limit: 100,
      })
      const serverItems = normalizeLeaderboard(response.items)
      const currentUser = normalizeLeaderboard(response.currentUser ? [response.currentUser] : [])[0] ?? null

      leaderboardEntries.value = serverItems
      persistLeaderboard()
      leaderboardCurrentUser.value = currentUser
      leaderboardPeriod.value = response.period
      leaderboardTotal.value = response.total
      void hydrateLeaderboardAvatars([
        ...serverItems.map((entry) => entry.username),
        currentUser?.username ?? '',
      ])
      serverSyncMessage.value = ''
    } catch {
      void hydrateLeaderboardAvatars(leaderboardEntries.value.map((entry) => entry.username))
      serverSyncMessage.value = 'Server unavailable. Showing local cache.'
    } finally {
      isLeaderboardLoading.value = false
    }
  }

  function pushLeaderboardScore(username: string, score: number, eventId: string, date: string) {
    if (!currentUserId.value || username !== currentUsername.value) {
      return
    }

    submitLeaderboard({
      username,
      score,
      eventId,
      source: 'daily-challenge',
      date,
    })
      .then(() => {
        serverSyncMessage.value = ''
        void syncLeaderboardFromServer(leaderboardPeriod.value)
      })
      .catch(() => {
        serverSyncMessage.value = 'Server sync failed. Local cache is kept.'
      })
  }

  function clearLoginSession(redirectToLogin = false) {
    currentUserId.value = ''
    currentUsername.value = ''
    sessionToken.value = ''
    sessionExpiresAt.value = ''
    hasAiApiKey.value = false
    settings.value = {
      ...settings.value,
      aiApiKey: '',
    }
    setApiSession('')
    localStorage.removeItem(storageKeys.currentUserId)
    localStorage.removeItem(storageKeys.currentUsername)
    localStorage.removeItem(storageKeys.sessionToken)
    localStorage.removeItem(storageKeys.sessionExpiresAt)
    serverSyncMessage.value = 'Session expired. Please log in again.'

    if (redirectToLogin && window.location.pathname !== '/login') {
      const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`
      window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`)
    }
  }

  async function logout() {
    try {
      await logoutUser()
    } catch {
      // Even if the server call fails, clear local session
    }
    clearLoginSession(true)
  }

  setApiUnauthorizedHandler(() => {
    clearLoginSession(true)
  })

  function applyLocalUserCache(userId: string) {
    accounts.value = normalizeAccounts(
      readStorage<StoredOjAccount[]>(getUserCacheKey(userId, 'accounts'), []),
    )

    const cachedSubmissions = normalizeSubmissionCache(
      readStorage<unknown>(getUserCacheKey(userId, 'submissions'), {}),
    )
    codeforcesSubmissions.value = cachedSubmissions.Codeforces
    atcoderSubmissions.value = cachedSubmissions.AtCoder
    luoguSubmissions.value = cachedSubmissions.Luogu

    settings.value = normalizeSettings(
      readStorage<unknown>(getUserCacheKey(userId, 'settings'), defaultSettings),
    )

    const cachedTrainingPlan = normalizeTrainingPlan(
      readStorage<unknown>(getUserCacheKey(userId, 'trainingPlan'), {}),
    )
    trainingTasks.value = cachedTrainingPlan.trainingTasks
    weeklyPlanItems.value = cachedTrainingPlan.weeklyPlanItems
    weeklyPlanStatus.value = cachedTrainingPlan.weeklyPlanStatus

    dailyChallenge.value = normalizeDailyChallenge(
      readStorage<unknown>(getUserCacheKey(userId, 'dailyChallenge'), null),
    )
    aiAdvice.value = readStorage<AiAdviceResponse | null>(
      getUserCacheKey(userId, 'aiAdvice'),
      null,
    )
    aiAdviceGeneratedAt.value = readStorage<string>(
      getUserCacheKey(userId, 'aiAdviceGeneratedAt'),
      '',
    )
  }

  const syncedSubmissions = computed(() => [
    ...codeforcesSubmissions.value,
    ...atcoderSubmissions.value,
    ...luoguSubmissions.value,
  ])
  const hasSyncedSubmissions = computed(() => syncedSubmissions.value.length > 0)
  const analysisSubmissions = computed(() =>
    hasSyncedSubmissions.value ? syncedSubmissions.value : submissions.value,
  )
  const submissionDataSourceLabel = computed(() => {
    const platforms = [
      codeforcesSubmissions.value.length ? 'Codeforces' : '',
      atcoderSubmissions.value.length ? 'AtCoder' : '',
      luoguSubmissions.value.length ? 'Luogu' : '',
    ].filter(Boolean)

    return platforms.length ? `真实 ${platforms.join(' + ')} 数据` : 'mock 兜底数据'
  })
  const submissions = computed(() => {
    if (!hasSyncedSubmissions.value) {
      return mockSubmissions
    }

    return [
      ...codeforcesSubmissions.value,
      ...atcoderSubmissions.value,
      ...luoguSubmissions.value,
      ...mockSubmissions.filter((item) => {
        if (item.platform === 'Codeforces') {
          return !codeforcesSubmissions.value.length
        }

        if (item.platform === 'AtCoder') {
          return !atcoderSubmissions.value.length
        }

        if (item.platform === 'Luogu') {
          return !luoguSubmissions.value.length
        }

        return true
      }),
    ]
  })

  const activePlanCount = computed(
    () => trainingTasks.value.filter((item) => item.status !== 'done').length,
  )
  const leaderboard = computed(() => {
    const board = new Map<string, LeaderboardEntry>()

    for (const entry of leaderboardEntries.value) {
      const cached = getCachedCodeforcesAvatar(entry.username)
      const existing = board.get(entry.username)
      const score = Math.max(existing?.score ?? 0, entry.score)
      board.set(entry.username, {
        ...existing,
        ...entry,
        score,
        avatar: entry.avatar || cached?.avatar || existing?.avatar,
        displayRankColor: getCodeforcesRankColor(score),
      })
    }

    if (leaderboardCurrentUser.value?.username) {
      const cached = getCachedCodeforcesAvatar(leaderboardCurrentUser.value.username)
      const existing = board.get(leaderboardCurrentUser.value.username)
      const score = Math.max(existing?.score ?? 0, leaderboardCurrentUser.value.score)
      board.set(leaderboardCurrentUser.value.username, {
        ...existing,
        ...leaderboardCurrentUser.value,
        score,
        avatar: leaderboardCurrentUser.value.avatar || cached?.avatar || existing?.avatar,
        displayRankColor: getCodeforcesRankColor(score),
      })
    }

    if (currentUserId.value && currentUsername.value && !board.has(currentUsername.value)) {
      const cached = getCachedCodeforcesAvatar(currentUsername.value)
      board.set(currentUsername.value, {
        username: currentUsername.value,
        score: 0,
        avatar: cached?.avatar,
        isCurrentUser: true,
        displayRankColor: getCodeforcesRankColor(0),
      })
    }

    return [...board.values()]
      .sort((left, right) => right.score - left.score || left.username.localeCompare(right.username))
  })
  const currentLeaderboardUser = computed(() => {
    if (!currentUserId.value || !currentUsername.value) {
      return null
    }

    const current = leaderboard.value.find((entry) => entry.username === currentUsername.value)
    if (!current) {
      return null
    }

    const serverCurrent =
      leaderboardCurrentUser.value?.username === currentUsername.value ? leaderboardCurrentUser.value : null
    const localRank = leaderboard.value.findIndex((entry) => entry.username === current.username) + 1
    const rank = serverCurrent?.rank ?? localRank
    const previous = leaderboard.value[localRank - 2]

    return {
      ...current,
      rank,
      gapToPrevious:
        serverCurrent?.gapToPrevious ?? (previous ? Math.max(previous.score - current.score, 0) : 0),
    }
  })
  const codeforcesAccount = computed(() =>
    accounts.value.find((account) => account.platform === 'Codeforces'),
  )
  const currentUserAvatar = computed(
    () =>
      codeforcesAccount.value?.avatar ||
      getCachedCodeforcesAvatar(currentUsername.value)?.avatar ||
      currentLeaderboardUser.value?.avatar ||
      '',
  )
  const platformSyncCards = computed(() =>
    supportedPlatforms.map((platform) => {
      const account = accounts.value.find((item) => item.platform === platform)
      return {
        platform,
        account,
        status: account ? '已绑定' : '未绑定',
        lastSyncAt: account?.lastSyncAt || '暂无同步',
        coverage: account ? 100 : 0,
      }
    }),
  )
  const weeklyPlanDays = computed(() =>
    weeklyPlanItems.value.map((day) => ({
      ...day,
      status: weeklyPlanStatus.value[day.id] ?? 'not-started',
    })),
  )
  const weeklyPlanCompletion = computed(() => {
    const done = weeklyPlanDays.value.filter((day) => day.status === 'done').length
    return Math.round((done / Math.max(weeklyPlanDays.value.length, 1)) * 100)
  })

  async function initServerSync(allowLegacyMigration = false) {
    if (!currentUserId.value) {
      return
    }

    const userId = currentUserId.value
    const userAccountsKey = getUserCacheKey(userId, 'accounts')
    const hasUserAccountsCache = hasStorageValue(userAccountsKey)
    let serverData: Awaited<ReturnType<typeof getUserData>>

    try {
      serverData = await getUserData(userId)
    } catch {
      serverSyncMessage.value = 'Server unavailable. Showing local cache.'
      return
    }
    serverSyncMessage.value = ''

    const serverAccounts = normalizeAccounts(serverData.accounts as StoredOjAccount[])

    if (serverAccounts.length > 0) {
      accounts.value = serverAccounts
      persistAccounts()
    } else if (allowLegacyMigration && !hasUserAccountsCache) {
      const legacyAccounts = normalizeAccounts(
        readStorage<StoredOjAccount[]>(storageKeys.accounts, []),
      )

      if (legacyAccounts.length > 0) {
        accounts.value = legacyAccounts
        persistAccounts()
        await saveAccounts(userId, accounts.value)
      } else {
        accounts.value = []
        persistAccounts()
      }
    } else {
      accounts.value = []
      persistAccounts()
    }

    const serverSubmissions = normalizeSubmissionCache(serverData.submissions)
    const userSubmissionsKey = getUserCacheKey(userId, 'submissions')
    const hasUserSubmissionsCache = hasStorageValue(userSubmissionsKey)
    const nextSubmissions =
      hasSubmissionCache(serverSubmissions) || !allowLegacyMigration || hasUserSubmissionsCache
        ? serverSubmissions
        : normalizeSubmissionCache({
            Codeforces: readStorage<SubmissionRecord[]>(storageKeys.codeforcesSubmissions, []),
            Luogu: readStorage<SubmissionRecord[]>(storageKeys.luoguSubmissions, []),
            AtCoder: readStorage<SubmissionRecord[]>(storageKeys.atcoderSubmissions, []),
          })
    codeforcesSubmissions.value = nextSubmissions.Codeforces
    atcoderSubmissions.value = nextSubmissions.AtCoder
    luoguSubmissions.value = nextSubmissions.Luogu
    persistSubmissions()
    if (!hasSubmissionCache(serverSubmissions) && hasSubmissionCache(nextSubmissions)) {
      await saveSubmissions(userId, getSubmissionCache())
    }

    const userSettingsKey = getUserCacheKey(userId, 'settings')
    const hasUserSettingsCache = hasStorageValue(userSettingsKey)
    const localSettings = normalizeSettings(
      allowLegacyMigration && !hasUserSettingsCache
        ? readStorage<UserSettings>(storageKeys.settings, defaultSettings)
        : readStorage<unknown>(userSettingsKey, defaultSettings),
    )
    const legacyAiApiKey = localSettings.aiApiKey.trim()
    hasAiApiKey.value = Boolean(serverData.hasAiApiKey)
    settings.value = {
      ...(serverData.settings ? normalizeSettings(serverData.settings) : localSettings),
      aiApiKey: serverData.hasAiApiKey ? '' : localSettings.aiApiKey,
    }
    if (!serverData.settings && allowLegacyMigration && !hasUserSettingsCache) {
      try {
        await saveSettings(userId, getServerSafeSettings(settings.value))
      } catch {
        serverSyncMessage.value = 'Server sync failed. Local cache is kept.'
      }
    }
    if (legacyAiApiKey) {
      try {
        const response = await saveSavedAiApiKey(userId, legacyAiApiKey)
        hasAiApiKey.value = response.hasAiApiKey

        if (response.hasAiApiKey) {
          settings.value = {
            ...settings.value,
            aiApiKey: '',
          }
        }
      } catch {
        settings.value = {
          ...settings.value,
          aiApiKey: legacyAiApiKey,
        }
        serverSyncMessage.value = 'Server sync failed. Local API key is kept.'
      }
    } else {
      settings.value = {
        ...settings.value,
        aiApiKey: '',
      }
    }
    persistSettings()

    const userTrainingPlanKey = getUserCacheKey(userId, 'trainingPlan')
    const hasUserTrainingPlanCache = hasStorageValue(userTrainingPlanKey)
    const nextTrainingPlan = serverData.trainingPlan
      ? normalizeTrainingPlan(serverData.trainingPlan)
      : normalizeTrainingPlan(
          allowLegacyMigration && !hasUserTrainingPlanCache
            ? {
                trainingTasks: readStorage<TrainingTask[]>(storageKeys.tasks, mockTrainingTasks),
                weeklyPlanItems: readStorage<WeeklyTrainingPlanDay[]>(
                  storageKeys.weeklyPlanDays,
                  weeklyTrainingPlan,
                ),
                weeklyPlanStatus: readStorage<Record<string, TrainingPlanStatus>>(
                  storageKeys.weeklyPlanStatus,
                  {},
                ),
              }
            : readStorage<unknown>(userTrainingPlanKey, {}),
        )
    trainingTasks.value = nextTrainingPlan.trainingTasks
    weeklyPlanItems.value = nextTrainingPlan.weeklyPlanItems
    weeklyPlanStatus.value = nextTrainingPlan.weeklyPlanStatus
    persistTrainingPlan()
    if (!serverData.trainingPlan && allowLegacyMigration && !hasUserTrainingPlanCache) {
      await saveTrainingPlan(userId, getTrainingPlanCache())
    }

    const userDailyChallengeKey = getUserCacheKey(userId, 'dailyChallenge')
    const hasUserDailyChallengeCache = hasStorageValue(userDailyChallengeKey)
    dailyChallenge.value = serverData.dailyChallenge
      ? normalizeDailyChallenge(serverData.dailyChallenge)
      : normalizeDailyChallenge(
          allowLegacyMigration && !hasUserDailyChallengeCache
            ? readStorage<DailyChallengeState | null>(storageKeys.dailyChallenge, null)
            : readStorage<unknown>(userDailyChallengeKey, null),
        )
    persistDailyChallenge()
    if (
      !serverData.dailyChallenge &&
      allowLegacyMigration &&
      !hasUserDailyChallengeCache &&
      dailyChallenge.value
    ) {
      await saveDailyChallenge(userId, dailyChallenge.value)
    }

    const userAiAdviceKey = getUserCacheKey(userId, 'aiAdvice')
    const hasUserAiAdviceCache = hasStorageValue(userAiAdviceKey)
    if (serverData.aiAdvice) {
      aiAdvice.value = serverData.aiAdvice as AiAdviceResponse | null
      aiAdviceGeneratedAt.value = serverData.aiAdviceGeneratedAt ?? ''
    } else if (hasUserAiAdviceCache) {
      aiAdvice.value = readStorage<AiAdviceResponse | null>(userAiAdviceKey, null)
      aiAdviceGeneratedAt.value = readStorage<string>(
        getUserCacheKey(userId, 'aiAdviceGeneratedAt'),
        '',
      )
    } else {
      aiAdvice.value = null
      aiAdviceGeneratedAt.value = ''
    }
    persistAiAdvice()
  }

  async function loginSimpleUser(
    username: string,
    password: string,
  ): Promise<{ ok: boolean; message: string }> {
    const trimmedUsername = username.trim()

    if (password.length < 6 || password.length > 64) {
      return { ok: false, message: '密码长度必须为 6-64 位' }
    }

    if (!trimmedUsername) {
      return { ok: false, message: '请输入用户名' }
    }

    try {
      const previousUserId = currentUserId.value
      const user = await loginUser(trimmedUsername, password)
      currentUserId.value = user.userId
      currentUsername.value = user.username
      sessionToken.value = user.sessionToken
      sessionExpiresAt.value = user.sessionExpiresAt
      setApiSession(user.sessionToken)
      writeStorage(storageKeys.currentUserId, currentUserId.value)
      writeStorage(storageKeys.currentUsername, currentUsername.value)
      writeStorage(storageKeys.sessionToken, sessionToken.value)
      writeStorage(storageKeys.sessionExpiresAt, sessionExpiresAt.value)
      applyLocalUserCache(user.userId)
      await initServerSync(!previousUserId)
      await syncLeaderboardFromServer(leaderboardPeriod.value)

      return { ok: true, message: `已切换到用户 ${user.username}` }
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败'
      return { ok: false, message }
    }
  }

  async function bindAccount(
    platform: OjPlatform | '',
    handle: string,
  ): Promise<{ ok: boolean; message: string }> {
    const trimmedHandle = handle.trim()

    if (!platform) {
      return { ok: false, message: '请选择平台' }
    }

    if (!trimmedHandle) {
      return { ok: false, message: '请输入公开用户名 / handle' }
    }

    if (accounts.value.some((item) => item.platform === platform)) {
      return { ok: false, message: `${platform} 已绑定账号，不能重复绑定同一平台` }
    }

    if (platform === 'Codeforces') {
      try {
        const verified = await hasRecentCodeforcesBindingCe(trimmedHandle)

        if (!verified) {
          return {
            ok: false,
            message: '未检测到 10 分钟内在 Codeforces 1A 的 CE 提交，请提交后再绑定。',
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Codeforces 公开提交读取失败'
        return { ok: false, message: `Codeforces 绑定验证失败：${message}` }
      }
    }

    return addAccount(platform, trimmedHandle)
  }

  function addAccount(platform: OjPlatform | '', handle: string): { ok: boolean; message: string } {
    const trimmedHandle = handle.trim()

    if (!platform) {
      return { ok: false, message: '请选择平台' }
    }

    if (!trimmedHandle) {
      return { ok: false, message: '请输入公开用户名 / handle' }
    }

    if (accounts.value.some((item) => item.platform === platform)) {
      return { ok: false, message: `${platform} 已绑定账号，不能重复绑定同一平台` }
    }

    const nextAccount: OjAccount = {
      id: `${platform.toLowerCase()}-${Date.now()}`,
      platform,
      handle: trimmedHandle,
      status: 'bound',
      rating: 0,
      maxRating: 0,
      solved: 0,
      lastSyncAt: '等待同步',
      color: platformColors[platform],
    }

    accounts.value = [nextAccount, ...accounts.value]
    persistAccounts()
    pushAccountsToServer()
    return { ok: true, message: `${platform} 账号绑定成功` }
  }

  function removeAccount(id: string) {
    const removedAccount = accounts.value.find((item) => item.id === id)
    accounts.value = accounts.value.filter((item) => item.id !== id)

    if (
      removedAccount?.platform === 'Codeforces' ||
      removedAccount?.platform === 'AtCoder' ||
      removedAccount?.platform === 'Luogu'
    ) {
      clearSyncedSubmissions(removedAccount.platform)
    }

    persistAccounts()
    pushAccountsToServer()
  }

  function clearSyncedSubmissions(platform: OjPlatform) {
    if (platform === 'Codeforces') {
      codeforcesSubmissions.value = []
      persistSubmissions()
      pushSubmissionsToServer()
      return
    }

    if (platform === 'AtCoder') {
      atcoderSubmissions.value = []
      persistSubmissions()
      pushSubmissionsToServer()
      return
    }

    luoguSubmissions.value = []
    persistSubmissions()
    pushSubmissionsToServer()
  }

  function syncAccount(id: string) {
    accounts.value = accounts.value.map((item) =>
      item.id === id ? { ...item, lastSyncAt: formatDateTime() } : item,
    )
    persistAccounts()
    pushAccountsToServer()
  }

  async function syncCodeforcesAccount(id: string): Promise<{ ok: boolean; message: string }> {
    const account = accounts.value.find((item) => item.id === id)

    if (!account) {
      return { ok: false, message: '未找到要同步的账号。' }
    }

    if (account.platform !== 'Codeforces') {
      syncAccount(id)
      return { ok: true, message: `${account.platform} mock 数据已刷新。` }
    }

    try {
      const [profile, ratingChanges, syncedSubmissions] = await Promise.all([
        fetchCodeforcesUser(account.handle),
        fetchCodeforcesRating(account.handle),
        fetchCodeforcesSubmissions(account.handle),
      ])
      const records = syncedSubmissions.map(toSubmissionRecord)
      const ratingSnapshot = getCodeforcesRatingSnapshot(profile, ratingChanges)
      const acceptedProblems = new Set(
        records.filter((item) => item.status === 'Accepted').map(getProblemKey),
      )

      codeforcesSubmissions.value = records
      codeforcesAvatarCache.value = {
        ...codeforcesAvatarCache.value,
        [normalizeHandleKey(profile.handle)]: {
          avatar: profile.avatar || '',
          rating: ratingSnapshot.rating,
          rank: profile.rank,
          fetchedAt: new Date().toISOString(),
        },
      }
      persistCodeforcesAvatarCache()
      accounts.value = accounts.value.map((item) =>
        item.id === id
          ? {
              ...item,
              handle: profile.handle,
              rating: ratingSnapshot.rating,
              maxRating: ratingSnapshot.maxRating,
              rank: profile.rank,
              maxRank: profile.maxRank,
              avatar: profile.avatar,
              registeredAt: profile.registeredAt,
              lastOnlineAt: profile.lastOnlineAt,
              solved: acceptedProblems.size,
              lastSyncAt: formatDateTime(),
            }
          : item,
      )
      persistSubmissions()
      pushSubmissionsToServer()
      persistAccounts()
      pushAccountsToServer()

      return {
        ok: true,
        message: `Codeforces 同步成功，已保存最近 ${records.length} 条提交。`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Codeforces API 请求失败'
      return { ok: false, message: `Codeforces 同步失败：${message}` }
    }
  }

  async function syncAtCoderAccount(id: string): Promise<{ ok: boolean; message: string }> {
    const account = accounts.value.find((item) => item.id === id)

    if (!account) {
      return { ok: false, message: '未找到要同步的账号。' }
    }

    if (account.platform !== 'AtCoder') {
      syncAccount(id)
      return { ok: true, message: `${account.platform} mock 数据已刷新。` }
    }

    try {
      const [profile, syncedSubmissions] = await Promise.all([
        fetchAtCoderUser(account.handle),
        fetchAtCoderSubmissions(account.handle),
      ])
      const records = syncedSubmissions.map(toSubmissionRecord)
      const acceptedProblems = new Set(
        records.filter((item) => item.status === 'Accepted').map(getProblemKey),
      )

      atcoderSubmissions.value = records
      accounts.value = accounts.value.map((item) =>
        item.id === id
          ? {
              ...item,
              handle: profile.handle,
              rating: profile.rating,
              maxRating: profile.maxRating,
              solved: acceptedProblems.size,
              lastSyncAt: formatDateTime(),
            }
          : item,
      )
      persistSubmissions()
      pushSubmissionsToServer()
      persistAccounts()
      pushAccountsToServer()

      return {
        ok: true,
        message: `AtCoder 同步成功，已保存 ${records.length} 条公开提交。`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AtCoder Problems API 请求失败'
      return { ok: false, message: `AtCoder 同步失败：${message}` }
    }
  }

  async function syncLuoguAccount(id: string): Promise<{ ok: boolean; message: string }> {
    const account = accounts.value.find((item) => item.id === id)

    if (!account) {
      return { ok: false, message: '未找到要同步的账号。' }
    }

    if (account.platform !== 'Luogu') {
      syncAccount(id)
      return { ok: true, message: `${account.platform} mock 数据已刷新。` }
    }

    try {
      const { profile, submissions: syncedSubmissions, tagWarning } = await fetchLuoguSyncData(
        account.handle,
      )
      const records = syncedSubmissions.map(toSubmissionRecord)
      const acceptedProblems = new Set(
        records.filter((item) => item.status === 'Accepted').map(getProblemKey),
      )

      luoguSubmissions.value = records
      accounts.value = accounts.value.map((item) =>
        item.id === id
          ? {
              ...item,
              handle: profile.handle,
              rating: profile.rating,
              maxRating: profile.maxRating,
              solved: acceptedProblems.size,
              lastSyncAt: formatDateTime(),
            }
          : item,
      )
      persistSubmissions()
      pushSubmissionsToServer()
      persistAccounts()
      pushAccountsToServer()

      const tagMessage = tagWarning ? '部分题目标签因网络波动已跳过。' : '题目标签已尽量补全。'

      return {
        ok: true,
        message: `洛谷公开练习数据同步成功，已保存 ${records.length} 条题目记录。${tagMessage}`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '洛谷公开接口请求失败'
      return { ok: false, message: `洛谷同步失败：${message}` }
    }
  }

  async function syncOjAccount(id: string): Promise<{ ok: boolean; message: string }> {
    const account = accounts.value.find((item) => item.id === id)

    if (!account) {
      return { ok: false, message: '未找到要同步的账号。' }
    }

    if (account.platform === 'Codeforces') {
      return syncCodeforcesAccount(id)
    }

    if (account.platform === 'AtCoder') {
      return syncAtCoderAccount(id)
    }

    if (account.platform === 'Luogu') {
      return syncLuoguAccount(id)
    }

    return { ok: false, message: `${account.platform} 暂不支持同步。` }
  }

  function shouldAutoSyncAccount(account: OjAccount) {
    if (settings.value.syncInterval === 'manual') {
      return false
    }

    const interval = autoSyncIntervalMs[settings.value.syncInterval]
    const lastSyncedAt = parseSyncTime(account.lastSyncAt)

    return !lastSyncedAt || Date.now() - lastSyncedAt.getTime() >= interval
  }

  async function syncDueAccounts() {
    if (settings.value.syncInterval === 'manual' || autoSyncState.value.running) {
      return
    }

    const dueAccounts = accounts.value.filter(shouldAutoSyncAccount)

    if (!dueAccounts.length) {
      return
    }

    autoSyncState.value = {
      running: true,
      lastRunAt: formatDateTime(),
      message: `Auto syncing ${dueAccounts.length} account(s)`,
    }

    const results = await Promise.allSettled(
      dueAccounts.map((account) => syncOjAccount(account.id)),
    )
    const failedCount = results.filter(
      (item) => item.status === 'rejected' || (item.status === 'fulfilled' && !item.value.ok),
    ).length

    autoSyncState.value = {
      running: false,
      lastRunAt: formatDateTime(),
      message: failedCount
        ? `Auto sync finished with ${failedCount} failed account(s)`
        : `Auto synced ${dueAccounts.length} account(s)`,
    }
  }

  function restartAutoSyncScheduler() {
    if (typeof window === 'undefined') {
      return
    }

    window.clearInterval(autoSyncTimer)
    autoSyncTimer = undefined

    if (settings.value.syncInterval === 'manual') {
      autoSyncState.value = {
        ...autoSyncState.value,
        running: false,
        message: 'Auto sync disabled',
      }
      return
    }

    window.setTimeout(syncDueAccounts, 0)
    autoSyncTimer = window.setInterval(syncDueAccounts, autoSyncCheckMs)
  }

  async function loadDailyChallenge(): Promise<{ ok: boolean; message: string }> {
    const today = formatDateKey()

    if (dailyChallenge.value?.date === today && dailyChallenge.value.problems.length === 3) {
      return { ok: true, message: '今日题目已加载。' }
    }

    try {
      const problems = await fetchDailyProblems(today)

      dailyChallenge.value = {
        date: today,
        problems,
        completedProblemIds: [],
        awardedScore: 0,
      }
      persistDailyChallenge()
      pushDailyChallengeToServer()

      return { ok: true, message: '每日一题已刷新。' }
    } catch (error) {
      const message = error instanceof Error ? error.message : '每日一题题库请求失败'
      return { ok: false, message }
    }
  }

  function completeDailyProblem(problemId: string) {
    if (!dailyChallenge.value) {
      return { ok: false, message: '请先加载每日一题。' }
    }

    if (!dailyChallenge.value.completedProblemIds.includes(problemId)) {
      dailyChallenge.value.completedProblemIds = [
        ...dailyChallenge.value.completedProblemIds,
        problemId,
      ]
    }

    const completedProblems = dailyChallenge.value.problems.filter((problem) =>
      dailyChallenge.value?.completedProblemIds.includes(problem.id),
    )
    const nextAwardedScore = Math.max(0, ...completedProblems.map((problem) => problem.difficulty))
    const delta = nextAwardedScore - dailyChallenge.value.awardedScore

    dailyChallenge.value.awardedScore = nextAwardedScore
    persistDailyChallenge()
    pushDailyChallengeToServer()

    if (delta > 0) {
      addLeaderboardScore(
        currentUsername.value,
        delta,
        `daily:${currentUsername.value}:${dailyChallenge.value.date}:${problemId}`,
        dailyChallenge.value.date,
      )
    }

    return { ok: true, message: `每日一题已完成，本日计分 ${nextAwardedScore}。` }
  }

  function hasAcceptedDailyProblem(problem: DailyProblem) {
    const expectedId = problem.id.startsWith('cf-')
      ? problem.id.replace(/^cf-/, '')
      : problem.id

    return syncedSubmissions.value.some((submission) => {
      if (submission.platform !== problem.platform || submission.status !== 'Accepted') {
        return false
      }

      return (
        submission.problemId === expectedId ||
        submission.problemId === problem.id ||
        submission.problem.includes(problem.title) ||
        problem.title.includes(submission.problemId ?? '')
      )
    })
  }

  async function verifyAndCompleteDailyProblem(problem: DailyProblem) {
    const account = accounts.value.find((item) => item.platform === problem.platform)

    if (!account) {
      return {
        ok: false,
        message: `请先绑定并同步 ${problem.platform} 账号，再验证每日一题完成状态。`,
      }
    }

    const syncResult = await syncOjAccount(account.id)

    if (!syncResult.ok) {
      return syncResult
    }

    if (!hasAcceptedDailyProblem(problem)) {
      return {
        ok: false,
        message: `未在 ${problem.platform} 公开提交中检测到该题 AC，请完成后再验证。`,
      }
    }

    return completeDailyProblem(problem.id)
  }

  function addLeaderboardScore(username: string, score: number, eventId: string, date: string) {
    if (!currentUserId.value || username !== currentUsername.value) {
      return
    }

    const existing = leaderboardEntries.value.find((entry) => entry.username === username)

    if (existing) {
      leaderboardEntries.value = leaderboardEntries.value.map((entry) =>
        entry.username === username ? { ...entry, score: entry.score + score } : entry,
      )
    } else {
      leaderboardEntries.value = [...leaderboardEntries.value, { username, score }]
    }

    persistLeaderboard()
    pushLeaderboardScore(username, score, eventId, date)
  }

  function loadLeaderboardPeriod(period: LeaderboardPeriod) {
    return syncLeaderboardFromServer(period)
  }

  function updateSettings(nextSettings: UserSettings) {
    settings.value = nextSettings
    persistSettings()
    pushSettingsToServer()
  }

  async function saveStoredAiApiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
    const trimmedApiKey = apiKey.trim()

    if (!trimmedApiKey) {
      return { ok: false, message: '请输入 API Key' }
    }

    if (!currentUserId.value) {
      settings.value = {
        ...settings.value,
        aiApiKey: trimmedApiKey,
      }
      persistSettings()
      hasAiApiKey.value = true
      return { ok: true, message: 'API Key 已保存到本地缓存' }
    }

    try {
      const response = await saveSavedAiApiKey(currentUserId.value, trimmedApiKey)
      hasAiApiKey.value = response.hasAiApiKey
      settings.value = {
        ...settings.value,
        aiApiKey: '',
      }
      persistSettings()
      return { ok: true, message: 'API Key 已加密保存到服务端' }
    } catch (error) {
      settings.value = {
        ...settings.value,
        aiApiKey: trimmedApiKey,
      }
      persistSettings()
      hasAiApiKey.value = false
      const message = error instanceof Error ? error.message : 'API Key 保存失败'
      return { ok: false, message }
    }
  }

  async function clearStoredAiApiKey(): Promise<{ ok: boolean; message: string }> {
    if (!currentUserId.value) {
      settings.value = {
        ...settings.value,
        aiApiKey: '',
      }
      persistSettings()
      hasAiApiKey.value = false
      return { ok: true, message: 'API Key 已清除' }
    }

    try {
      const response = await clearSavedAiApiKey(currentUserId.value)
      hasAiApiKey.value = response.hasAiApiKey
      settings.value = {
        ...settings.value,
        aiApiKey: '',
      }
      persistSettings()
      return { ok: true, message: 'API Key 已清除' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'API Key 清除失败'
      return { ok: false, message }
    }
  }

  function updateWeeklyPlanStatus(id: string, status: TrainingPlanStatus) {
    weeklyPlanStatus.value = {
      ...weeklyPlanStatus.value,
      [id]: status,
    }
    persistTrainingPlan()
    pushTrainingPlanToServer()
  }

  function addWeeklyPlanDay(day: Omit<WeeklyTrainingPlanDay, 'id'>) {
    const nextDay: WeeklyTrainingPlanDay = {
      ...day,
      id: `custom-${Date.now()}`,
    }

    weeklyPlanItems.value = [...weeklyPlanItems.value, nextDay]
    persistTrainingPlan()
    pushTrainingPlanToServer()
    return nextDay
  }

  function resetLocalData() {
    accounts.value = []
    settings.value = defaultSettings
    trainingTasks.value = mockTrainingTasks
    weeklyPlanItems.value = weeklyTrainingPlan
    weeklyPlanStatus.value = {}
    codeforcesSubmissions.value = []
    atcoderSubmissions.value = []
    luoguSubmissions.value = []
    persistAccounts()
    persistSubmissions()
    persistSettings()
    persistTrainingPlan()
    dailyChallenge.value = null
    aiAdvice.value = null
    aiAdviceGeneratedAt.value = ''
    leaderboardEntries.value = defaultLeaderboard
    persistDailyChallenge()
    persistLeaderboard()
  }

  watch(
    () => settings.value.syncInterval,
    () => {
      restartAutoSyncScheduler()
    },
    { immediate: true },
  )

  void syncLeaderboardFromServer()

  if (currentUserId.value) {
    void initServerSync()
  }

  return {
    accounts,
    aiAdvice,
    aiAdviceGeneratedAt,
    settings,
    submissions,
    syncedSubmissions,
    hasSyncedSubmissions,
    analysisSubmissions,
    submissionDataSourceLabel,
    trainingTasks,
    weeklyPlanDays,
    weeklyPlanCompletion,
    supportedPlatforms,
    platformSyncCards,
    activePlanCount,
    currentUserId,
    currentUsername,
    sessionToken,
    sessionExpiresAt,
    hasAiApiKey,
    dailyChallenge,
    leaderboard,
    currentLeaderboardUser,
    codeforcesAccount,
    currentUserAvatar,
    leaderboardPeriod,
    leaderboardTotal,
    isLeaderboardLoading,
    serverSyncMessage,
    loginSimpleUser,
    bindAccount,
    removeAccount,
    syncOjAccount,
    loadLeaderboardPeriod,
    loadDailyChallenge,
    verifyAndCompleteDailyProblem,
    updateSettings,
    saveStoredAiApiKey,
    clearStoredAiApiKey,
    saveAiAdviceToServer,
    updateWeeklyPlanStatus,
    addWeeklyPlanDay,
    logout,
    resetLocalData,
  }
})
