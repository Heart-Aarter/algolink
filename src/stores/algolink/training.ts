import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { trainingTasks as mockTrainingTasks } from '@/mock/algolink'
import { weeklyTrainingPlan } from '@/mock/trainingPlan'
import { saveTrainingPlan } from '@/services/api'
import type {
  TrainingPlanStatus,
  TrainingTask,
  WeeklyTrainingPlanDay,
} from '@/types/algolink'
import { readStorage, writeStorage } from '@/utils/storage'
import { useSessionStore } from './session'
import { useSyncStore } from './sync'
import { normalizeTrainingPlan } from './shared/normalizers'
import { getUserCacheKey, storageKeys } from './shared/storageKeys'
import type { TrainingPlanCache } from './shared/types'

export const useTrainingStore = defineStore('algolink/training', () => {
  const session = useSessionStore()
  const initialUserId = session.currentUserId

  const initialTrainingPlan = initialUserId
    ? normalizeTrainingPlan(
        readStorage<unknown>(getUserCacheKey(initialUserId, 'trainingPlan'), {}),
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

  function getTrainingPlanCache(): TrainingPlanCache {
    return {
      trainingTasks: trainingTasks.value,
      weeklyPlanItems: weeklyPlanItems.value,
      weeklyPlanStatus: weeklyPlanStatus.value,
    }
  }

  function persistTrainingPlan() {
    const userId = session.currentUserId
    if (userId) {
      writeStorage(getUserCacheKey(userId, 'trainingPlan'), getTrainingPlanCache())
      return
    }

    writeStorage(storageKeys.tasks, trainingTasks.value)
    writeStorage(storageKeys.weeklyPlanDays, weeklyPlanItems.value)
    writeStorage(storageKeys.weeklyPlanStatus, weeklyPlanStatus.value)
  }

  function pushTrainingPlanToServer() {
    const userId = session.currentUserId
    if (!userId) {
      return
    }

    saveTrainingPlan(userId, getTrainingPlanCache())
      .then(() => {
        useSyncStore().serverSyncMessage = ''
      })
      .catch(() => {
        useSyncStore().serverSyncMessage = 'Server sync failed. Local cache is kept.'
      })
  }

  const activePlanCount = computed(
    () => trainingTasks.value.filter((item) => item.status !== 'done').length,
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

  function loadFromCache(userId: string) {
    const cached = normalizeTrainingPlan(
      readStorage<unknown>(getUserCacheKey(userId, 'trainingPlan'), {}),
    )
    trainingTasks.value = cached.trainingTasks
    weeklyPlanItems.value = cached.weeklyPlanItems
    weeklyPlanStatus.value = cached.weeklyPlanStatus
  }

  async function applyServerHydration(payload: {
    serverTrainingPlan: unknown | null
    allowLegacyMigration: boolean
    hasUserTrainingPlanCache: boolean
  }) {
    const userId = session.currentUserId
    if (!userId) {
      return
    }

    const userTrainingPlanKey = getUserCacheKey(userId, 'trainingPlan')
    const next = payload.serverTrainingPlan
      ? normalizeTrainingPlan(payload.serverTrainingPlan)
      : normalizeTrainingPlan(
          payload.allowLegacyMigration && !payload.hasUserTrainingPlanCache
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

    trainingTasks.value = next.trainingTasks
    weeklyPlanItems.value = next.weeklyPlanItems
    weeklyPlanStatus.value = next.weeklyPlanStatus
    persistTrainingPlan()

    if (!payload.serverTrainingPlan && payload.allowLegacyMigration && !payload.hasUserTrainingPlanCache) {
      await saveTrainingPlan(userId, getTrainingPlanCache())
    }
  }

  function resetToDefaults() {
    trainingTasks.value = mockTrainingTasks
    weeklyPlanItems.value = weeklyTrainingPlan
    weeklyPlanStatus.value = {}
    persistTrainingPlan()
  }

  return {
    trainingTasks,
    weeklyPlanItems,
    weeklyPlanStatus,
    activePlanCount,
    weeklyPlanDays,
    weeklyPlanCompletion,
    updateWeeklyPlanStatus,
    addWeeklyPlanDay,
    persistTrainingPlan,
    pushTrainingPlanToServer,
    getTrainingPlanCache,
    loadFromCache,
    applyServerHydration,
    resetToDefaults,
  }
})
