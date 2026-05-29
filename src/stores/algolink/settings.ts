import { defineStore } from 'pinia'
import { ref } from 'vue'
import { defaultSettings } from '@/mock/algolink'
import {
  clearAiApiKey as clearSavedAiApiKey,
  saveAiApiKey as saveSavedAiApiKey,
  saveSettings,
} from '@/services/api'
import type { UserSettings } from '@/types/algolink'
import { readStorage } from '@/utils/storage'
import { usePersistence } from '@/composables/usePersistence'
import { useSessionStore } from './session'
import { useSyncStore } from './sync'
import { getServerSafeSettings } from './shared/format'
import { normalizeSettings } from './shared/normalizers'
import { getUserCacheKey, storageKeys } from './shared/storageKeys'

export const useSettingsStore = defineStore('algolink/settings', () => {
  const session = useSessionStore()
  const initialUserId = session.currentUserId

  const settings = ref<UserSettings>(
    normalizeSettings(
      initialUserId
        ? readStorage<unknown>(getUserCacheKey(initialUserId, 'settings'), defaultSettings)
        : readStorage<UserSettings>(storageKeys.settings, defaultSettings),
    ),
  )
  const hasAiApiKey = ref(false)

  const persistence = usePersistence<UserSettings, ReturnType<typeof getServerSafeSettings>>({
    legacyKey: storageKeys.settings,
    perUserKey: 'settings',
    serialize: (value) => getServerSafeSettings(value),
    push: (userId, payload) => saveSettings(userId, payload),
    onPushSuccess: (response) => {
      const typed = response as { hasAiApiKey?: boolean } | undefined
      if (typed && typeof typed.hasAiApiKey === 'boolean') {
        hasAiApiKey.value = typed.hasAiApiKey
      }
      useSyncStore().serverSyncMessage = ''
    },
    onPushError: () => {
      useSyncStore().serverSyncMessage = 'Server sync failed. Local cache is kept.'
    },
  })

  function persistSettings() {
    persistence.persist(session.currentUserId, settings.value)
  }

  function pushSettingsToServer() {
    persistence.pushToServer(session.currentUserId, settings.value)
  }

  function loadFromCache(userId: string) {
    settings.value = normalizeSettings(
      readStorage<unknown>(getUserCacheKey(userId, 'settings'), defaultSettings),
    )
  }

  function applyServerHydration(payload: {
    settings: unknown
    hasAiApiKey: boolean
    allowLegacyMigration: boolean
    hasUserSettingsCache: boolean
  }) {
    const userId = session.currentUserId
    if (!userId) {
      return
    }

    const localSettings = normalizeSettings(
      payload.allowLegacyMigration && !payload.hasUserSettingsCache
        ? readStorage<UserSettings>(storageKeys.settings, defaultSettings)
        : readStorage<unknown>(getUserCacheKey(userId, 'settings'), defaultSettings),
    )
    hasAiApiKey.value = Boolean(payload.hasAiApiKey)
    settings.value = {
      ...(payload.settings ? normalizeSettings(payload.settings) : localSettings),
      aiApiKey: payload.hasAiApiKey ? '' : localSettings.aiApiKey,
    }
    return localSettings
  }

  function applyAiKeyFlush(legacyAiApiKey: string) {
    settings.value = {
      ...settings.value,
      aiApiKey: legacyAiApiKey,
    }
  }

  function setHasAiApiKey(value: boolean) {
    hasAiApiKey.value = value
    if (value) {
      settings.value = {
        ...settings.value,
        aiApiKey: '',
      }
    }
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

    if (!session.currentUserId) {
      settings.value = {
        ...settings.value,
        aiApiKey: trimmedApiKey,
      }
      persistSettings()
      hasAiApiKey.value = true
      return { ok: true, message: 'API Key 已保存到本地缓存' }
    }

    try {
      const response = await saveSavedAiApiKey(session.currentUserId, trimmedApiKey)
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
    if (!session.currentUserId) {
      settings.value = {
        ...settings.value,
        aiApiKey: '',
      }
      persistSettings()
      hasAiApiKey.value = false
      return { ok: true, message: 'API Key 已清除' }
    }

    try {
      const response = await clearSavedAiApiKey(session.currentUserId)
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

  function resetForLogout() {
    hasAiApiKey.value = false
    settings.value = {
      ...settings.value,
      aiApiKey: '',
    }
  }

  function resetToDefaults() {
    settings.value = defaultSettings
    persistSettings()
  }

  return {
    settings,
    hasAiApiKey,
    updateSettings,
    saveStoredAiApiKey,
    clearStoredAiApiKey,
    persistSettings,
    pushSettingsToServer,
    loadFromCache,
    applyServerHydration,
    applyAiKeyFlush,
    setHasAiApiKey,
    resetForLogout,
    resetToDefaults,
  }
})
