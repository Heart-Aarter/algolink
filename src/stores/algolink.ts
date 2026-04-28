import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { defaultSettings, mockSubmissions, trainingTasks as mockTrainingTasks } from '@/mock/algolink'
import {
  fetchCodeforcesRating,
  fetchCodeforcesSubmissions,
  fetchCodeforcesUser,
} from '@/services/codeforces'
import { toSubmissionRecord } from '@/services/normalizers'
import { weeklyTrainingPlan } from '@/mock/trainingPlan'
import type {
  OjAccount,
  OjPlatform,
  SubmissionRecord,
  TrainingPlanStatus,
  TrainingTask,
  UserSettings,
} from '@/types/algolink'
import { readStorage, writeStorage } from '@/utils/storage'
import { calculateSubmissionAnalysis, getProblemKey } from '@/utils/analysis'

const storageKeys = {
  accounts: 'algolink.accounts',
  settings: 'algolink.settings',
  tasks: 'algolink.trainingTasks',
  weeklyPlanStatus: 'algolink.weeklyPlanStatus',
  codeforcesSubmissions: 'algolink.codeforcesSubmissions',
}

export const supportedPlatforms: OjPlatform[] = ['Codeforces', 'Luogu', 'AtCoder']

const platformColors: Record<OjPlatform, string> = {
  Codeforces: '#7fa4d8',
  Luogu: '#78c891',
  AtCoder: '#8db1c7',
}

function formatDateTime(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
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
  const accounts = ref<OjAccount[]>(
    normalizeAccounts(readStorage<StoredOjAccount[]>(storageKeys.accounts, [])),
  )
  const settings = ref<UserSettings>(readStorage<UserSettings>(storageKeys.settings, defaultSettings))
  const trainingTasks = ref<TrainingTask[]>(
    readStorage<TrainingTask[]>(storageKeys.tasks, mockTrainingTasks),
  )
  const weeklyPlanStatus = ref<Record<string, TrainingPlanStatus>>(
    readStorage<Record<string, TrainingPlanStatus>>(storageKeys.weeklyPlanStatus, {}),
  )
  const codeforcesSubmissions = ref<SubmissionRecord[]>(
    readStorage<SubmissionRecord[]>(storageKeys.codeforcesSubmissions, []),
  )
  const submissions = computed(() => {
    if (!codeforcesSubmissions.value.length) {
      return mockSubmissions
    }

    return [
      ...codeforcesSubmissions.value,
      ...mockSubmissions.filter((item) => item.platform !== 'Codeforces'),
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
    weeklyTrainingPlan.map((day) => ({
      ...day,
      status: weeklyPlanStatus.value[day.id] ?? 'not-started',
    })),
  )
  const weeklyPlanCompletion = computed(() => {
    const done = weeklyPlanDays.value.filter((day) => day.status === 'done').length
    return Math.round((done / Math.max(weeklyPlanDays.value.length, 1)) * 100)
  })
  const todayPlan = computed(() => weeklyPlanDays.value[0])

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

    const platformSubmissions = submissions.value.filter((item) => item.platform === platform)
    const nextAccount: OjAccount = {
      id: `${platform.toLowerCase()}-${Date.now()}`,
      platform,
      handle: trimmedHandle,
      status: 'bound',
      rating: 0,
      maxRating: 0,
      solved: platformSubmissions.filter((item) => item.status === 'Accepted').length,
      lastSyncAt: formatDateTime(),
      color: platformColors[platform],
    }

    accounts.value = [nextAccount, ...accounts.value]
    writeStorage(storageKeys.accounts, accounts.value)
    return { ok: true, message: `${platform} 账号绑定成功` }
  }

  function removeAccount(id: string) {
    const removedAccount = accounts.value.find((item) => item.id === id)
    accounts.value = accounts.value.filter((item) => item.id !== id)

    if (removedAccount?.platform === 'Codeforces') {
      codeforcesSubmissions.value = []
      writeStorage(storageKeys.codeforcesSubmissions, codeforcesSubmissions.value)
    }

    writeStorage(storageKeys.accounts, accounts.value)
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
        records
          .filter((item) => item.status === 'Accepted')
          .map(getProblemKey),
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

  function resetLocalData() {
    accounts.value = []
    settings.value = defaultSettings
    trainingTasks.value = mockTrainingTasks
    weeklyPlanStatus.value = {}
    codeforcesSubmissions.value = []
    writeStorage(storageKeys.accounts, accounts.value)
    writeStorage(storageKeys.settings, settings.value)
    writeStorage(storageKeys.tasks, trainingTasks.value)
    writeStorage(storageKeys.weeklyPlanStatus, weeklyPlanStatus.value)
    writeStorage(storageKeys.codeforcesSubmissions, codeforcesSubmissions.value)
  }

  return {
    accounts,
    settings,
    submissions,
    codeforcesSubmissions,
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
    addAccount,
    removeAccount,
    syncAccount,
    syncCodeforcesAccount,
    updateSettings,
    updateTaskStatus,
    updateWeeklyPlanStatus,
    resetLocalData,
  }
})
