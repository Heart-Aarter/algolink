import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  defaultSettings,
  mockAccounts,
  mockSubmissions,
  trainingTasks as mockTrainingTasks,
} from '@/mock/algolink'
import type { OjAccount, OjPlatform, TrainingTask, UserSettings } from '@/types/algolink'

const storageKeys = {
  accounts: 'algolink.accounts',
  settings: 'algolink.settings',
  tasks: 'algolink.trainingTasks',
}

function readStorage<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key)

  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const useAlgoLinkStore = defineStore('algolink', () => {
  const accounts = ref<OjAccount[]>(readStorage(storageKeys.accounts, mockAccounts))
  const settings = ref<UserSettings>(readStorage(storageKeys.settings, defaultSettings))
  const trainingTasks = ref<TrainingTask[]>(readStorage(storageKeys.tasks, mockTrainingTasks))

  const submissions = ref(mockSubmissions)

  const totalSolved = computed(() => accounts.value.reduce((sum, item) => sum + item.solved, 0))
  const acceptedCount = computed(
    () => submissions.value.filter((item) => item.status === 'Accepted').length,
  )
  const acceptanceRate = computed(() =>
    Math.round((acceptedCount.value / Math.max(submissions.value.length, 1)) * 100),
  )
  const activePlanCount = computed(
    () => trainingTasks.value.filter((item) => item.status !== 'done').length,
  )

  function addAccount(platform: OjPlatform, handle: string) {
    const trimmedHandle = handle.trim()

    if (!trimmedHandle) {
      return
    }

    const nextAccount: OjAccount = {
      id: `${platform.toLowerCase()}-${Date.now()}`,
      platform,
      handle: trimmedHandle,
      rating: 0,
      solved: 0,
      lastSync: '待同步',
      color: platform === 'Codeforces' ? '#4f8cff' : platform === 'Luogu' ? '#28c76f' : '#00c2ff',
    }

    accounts.value = [nextAccount, ...accounts.value]
    writeStorage(storageKeys.accounts, accounts.value)
  }

  function removeAccount(id: string) {
    accounts.value = accounts.value.filter((item) => item.id !== id)
    writeStorage(storageKeys.accounts, accounts.value)
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

  function resetLocalData() {
    accounts.value = mockAccounts
    settings.value = defaultSettings
    trainingTasks.value = mockTrainingTasks
    writeStorage(storageKeys.accounts, accounts.value)
    writeStorage(storageKeys.settings, settings.value)
    writeStorage(storageKeys.tasks, trainingTasks.value)
  }

  return {
    accounts,
    settings,
    submissions,
    trainingTasks,
    totalSolved,
    acceptanceRate,
    activePlanCount,
    addAccount,
    removeAccount,
    updateSettings,
    updateTaskStatus,
    resetLocalData,
  }
})
