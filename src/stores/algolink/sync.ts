import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getUserData, saveAiApiKey as saveSavedAiApiKey, saveSettings } from '@/services/api'
import type { OjAccount } from '@/types/algolink'
import { useSessionStore } from './session'
import { useAccountsStore } from './accounts'
import { useSubmissionsStore } from './submissions'
import { useSettingsStore } from './settings'
import { useTrainingStore } from './training'
import { useDailyChallengeStore } from './dailyChallenge'
import { useAiAdviceStore } from './aiAdvice'
import { useLeaderboardStore } from './leaderboard'
import { autoSyncCheckMs, autoSyncIntervalMs } from './shared/constants'
import { formatDateTime, getServerSafeSettings, parseSyncTime } from './shared/format'
import { getUserCacheKey, hasStorageValue } from './shared/storageKeys'

export const useSyncStore = defineStore('algolink/sync', () => {
  const serverSyncMessage = ref('')
  const autoSyncState = ref({
    running: false,
    lastRunAt: '',
    message: '',
  })
  let autoSyncTimer: ReturnType<typeof window.setInterval> | undefined

  function shouldAutoSyncAccount(account: OjAccount) {
    const settings = useSettingsStore()
    if (settings.settings.syncInterval === 'manual') {
      return false
    }

    const interval = autoSyncIntervalMs[settings.settings.syncInterval]
    const lastSyncedAt = parseSyncTime(account.lastSyncAt)

    return !lastSyncedAt || Date.now() - lastSyncedAt.getTime() >= interval
  }

  async function syncDueAccounts() {
    const settings = useSettingsStore()
    const accounts = useAccountsStore()
    const submissions = useSubmissionsStore()

    if (settings.settings.syncInterval === 'manual' || autoSyncState.value.running) {
      return
    }

    const dueAccounts = accounts.accounts.filter(shouldAutoSyncAccount)

    if (!dueAccounts.length) {
      return
    }

    autoSyncState.value = {
      running: true,
      lastRunAt: formatDateTime(),
      message: `Auto syncing ${dueAccounts.length} account(s)`,
    }

    const results = await Promise.allSettled(
      dueAccounts.map((account) => submissions.syncOjAccount(account.id)),
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

    const settings = useSettingsStore()

    if (settings.settings.syncInterval === 'manual') {
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

  function applyLocalUserCache(userId: string) {
    useAccountsStore().loadFromCache(userId)
    useSubmissionsStore().loadFromCache(userId)
    useSettingsStore().loadFromCache(userId)
    useTrainingStore().loadFromCache(userId)
    useDailyChallengeStore().loadFromCache(userId)
    useAiAdviceStore().loadFromCache(userId)
  }

  async function initServerSync(allowLegacyMigration = false) {
    const session = useSessionStore()
    const userId = session.currentUserId
    if (!userId) {
      return
    }

    let serverData: Awaited<ReturnType<typeof getUserData>>
    try {
      serverData = await getUserData(userId)
    } catch {
      serverSyncMessage.value = 'Server unavailable. Showing local cache.'
      return
    }
    serverSyncMessage.value = ''

    const accounts = useAccountsStore()
    const submissions = useSubmissionsStore()
    const settings = useSettingsStore()
    const training = useTrainingStore()
    const daily = useDailyChallengeStore()
    const aiAdvice = useAiAdviceStore()

    const hasUserAccountsCache = hasStorageValue(getUserCacheKey(userId, 'accounts'))
    const hasUserSubmissionsCache = hasStorageValue(getUserCacheKey(userId, 'submissions'))
    const hasUserSettingsCache = hasStorageValue(getUserCacheKey(userId, 'settings'))
    const hasUserTrainingPlanCache = hasStorageValue(getUserCacheKey(userId, 'trainingPlan'))
    const hasUserDailyChallengeCache = hasStorageValue(getUserCacheKey(userId, 'dailyChallenge'))
    const hasUserAiAdviceCache = hasStorageValue(getUserCacheKey(userId, 'aiAdvice'))

    await accounts.applyServerHydration({
      serverAccounts: serverData.accounts,
      allowLegacyMigration,
      hasUserAccountsCache,
    })

    await submissions.applyServerHydration({
      serverSubmissions: serverData.submissions,
      allowLegacyMigration,
      hasUserSubmissionsCache,
    })

    const localSettings = settings.applyServerHydration({
      settings: serverData.settings,
      hasAiApiKey: serverData.hasAiApiKey,
      allowLegacyMigration,
      hasUserSettingsCache,
    })

    if (!serverData.settings && allowLegacyMigration && !hasUserSettingsCache) {
      try {
        await saveSettings(userId, getServerSafeSettings(settings.settings))
      } catch {
        serverSyncMessage.value = 'Server sync failed. Local cache is kept.'
      }
    }

    const legacyAiApiKey = localSettings?.aiApiKey.trim() ?? ''
    if (legacyAiApiKey) {
      try {
        const response = await saveSavedAiApiKey(userId, legacyAiApiKey)
        settings.setHasAiApiKey(response.hasAiApiKey)
      } catch {
        settings.applyAiKeyFlush(legacyAiApiKey)
        serverSyncMessage.value = 'Server sync failed. Local API key is kept.'
      }
    } else {
      settings.applyAiKeyFlush('')
    }
    settings.persistSettings()

    await training.applyServerHydration({
      serverTrainingPlan: serverData.trainingPlan,
      allowLegacyMigration,
      hasUserTrainingPlanCache,
    })

    await daily.applyServerHydration({
      serverDailyChallenge: serverData.dailyChallenge,
      allowLegacyMigration,
      hasUserDailyChallengeCache,
    })

    aiAdvice.applyServerHydration({
      aiAdvice: serverData.aiAdvice,
      aiAdviceGeneratedAt: serverData.aiAdviceGeneratedAt,
      hasUserAiAdviceCache,
    })
  }

  async function bootstrapAfterLogin(previousUserId: string) {
    const session = useSessionStore()
    const userId = session.currentUserId
    if (!userId) {
      return
    }

    applyLocalUserCache(userId)
    await initServerSync(!previousUserId)
    await useLeaderboardStore().syncLeaderboardFromServer(useLeaderboardStore().leaderboardPeriod)
  }

  function endSession() {
    const session = useSessionStore()
    const settings = useSettingsStore()
    session.clearLoginSession()
    settings.resetForLogout()
    serverSyncMessage.value = 'Session expired. Please log in again.'
    session.redirectToLogin()
  }

  function resetLocalData() {
    useAccountsStore().resetToDefaults()
    useSubmissionsStore().resetToDefaults()
    useSettingsStore().resetToDefaults()
    useTrainingStore().resetToDefaults()
    useDailyChallengeStore().resetToDefaults()
    useAiAdviceStore().resetToDefaults()
    useLeaderboardStore().resetToDefaults()
  }

  function startBackgroundBootstrap() {
    const session = useSessionStore()
    void useLeaderboardStore().syncLeaderboardFromServer()
    if (session.currentUserId) {
      void initServerSync()
    }
  }

  watch(
    () => useSettingsStore().settings.syncInterval,
    () => {
      restartAutoSyncScheduler()
    },
    { immediate: true },
  )

  return {
    serverSyncMessage,
    autoSyncState,
    bootstrapAfterLogin,
    applyLocalUserCache,
    initServerSync,
    syncDueAccounts,
    restartAutoSyncScheduler,
    handleUnauthorized: endSession,
    endSession,
    resetLocalData,
    startBackgroundBootstrap,
  }
})
