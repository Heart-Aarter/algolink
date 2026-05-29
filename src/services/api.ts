import axios, { AxiosError } from 'axios'
import type { AiAdviceResponse, UserSettings } from '@/types/algolink'

const apiBase = import.meta.env.VITE_API_BASE || '/'

const apiClient = axios.create({
  baseURL: apiBase,
  timeout: 10000,
})

let sessionToken = ''
let unauthorizedHandler: (() => void) | null = null

export function setApiSession(token: string) {
  sessionToken = token
}

export function setApiUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : '请求失败，请稍后重试'
  }

  const axiosError = error as AxiosError<{ error?: string }>
  const serverMessage = axiosError.response?.data?.error

  if (serverMessage) {
    return serverMessage
  }

  if (axiosError.code === 'ECONNABORTED') {
    return '请求超时，请稍后重试'
  }

  if (!axiosError.response) {
    return '无法连接到服务器，已保留本地缓存'
  }

  return `服务器请求失败 (${axiosError.response.status})`
}

apiClient.interceptors.request.use((config) => {
  if (sessionToken) {
    config.headers.Authorization = `Bearer ${sessionToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const url = error.config?.url ?? ''
      const isLoginRequest = error.config?.method === 'post' && url === '/api/user'

      if (error.response?.status === 401 && !isLoginRequest) {
        unauthorizedHandler?.()
      }
    }

    return Promise.reject(new Error(getApiErrorMessage(error)))
  },
)

export interface LoginUserResponse {
  userId: string
  username: string
  sessionToken: string
  sessionExpiresAt: string
}

export interface UserDataResponse {
  userId: string
  accounts: unknown[]
  submissions: Record<string, unknown[]>
  settings: unknown | null
  hasAiApiKey: boolean
  trainingPlan: unknown | null
  dailyChallenge: unknown | null
  aiAdvice: unknown | null
  aiAdviceGeneratedAt: string | null
}

export interface LeaderboardItem {
  username: string
  score: number
  rank?: number
  isCurrentUser?: boolean
  gapToPrevious?: number
}

export type LeaderboardPeriod = 'all' | 'today' | 'week' | 'streak'

export interface LeaderboardResponse {
  items: LeaderboardItem[]
  currentUser: LeaderboardItem | null
  total: number
  period: LeaderboardPeriod
}

export interface LeaderboardScorePayload {
  username: string
  score: number
  eventId?: string
  source?: string
  date?: string
}

export interface LeaderboardSubmitResponse extends LeaderboardItem {
  addedScore: number
  eventId: string
  duplicated: boolean
}

export interface AiAdviceRequest {
  settings: Pick<
    UserSettings,
    | 'aiProvider'
    | 'aiBaseUrl'
    | 'aiModel'
    | 'aiTone'
    | 'aiPromptPreference'
  >
  analysis: unknown
  weakTags: unknown[]
  recentSubmissions: unknown[]
}

export async function loginUser(username: string, password: string) {
  const response = await apiClient.post<LoginUserResponse>('/api/user', { username, password })
  return response.data
}

export async function logoutUser() {
  const response = await apiClient.delete<{ ok: boolean }>('/api/user/session')
  return response.data
}

export async function getUserData(userId: string) {
  const response = await apiClient.get<UserDataResponse>(`/api/user/${encodeURIComponent(userId)}`)
  return response.data
}

export async function saveAccounts(userId: string, accounts: unknown[]) {
  const response = await apiClient.put<{ userId: string; accounts: unknown[] }>(
    `/api/user/${encodeURIComponent(userId)}/accounts`,
    { accounts },
  )
  return response.data
}

export async function saveSubmissions(userId: string, submissions: Record<string, unknown[]>) {
  const response = await apiClient.put<{
    userId: string
    submissions: Record<string, unknown[]>
  }>(`/api/user/${encodeURIComponent(userId)}/submissions`, { submissions })
  return response.data
}

export async function saveSettings(userId: string, settings: unknown) {
  const response = await apiClient.put<{
    userId: string
    settings: unknown
    hasAiApiKey: boolean
  }>(
    `/api/user/${encodeURIComponent(userId)}/settings`,
    { settings },
  )
  return response.data
}

export async function saveAiApiKey(userId: string, aiApiKey: string) {
  const response = await apiClient.put<{ userId: string; hasAiApiKey: boolean }>(
    `/api/user/${encodeURIComponent(userId)}/settings/ai-key`,
    { aiApiKey },
  )
  return response.data
}

export async function clearAiApiKey(userId: string) {
  const response = await apiClient.delete<{ userId: string; hasAiApiKey: boolean }>(
    `/api/user/${encodeURIComponent(userId)}/settings/ai-key`,
  )
  return response.data
}

export async function saveTrainingPlan(userId: string, trainingPlan: unknown) {
  const response = await apiClient.put<{ userId: string; trainingPlan: unknown }>(
    `/api/user/${encodeURIComponent(userId)}/training-plan`,
    { trainingPlan },
  )
  return response.data
}

export async function saveAiAdvice(userId: string, aiAdvice: AiAdviceResponse | null) {
  const response = await apiClient.put<{ userId: string; aiAdvice: AiAdviceResponse | null }>(
    `/api/user/${encodeURIComponent(userId)}/ai-advice`,
    { aiAdvice },
  )
  return response.data
}

export async function saveDailyChallenge(userId: string, dailyChallenge: unknown) {
  const response = await apiClient.put<{ userId: string; dailyChallenge: unknown }>(
    `/api/user/${encodeURIComponent(userId)}/daily`,
    { dailyChallenge },
  )
  return response.data
}

export async function getLeaderboard(params: {
  period?: LeaderboardPeriod
  username?: string
  limit?: number
  offset?: number
} = {}) {
  const response = await apiClient.get<LeaderboardResponse>('/api/leaderboard', { params })
  return response.data
}

export async function submitLeaderboard(payload: LeaderboardScorePayload) {
  const response = await apiClient.post<LeaderboardSubmitResponse>('/api/leaderboard', payload)
  return response.data
}

export async function generateAiAdvice(userId: string, payload: AiAdviceRequest) {
  const response = await apiClient.post<AiAdviceResponse>(
    `/api/user/${encodeURIComponent(userId)}/ai/advice`,
    payload,
    { timeout: 45000 },
  )
  return response.data
}
