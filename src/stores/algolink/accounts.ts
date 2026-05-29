import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { hasRecentCodeforcesBindingCe } from '@/services/codeforces'
import { saveAccounts } from '@/services/api'
import type { OjAccount, OjPlatform } from '@/types/algolink'
import { readStorage } from '@/utils/storage'
import { usePersistence } from '@/composables/usePersistence'
import { useSessionStore } from './session'
import { useSyncStore } from './sync'
import { useSubmissionsStore } from './submissions'
import { platformColors, supportedPlatforms } from './shared/constants'
import { formatDateTime } from './shared/format'
import { normalizeAccounts } from './shared/normalizers'
import { getUserCacheKey, storageKeys } from './shared/storageKeys'
import type { StoredOjAccount } from './shared/types'

export const useAccountsStore = defineStore('algolink/accounts', () => {
  const session = useSessionStore()
  const initialUserId = session.currentUserId

  const accounts = shallowRef<OjAccount[]>(
    normalizeAccounts(
      readStorage<StoredOjAccount[]>(
        initialUserId ? getUserCacheKey(initialUserId, 'accounts') : storageKeys.accounts,
        [],
      ),
    ),
  )

  const persistence = usePersistence<OjAccount[]>({
    legacyKey: storageKeys.accounts,
    perUserKey: 'accounts',
    push: (userId, payload) => saveAccounts(userId, payload),
    onPushSuccess: () => {
      useSyncStore().serverSyncMessage = ''
    },
    onPushError: () => {
      useSyncStore().serverSyncMessage = 'Server sync failed. Local cache is kept.'
    },
  })

  function persistAccounts() {
    persistence.persist(session.currentUserId, accounts.value)
  }

  function pushAccountsToServer() {
    persistence.pushToServer(session.currentUserId, accounts.value)
  }

  const codeforcesAccount = computed(() =>
    accounts.value.find((account) => account.platform === 'Codeforces'),
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

  function setAccounts(next: OjAccount[]) {
    accounts.value = next
    persistAccounts()
  }

  function recordAccountSync(id: string, patch: Partial<OjAccount>) {
    accounts.value = accounts.value.map((item) =>
      item.id === id ? { ...item, ...patch, lastSyncAt: patch.lastSyncAt ?? formatDateTime() } : item,
    )
    persistAccounts()
    pushAccountsToServer()
  }

  function addAccount(
    platform: OjPlatform | '',
    handle: string,
  ): { ok: boolean; message: string } {
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

  function removeAccount(id: string) {
    const removedAccount = accounts.value.find((item) => item.id === id)
    accounts.value = accounts.value.filter((item) => item.id !== id)

    if (
      removedAccount?.platform === 'Codeforces' ||
      removedAccount?.platform === 'AtCoder' ||
      removedAccount?.platform === 'Luogu'
    ) {
      useSubmissionsStore().clearSyncedSubmissions(removedAccount.platform)
    }

    persistAccounts()
    pushAccountsToServer()
  }

  function syncAccount(id: string) {
    accounts.value = accounts.value.map((item) =>
      item.id === id ? { ...item, lastSyncAt: formatDateTime() } : item,
    )
    persistAccounts()
    pushAccountsToServer()
  }

  function loadFromCache(userId: string) {
    accounts.value = normalizeAccounts(
      readStorage<StoredOjAccount[]>(getUserCacheKey(userId, 'accounts'), []),
    )
  }

  async function applyServerHydration(payload: {
    serverAccounts: unknown[]
    allowLegacyMigration: boolean
    hasUserAccountsCache: boolean
  }) {
    const userId = session.currentUserId
    if (!userId) {
      return
    }
    const serverAccounts = normalizeAccounts(payload.serverAccounts as StoredOjAccount[])

    if (serverAccounts.length > 0) {
      accounts.value = serverAccounts
      persistAccounts()
      return
    }

    if (payload.allowLegacyMigration && !payload.hasUserAccountsCache) {
      const legacyAccounts = normalizeAccounts(
        readStorage<StoredOjAccount[]>(storageKeys.accounts, []),
      )

      if (legacyAccounts.length > 0) {
        accounts.value = legacyAccounts
        persistAccounts()
        await saveAccounts(userId, accounts.value)
        return
      }
    }

    accounts.value = []
    persistAccounts()
  }

  function resetToDefaults() {
    accounts.value = []
    persistAccounts()
  }

  return {
    accounts,
    codeforcesAccount,
    platformSyncCards,
    bindAccount,
    addAccount,
    removeAccount,
    syncAccount,
    recordAccountSync,
    setAccounts,
    persistAccounts,
    pushAccountsToServer,
    loadFromCache,
    applyServerHydration,
    resetToDefaults,
  }
})
