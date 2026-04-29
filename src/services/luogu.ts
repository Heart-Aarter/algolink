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

const luoguClient = axios.create({
  baseURL: import.meta.env.DEV ? '/luogu-api' : 'https://www.luogu.com.cn',
  timeout: 10000,
  headers: {
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

const problemBatchSize = 12
let tagCache: Promise<Map<number, string>> | null = null

function normalizeHandle(handle: string) {
  return handle.trim()
}

function getLuoguApiMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!import.meta.env.DEV) {
      return '洛谷网页接口未开放 CORS，静态部署环境无法直接同步；本地开发环境通过 Vite proxy 同步。'
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
  const normalizedHandle = normalizeHandle(handle)

  try {
    const user = await findLuoguUser(normalizedHandle)
    const practice = await fetchLuoguPractice(user.uid)

    return normalizeLuoguUser({
      ...user,
      ...practice.data.user,
    })
  } catch (error) {
    throw new Error(getLuoguApiMessage(error))
  }
}

export async function fetchLuoguSubmissions(handle: string): Promise<OjSubmission[]> {
  const normalizedHandle = normalizeHandle(handle)

  try {
    const user = await findLuoguUser(normalizedHandle)
    const practice = await fetchLuoguPractice(user.uid)

    if (practice.data.privacy) {
      throw new Error(`洛谷用户 "${user.name}" 已关闭练习情况公开展示`)
    }

    const passedProblems = practice.data.passed ?? []
    const passedProblemIds = new Set(passedProblems.map((problem) => problem.pid))
    const submittedProblems = (practice.data.submitted ?? []).filter(
      (problem) => !passedProblemIds.has(problem.pid),
    )

    const problemTags = await fetchLuoguProblemTags([...passedProblems, ...submittedProblems])

    return [
      ...passedProblems.map((problem) =>
        normalizeLuoguPracticeProblem(problem, 'Accepted', problemTags.get(problem.pid)),
      ),
      ...submittedProblems.map((problem) =>
        normalizeLuoguPracticeProblem(problem, 'Unknown', problemTags.get(problem.pid)),
      ),
    ]
  } catch (error) {
    throw new Error(getLuoguApiMessage(error))
  }
}

async function fetchLuoguTagNames() {
  if (!tagCache) {
    tagCache = luoguClient.get<LuoguTagsResponse>('/_lfe/tags').then((response) => {
      return new Map(response.data.tags.map((tag) => [tag.id, tag.name]))
    })
  }

  return tagCache
}

async function fetchLuoguProblemTags(problems: LuoguPracticeProblem[]) {
  const tagNames = await fetchLuoguTagNames()
  const tagsByProblem = new Map<string, string[]>()

  for (let index = 0; index < problems.length; index += problemBatchSize) {
    const batch = problems.slice(index, index + problemBatchSize)
    const results = await Promise.allSettled(batch.map((problem) => fetchLuoguProblem(problem.pid)))

    results.forEach((result, resultIndex) => {
      const sourceProblem = batch[resultIndex]

      if (!sourceProblem || result.status !== 'fulfilled') {
        return
      }

      const problem = result.value
      const tags = (problem.tags ?? []).map((tag) =>
        typeof tag === 'number' ? (tagNames.get(tag) ?? `tag-${tag}`) : tag,
      )

      tagsByProblem.set(sourceProblem.pid, tags)
    })
  }

  return tagsByProblem
}

async function fetchLuoguProblem(pid: string) {
  const response = await luoguClient.get<LuoguProblemListResponse>('/problem/list', {
    params: {
      keyword: pid,
    },
  })

  const problem = response.data.data.problems.result.find((item) => item.pid === pid)

  if (!problem) {
    throw new Error(`未找到洛谷题目 ${pid}`)
  }

  return problem
}

async function fetchLuoguPractice(uid: number) {
  const response = await luoguClient.get<LuoguPracticeResponse>(`/user/${uid}/practice`)

  if (response.data.status !== 200) {
    throw new Error('洛谷练习数据请求失败')
  }

  return response.data
}

export type { LuoguPracticeProblem }
