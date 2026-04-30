import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import {
  defaultSettings,
  mockSubmissions,
  trainingTasks as mockTrainingTasks,
} from '@/mock/algolink'
import {
  fetchCodeforcesRating,
  fetchCodeforcesSubmissions,
  fetchCodeforcesUser,
  hasRecentCodeforcesBindingCe,
} from '@/services/codeforces'
import {
  fetchAtCoderSubmissions,
  fetchAtCoderUser,
  hasRecentAtCoderBindingCe,
} from '@/services/atcoder'
import { fetchDailyProblems } from '@/services/dailyChallenge'
import { loginUser } from '@/services/api'
import { fetchLuoguSubmissions, fetchLuoguUser } from '@/services/luogu'
import { toSubmissionRecord } from '@/services/normalizers'
import { weeklyTrainingPlan } from '@/mock/trainingPlan'
import type {
  OjAccount,
  OjPlatform,
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
import { calculateSubmissionAnalysis, getProblemKey } from '@/utils/analysis'

const storageKeys = {
  currentUserId: 'algolink:currentUserId',
  currentUsername: 'algolink:currentUsername',
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
}

export const supportedPlatforms: OjPlatform[] = ['Codeforces', 'Luogu', 'AtCoder']

const platformColors: Record<OjPlatform, string> = {
  Codeforces: '#7fa4d8',
  Luogu: '#78c891',
  AtCoder: '#8db1c7',
}

const autoSyncIntervalMs = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
} as const

const autoSyncCheckMs = 60 * 60 * 1000

const defaultLeaderboard: LeaderboardEntry[] = [
  { username: 'tourist', score: 6200 },
  { username: 'StudyingFather', score: 4300 },
  { username: 'bc_focus', score: 3100 },
  { username: 'AlgoLinkUser', score: 0 },
]

function formatDateTime(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function formatDateKey(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseSyncTime(value: string) {
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

type StoredOjAccount = Partial<OjAccount> & { lastSync?: string }

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
      solved: Number(account.solved ?? 0),
      lastSyncAt: account.lastSyncAt || account.lastSync || '暂无同步',
      color: account.color || platformColors[account.platform],
    }))
}

