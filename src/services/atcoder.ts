import axios from 'axios'
import type { OjProfile, OjSubmission } from './ojTypes'
import {
  normalizeAtCoderSubmission,
  normalizeAtCoderUser,
  type AtCoderProblemMeta,
  type AtCoderProblemsSubmission,
  type AtCoderProblemsUserInfo,
} from './normalizers'

const atcoderClient = axios.create({
  baseURL: '/atcoder-api',
  timeout: 10000,
})

interface AtCoderProblemResource {
  id: string
  title: string
}

interface AtCoderProblemModel {
  difficulty?: number
}

const submissionsPageSize = 500
let problemMetaCache: Promise<Map<string, AtCoderProblemMeta>> | null = null

function normalizeHandle(handle: string) {
  return handle.trim()
}

function getAtCoderApiMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return fallback
    }

    return error.message || 'AtCoder Problems API request failed'
  }

  return error instanceof Error ? error.message : 'AtCoder Problems API request failed'
}

async function fetchAtCoderProblemMeta() {
  if (!problemMetaCache) {
    problemMetaCache = Promise.all([
      atcoderClient.get<AtCoderProblemResource[]>('/resources/problems.json'),
      atcoderClient.get<Record<string, AtCoderProblemModel>>('/resources/problem-models.json'),
    ]).then(([problemsResponse, modelsResponse]) => {
      const meta = new Map<string, AtCoderProblemMeta>()

      for (const problem of problemsResponse.data) {
        meta.set(problem.id, { title: problem.title })
      }

      for (const [problemId, model] of Object.entries(modelsResponse.data)) {
        meta.set(problemId, {
          ...meta.get(problemId),
          difficulty: model.difficulty,
        })
      }

      return meta
    })
  }

  return problemMetaCache
}

export async function fetchAtCoderUser(handle: string): Promise<OjProfile> {
  const normalizedHandle = normalizeHandle(handle)

  try {
    const response = await atcoderClient.get<AtCoderProblemsUserInfo>(
      '/atcoder-api/v3/user_info',
      {
        params: {
          user: normalizedHandle,
        },
      },
    )

    return normalizeAtCoderUser(normalizedHandle, response.data)
  } catch (error) {
    throw new Error(getAtCoderApiMessage(error, `AtCoder user "${normalizedHandle}" not found`))
  }
}

export async function fetchAtCoderSubmissions(handle: string): Promise<OjSubmission[]> {
  const normalizedHandle = normalizeHandle(handle)

  try {
    const [problemMeta, submissions] = await Promise.all([
      fetchAtCoderProblemMeta(),
      fetchAllAtCoderSubmissions(normalizedHandle),
    ])

    return submissions
      .map((submission) =>
        normalizeAtCoderSubmission(submission, problemMeta.get(submission.problem_id)),
      )
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
  } catch (error) {
    throw new Error(
      getAtCoderApiMessage(error, `AtCoder submissions for "${normalizedHandle}" not found`),
    )
  }
}

export async function hasRecentAtCoderBindingCe(handle: string): Promise<boolean> {
  const normalizedHandle = normalizeHandle(handle)
  const windowSeconds = 15 * 60
  const fromSecond = Math.floor(Date.now() / 1000) - windowSeconds

  try {
    const response = await atcoderClient.get<AtCoderProblemsSubmission[]>(
      '/atcoder-api/v3/user/submissions',
      {
        params: {
          user: normalizedHandle,
          from_second: fromSecond,
        },
      },
    )

    return response.data.some(
      (submission) =>
        submission.epoch_second >= fromSecond &&
        submission.result === 'CE',
    )
  } catch (error) {
    throw new Error(
      getAtCoderApiMessage(error, `AtCoder submissions for "${normalizedHandle}" not found`),
    )
  }
}

async function fetchAllAtCoderSubmissions(handle: string) {
  const submissions: AtCoderProblemsSubmission[] = []
  let fromSecond = 0

  while (true) {
    const response = await atcoderClient.get<AtCoderProblemsSubmission[]>(
      '/atcoder-api/v3/user/submissions',
      {
        params: {
          user: handle,
          from_second: fromSecond,
        },
      },
    )
    const page = response.data

    submissions.push(...page)

    if (page.length < submissionsPageSize) {
      break
    }

    fromSecond = Math.max(...page.map((submission) => submission.epoch_second)) + 1
  }

  return submissions
}
