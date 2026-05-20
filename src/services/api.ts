import axios, { AxiosError } from 'axios'

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

const apiClient = axios.create({
  baseURL: apiBase,
  timeout: 10000,
})

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(getApiErrorMessage(error))),
)

export interface LoginUserResponse {
  userId: string
  username: string
}

export interface UserDataResponse {
  userId: string
  accounts: unknown[]
  submissions: Record<string, unknown[]>
  settings: unknown | null
  trainingPlan: unknown | null
  dailyChallenge: unknown | null
}

export interface LeaderboardItem {
  username: string
  score: number
}

export interface LeaderboardResponse {
  items: LeaderboardItem[]
}

export async function loginUser(username: string, password: string) {
  const response = await apiClient.post<LoginUserResponse>('/api/user', { username, password })
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
  const response = await apiClient.put<{ userId: string; settings: unknown }>(
    `/api/user/${encodeURIComponent(userId)}/settings`,
    { settings },
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

export async function saveDailyChallenge(userId: string, dailyChallenge: unknown) {
  const response = await apiClient.put<{ userId: string; dailyChallenge: unknown }>(
    `/api/user/${encodeURIComponent(userId)}/daily`,
    { dailyChallenge },
  )
  return response.data
}

export async function getLeaderboard() {
  const response = await apiClient.get<LeaderboardResponse>('/api/leaderboard')
  return response.data
}

export async function submitLeaderboard(username: string, score: number) {
  const response = await apiClient.post<LeaderboardItem>('/api/leaderboard', { username, score })
  return response.data
}