export const useAlgoLinkStore = defineStore('algolink', () => {
  const currentUserId = ref(readStorage<string>(storageKeys.currentUserId, ''))
  const accounts = ref<OjAccount[]>(
    normalizeAccounts(readStorage<StoredOjAccount[]>(storageKeys.accounts, [])),
  )
  const currentUsername = ref(
    readStorage<string>(storageKeys.currentUsername, '') || accounts.value[0]?.handle || 'AlgoLinkUser',
  )
  const settings = ref<UserSettings>(
    readStorage<UserSettings>(storageKeys.settings, defaultSettings),
  )
  const trainingTasks = ref<TrainingTask[]>(
    readStorage<TrainingTask[]>(storageKeys.tasks, mockTrainingTasks),
  )
  const weeklyPlanItems = ref<WeeklyTrainingPlanDay[]>(
    readStorage<WeeklyTrainingPlanDay[]>(storageKeys.weeklyPlanDays, weeklyTrainingPlan),
  )
  const weeklyPlanStatus = ref<Record<string, TrainingPlanStatus>>(
    readStorage<Record<string, TrainingPlanStatus>>(storageKeys.weeklyPlanStatus, {}),
  )
  const codeforcesSubmissions = ref<SubmissionRecord[]>(
    readStorage<SubmissionRecord[]>(storageKeys.codeforcesSubmissions, []),
  )
  const atcoderSubmissions = ref<SubmissionRecord[]>(
    readStorage<SubmissionRecord[]>(storageKeys.atcoderSubmissions, []),
  )
  const luoguSubmissions = ref<SubmissionRecord[]>(
    readStorage<SubmissionRecord[]>(storageKeys.luoguSubmissions, []),
  )
  const dailyChallenge = ref<DailyChallengeState | null>(
    readStorage<DailyChallengeState | null>(storageKeys.dailyChallenge, null),
  )
  const leaderboardEntries = ref<LeaderboardEntry[]>(
    readStorage<LeaderboardEntry[]>(storageKeys.leaderboard, defaultLeaderboard),
  )
  const autoSyncState = ref({
    running: false,
    lastRunAt: '',
    message: '',
  })
  let autoSyncTimer: ReturnType<typeof window.setInterval> | undefined
  const syncedSubmissions = computed(() => [
    ...codeforcesSubmissions.value,
    ...atcoderSubmissions.value,
    ...luoguSubmissions.value,
  ])
  const hasSyncedSubmissions = computed(() => syncedSubmissions.value.length > 0)
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

  const boundPlatforms = computed(() => new Set(accounts.value.map((item) => item.platform)))
  const boundSubmissions = computed(() =>
    submissions.value.filter((item) => boundPlatforms.value.has(item.platform)),
  )
  const submissionAnalysis = computed(() => calculateSubmissionAnalysis(boundSubmissions.value))
  const totalSolved = computed(() => submissionAnalysis.value.solvedProblems)
  const acceptedCount = computed(
    () => boundSubmissions.value.filter((item) => item.status === 'Accepted').length,
  )
  const acceptanceRate = computed(() =>
    Math.round((acceptedCount.value / Math.max(boundSubmissions.value.length, 1)) * 100),
  )
  const activePlanCount = computed(
    () => trainingTasks.value.filter((item) => item.status !== 'done').length,
  )
  const leaderboard = computed(() => {
    const board = new Map<string, number>()

    for (const entry of leaderboardEntries.value) {
      board.set(entry.username, Math.max(board.get(entry.username) ?? 0, entry.score))
    }

    if (!board.has(currentUsername.value)) {
      board.set(currentUsername.value, 0)
    }

    return [...board.entries()]
      .map(([username, score]) => ({ username, score }))
      .sort((left, right) => right.score - left.score || left.username.localeCompare(right.username))
  })
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
  const todayPlan = computed(() => weeklyPlanDays.value[0])

  async function loginSimpleUser(
    username: string,
  ): Promise<{ ok: boolean; message: string }> {
    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      return { ok: false, message: '请输入用户名' }
    }

    try {
      const user = await loginUser(trimmedUsername)
      currentUserId.value = user.userId
      currentUsername.value = user.username
      writeStorage(storageKeys.currentUserId, currentUserId.value)
      writeStorage(storageKeys.currentUsername, currentUsername.value)

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

    try {
      if (platform === 'Codeforces') {
        const verified = await hasRecentCodeforcesBindingCe(trimmedHandle)

        if (!verified) {
          return {
            ok: false,
            message: '未检测到 10 分钟内在 Codeforces 1A 的 CE 提交，请提交后再绑定。',
          }
        }
      }

      if (platform === 'AtCoder') {
        const verified = await hasRecentAtCoderBindingCe(trimmedHandle)

        if (!verified) {
          return {
            ok: false,
            message: '未检测到 10 分钟内在 AtCoder practice_1 的 CE 提交，请提交后再绑定。',
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `${platform} 公开提交读取失败`
      return { ok: false, message: `${platform} 绑定验证失败：${message}` }
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
    writeStorage(storageKeys.accounts, accounts.value)
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

    writeStorage(storageKeys.accounts, accounts.value)
  }

  function clearSyncedSubmissions(platform: OjPlatform) {
    if (platform === 'Codeforces') {
      codeforcesSubmissions.value = []
      writeStorage(storageKeys.codeforcesSubmissions, codeforcesSubmissions.value)
      return
    }

    if (platform === 'AtCoder') {
      atcoderSubmissions.value = []
      writeStorage(storageKeys.atcoderSubmissions, atcoderSubmissions.value)
      return
    }

    luoguSubmissions.value = []
    writeStorage(storageKeys.luoguSubmissions, luoguSubmissions.value)
  }

  function syncAccount(id: string) {
    accounts.value = accounts.value.map((item) =>
      item.id === id ? { ...item, lastSyncAt: formatDateTime() } : item,
    )
    writeStorage(storageKeys.accounts, accounts.value)
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
      const latestRating = ratingChanges.at(-1)?.newRating ?? profile.rating
      const acceptedProblems = new Set(
        records.filter((item) => item.status === 'Accepted').map(getProblemKey),
      )

      codeforcesSubmissions.value = records
      accounts.value = accounts.value.map((item) =>
        item.id === id
          ? {
              ...item,
              handle: profile.handle,
              rating: latestRating,
              maxRating: profile.maxRating,
              solved: acceptedProblems.size,
              lastSyncAt: formatDateTime(),
            }
          : item,
      )
      writeStorage(storageKeys.codeforcesSubmissions, codeforcesSubmissions.value)
      writeStorage(storageKeys.accounts, accounts.value)

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
      writeStorage(storageKeys.atcoderSubmissions, atcoderSubmissions.value)
      writeStorage(storageKeys.accounts, accounts.value)

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
      const [profile, syncedSubmissions] = await Promise.all([
        fetchLuoguUser(account.handle),
        fetchLuoguSubmissions(account.handle),
      ])
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
      writeStorage(storageKeys.luoguSubmissions, luoguSubmissions.value)
      writeStorage(storageKeys.accounts, accounts.value)

      return {
        ok: true,
        message: `洛谷公开练习数据同步成功，已保存 ${records.length} 条题目记录。`,
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

    if (dailyChallenge.value?.date === today && dailyChallenge.value.problems.length === 2) {
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
      writeStorage(storageKeys.dailyChallenge, dailyChallenge.value)

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
    writeStorage(storageKeys.dailyChallenge, dailyChallenge.value)

    if (delta > 0) {
      addLeaderboardScore(currentUsername.value, delta)
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

  function addLeaderboardScore(username: string, score: number) {
    const existing = leaderboardEntries.value.find((entry) => entry.username === username)

    if (existing) {
      leaderboardEntries.value = leaderboardEntries.value.map((entry) =>
        entry.username === username ? { ...entry, score: entry.score + score } : entry,
      )
    } else {
      leaderboardEntries.value = [...leaderboardEntries.value, { username, score }]
    }

    writeStorage(storageKeys.leaderboard, leaderboardEntries.value)
  }

  function updateSettings(nextSettings: UserSettings) {
    settings.value = nextSettings
    writeStorage(storageKeys.settings, settings.value)
  }

  function updateTaskStatus(id: string, status: TrainingTask['status']) {
    trainingTasks.value = trainingTasks.value.map((task) =>
      task.id === id ? { ...task, status } : task,
    )
    writeStorage(storageKeys.tasks, trainingTasks.value)
  }

  function updateWeeklyPlanStatus(id: string, status: TrainingPlanStatus) {
    weeklyPlanStatus.value = {
      ...weeklyPlanStatus.value,
      [id]: status,
    }
    writeStorage(storageKeys.weeklyPlanStatus, weeklyPlanStatus.value)
  }

  function addWeeklyPlanDay(day: Omit<WeeklyTrainingPlanDay, 'id'>) {
    const nextDay: WeeklyTrainingPlanDay = {
      ...day,
      id: `custom-${Date.now()}`,
    }

    weeklyPlanItems.value = [...weeklyPlanItems.value, nextDay]
    writeStorage(storageKeys.weeklyPlanDays, weeklyPlanItems.value)
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
    writeStorage(storageKeys.accounts, accounts.value)
    writeStorage(storageKeys.settings, settings.value)
    writeStorage(storageKeys.tasks, trainingTasks.value)
    writeStorage(storageKeys.weeklyPlanDays, weeklyPlanItems.value)
    writeStorage(storageKeys.weeklyPlanStatus, weeklyPlanStatus.value)
    writeStorage(storageKeys.codeforcesSubmissions, codeforcesSubmissions.value)
    writeStorage(storageKeys.atcoderSubmissions, atcoderSubmissions.value)
    writeStorage(storageKeys.luoguSubmissions, luoguSubmissions.value)
    dailyChallenge.value = null
    leaderboardEntries.value = defaultLeaderboard
    writeStorage(storageKeys.dailyChallenge, dailyChallenge.value)
    writeStorage(storageKeys.leaderboard, leaderboardEntries.value)
  }

  watch(
    () => settings.value.syncInterval,
    () => {
      restartAutoSyncScheduler()
    },
    { immediate: true },
  )

  return {
    accounts,
    settings,
    submissions,
    codeforcesSubmissions,
    atcoderSubmissions,
    luoguSubmissions,
    syncedSubmissions,
    hasSyncedSubmissions,
    submissionDataSourceLabel,
    boundSubmissions,
    submissionAnalysis,
    trainingTasks,
    weeklyPlanDays,
    weeklyPlanCompletion,
    todayPlan,
    supportedPlatforms,
    platformSyncCards,
    totalSolved,
    acceptanceRate,
    activePlanCount,
    currentUserId,
    currentUsername,
    dailyChallenge,
    leaderboard,
    autoSyncState,
    loginSimpleUser,
    bindAccount,
    addAccount,
    removeAccount,
    syncAccount,
    syncCodeforcesAccount,
    syncAtCoderAccount,
    syncLuoguAccount,
    syncOjAccount,
    syncDueAccounts,
    loadDailyChallenge,
    completeDailyProblem,
    verifyAndCompleteDailyProblem,
    updateSettings,
    updateTaskStatus,
    updateWeeklyPlanStatus,
    addWeeklyPlanDay,
    resetLocalData,
  }
})
