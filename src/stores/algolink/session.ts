import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginUser, logoutUser, setApiSession, setApiUnauthorizedHandler } from '@/services/api'
import { isSessionActive } from './shared/format'
import { storageKeys } from './shared/storageKeys'
import { useSyncStore } from './sync'
import { readStorage, writeStorage } from '@/utils/storage'

export const useSessionStore = defineStore('algolink/session', () => {
  const storedSessionToken = readStorage<string>(storageKeys.sessionToken, '')
  const storedSessionExpiresAt = readStorage<string>(storageKeys.sessionExpiresAt, '')
  const hasActiveSession = storedSessionToken && isSessionActive(storedSessionExpiresAt)

  const sessionToken = ref(hasActiveSession ? storedSessionToken : '')
  const sessionExpiresAt = ref(hasActiveSession ? storedSessionExpiresAt : '')
  const currentUserId = ref(
    hasActiveSession ? readStorage<string>(storageKeys.currentUserId, '') : '',
  )
  const currentUsername = ref(readStorage<string>(storageKeys.currentUsername, ''))

  if (!hasActiveSession) {
    localStorage.removeItem(storageKeys.sessionToken)
    localStorage.removeItem(storageKeys.sessionExpiresAt)
    localStorage.removeItem(storageKeys.currentUserId)
  }

  setApiSession(sessionToken.value)

  function persistSession() {
    writeStorage(storageKeys.currentUserId, currentUserId.value)
    writeStorage(storageKeys.currentUsername, currentUsername.value)
    writeStorage(storageKeys.sessionToken, sessionToken.value)
    writeStorage(storageKeys.sessionExpiresAt, sessionExpiresAt.value)
  }

  async function loginSimpleUser(
    username: string,
    password: string,
  ): Promise<{ ok: boolean; message: string; previousUserId: string }> {
    const trimmedUsername = username.trim()

    if (password.length < 6 || password.length > 64) {
      return { ok: false, message: '密码长度必须为 6-64 位', previousUserId: currentUserId.value }
    }

    if (!trimmedUsername) {
      return { ok: false, message: '请输入用户名', previousUserId: currentUserId.value }
    }

    try {
      const previousUserId = currentUserId.value
      const user = await loginUser(trimmedUsername, password)
      currentUserId.value = user.userId
      currentUsername.value = user.username
      sessionToken.value = user.sessionToken
      sessionExpiresAt.value = user.sessionExpiresAt
      setApiSession(user.sessionToken)
      persistSession()

      return { ok: true, message: `已切换到用户 ${user.username}`, previousUserId }
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败'
      return { ok: false, message, previousUserId: currentUserId.value }
    }
  }

  function clearLoginSession() {
    currentUserId.value = ''
    currentUsername.value = ''
    sessionToken.value = ''
    sessionExpiresAt.value = ''
    setApiSession('')
    localStorage.removeItem(storageKeys.currentUserId)
    localStorage.removeItem(storageKeys.currentUsername)
    localStorage.removeItem(storageKeys.sessionToken)
    localStorage.removeItem(storageKeys.sessionExpiresAt)
  }

  function redirectToLogin() {
    if (window.location.pathname === '/login') {
      return
    }
    const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`
    window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`)
  }

  async function logout() {
    try {
      await logoutUser()
    } catch {
      // even if the server call fails, clear local session
    }
    useSyncStore().endSession()
  }

  function registerUnauthorizedHandler(handler: () => void) {
    setApiUnauthorizedHandler(handler)
  }

  return {
    sessionToken,
    sessionExpiresAt,
    currentUserId,
    currentUsername,
    loginSimpleUser,
    clearLoginSession,
    redirectToLogin,
    logout,
    registerUnauthorizedHandler,
  }
})
