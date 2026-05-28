import axios from 'axios'
import type { OjProfile, OjSubmission } from './ojTypes'
import {
  normalizeLuoguPracticeProblem,
  normalizeLuoguUser,
  type LuoguPracticeProblem,
  type LuoguPracticeResponse,
  type LuoguSearchResponse,
  type LuoguTag,
  type LuoguUserInfo,
} from './normalizers'

const apiBase = import.meta.env.VITE_API_BASE
const luoguBaseURL = apiBase ? `${apiBase.replace(/\/$/, '')}/api/luogu` : '/api/luogu'

const luoguClient = axios.create({
  baseURL: luoguBaseURL,
  timeout: 10000,
  headers: {
    Accept: 'application/json, text/plain, */*',
    'X-Requested-With': 'XMLHttpRequest',
    'x-lentille-request': 'content-only',
  },
})

interface LuoguTagsResponse {
  tags: LuoguTag[]
}

interface LuoguProblemListResponse {
  status: number
  data: {
    problems: {
      result: LuoguPracticeProblem[]
    }
  }
}

const problemBatchSize = 4
const problemTagLimit = 48
const problemRequestTimeoutMs = 4500
let tagCache: Promise<Map<number, string>> | null = null

interface LuoguSyncData {
  profile: OjProfile
  submissions: OjSubmission[]
  tagWarning: boolean
}

function getLuoguApiMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.error

    if (typeof serverMessage === 'string' && serverMessage) {
      return serverMessage
    }

    if (error.code === 'ECONNABORTED') {
      return '洛谷公开接口请求超时，请稍后重试'
    }

    if (error.response?.status === 404) {
      return '未找到洛谷用户或公开练习数据'
    }

    if (error.response?.status === 502) {
      return '洛谷公开接口暂时不可用，请稍后重试'
    }

    if (!error.response) {
      return '无法连接洛谷同步代理，请确认后端服务已启动'
    }

    return error.message || 'Luogu API request failed'
  }

  return error instanceof Error ? error.message : 'Luogu API request failed'
}

async function findLuoguUser(handle: string): Promise<LuoguUserInfo> {
  const response = await luoguClient.get<LuoguSearchResponse>('/api/user/search', {
    params: {
      keyword: handle,
    },
  })
  const users = response.data.users ?? []
  const exactUser = users.find((user) => user.name.toLowerCase() === handle.toLowerCase())
  const user = exactUser ?? users[0]

  if (!user) {
    throw new Error(`未找到洛谷用户 "${handle}"`)
  }

  return user
}

export async function fetchLuoguUser(handle: string): Promise<OjProfile> {
  const normalizedHandle = handle.trim()

  try {
    const { user, practice } = await fetchLuoguUserPractice(normalizedHandle)

    return normalizeLuoguUser({
      ...user,
      ...practice.data.user,
    })
  } catch (error) {
    throw new Error(getLuoguApiMessage(error))
  }
}

export async function fetchLuoguSubmissions(handle: string): Promise<OjSubmission[]> {
  const normalizedHandle = handle.trim()

  try {
    const { submissions } = await fetchLuoguSyncData(normalizedHandle)

    return submissions
  } catch (error) {
    throw new Error(getLuoguApiMessage(error))
  }
}

export async function fetchLuoguSyncData(handle: string): Promise<LuoguSyncData> {
  const normalizedHandle = handle.trim()

  try {
    const { user, practice } = await fetchLuoguUserPractice(normalizedHandle)

    if (practice.data.privacy) {
      throw new Error(`洛谷用户 "${user.name}" 已关闭练习情况公开展示`)
    }

    const passedProblems = practice.data.passed ?? []
    const passedProblemIds = new Set(passedProblems.map((problem) => problem.pid))
    const submittedProblems = (practice.data.submitted ?? []).filter(
      (problem) => !passedProblemIds.has(problem.pid),
    )

    const { tagsByProblem, incomplete } = await fetchLuoguProblemTags([
      ...passedProblems,
      ...submittedProblems,
    ])

    const submissions = [
      ...passedProblems.map((problem) =>
        normalizeLuoguPracticeProblem(problem, 'Accepted', tagsByProblem.get(problem.pid)),
      ),
      ...submittedProblems.map((problem) =>
        normalizeLuoguPracticeProblem(problem, 'Unknown', tagsByProblem.get(problem.pid)),
      ),
    ]

    return {
      profile: normalizeLuoguUser({
        ...user,
        ...practice.data.user,
      }),
      submissions,
      tagWarning: incomplete,
    }
  } catch (error) {
    throw new Error(getLuoguApiMessage(error))
  }
}

async function fetchLuoguUserPractice(handle: string) {
  const user = await findLuoguUser(handle)
  const practice = await fetchLuoguPractice(user.uid)

  return { user, practice }
}

async function fetchLuoguTagNames() {
  if (!tagCache) {
    tagCache = luoguClient
      .get<LuoguTagsResponse>('/_lfe/tags', { timeout: problemRequestTimeoutMs })
      .then((response) => {
        return new Map(response.data.tags.map((tag) => [tag.id, tag.name]))
      })
      .catch(() => new Map<number, string>())
  }

  return tagCache
}

async function fetchLuoguProblemTags(problems: LuoguPracticeProblem[]) {
  const tagNames = await fetchLuoguTagNames()
  const tagsByProblem = new Map<string, string[]>()
  const uniqueProblems = Array.from(new Map(problems.map((problem) => [problem.pid, problem])).values())
  const problemsToEnrich = uniqueProblems.slice(0, problemTagLimit)
  let failedCount = uniqueProblems.length - problemsToEnrich.length

  for (let index = 0; index < problemsToEnrich.length; index += problemBatchSize) {
    const batch = problemsToEnrich.slice(index, index + problemBatchSize)
    const results = await Promise.allSettled(batch.map((problem) => fetchLuoguProblem(problem.pid)))

    results.forEach((result, resultIndex) => {
      const sourceProblem = batch[resultIndex]

      if (!sourceProblem || result.status !== 'fulfilled') {
        failedCount += 1
        return
      }

      const problem = result.value
      const tags = (problem.tags ?? []).map((tag) =>
        typeof tag === 'number' ? (tagNames.get(tag) ?? `tag-${tag}`) : tag,
      )

      tagsByProblem.set(sourceProblem.pid, tags)
    })
  }

  return {
    tagsByProblem,
    incomplete: failedCount > 0,
  }
}

async function fetchLuoguProblem(pid: string) {
  const response = await requestLuoguProblem(pid)

  const problem = response.data.problems.result.find((item) => item.pid === pid)

  if (!problem) {
    throw new Error(`未找到洛谷题目 ${pid}`)
  }

  return problem
}

async function requestLuoguProblem(pid: string, attempt = 1): Promise<LuoguProblemListResponse> {
  try {
    const response = await luoguClient.get<LuoguProblemListResponse>('/problem/list', {
      params: {
        keyword: pid,
      },
      timeout: problemRequestTimeoutMs,
    })

    return response.data
  } catch (error) {
    if (attempt < 2) {
      return requestLuoguProblem(pid, attempt + 1)
    }

    throw error
  }
}

async function fetchLuoguPractice(uid: number) {
  const response = await luoguClient.get<LuoguPracticeResponse>(`/user/${uid}/practice`)

  if (response.data.status !== 200) {
    throw new Error('洛谷练习数据请求失败')
  }

  return response.data
}
