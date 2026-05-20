import { Router } from 'express'
import { requireUser } from '../middleware'

const router = Router()

interface AiProviderSettings {
  aiProvider?: string
  aiBaseUrl?: string
  aiApiKey?: string
  aiModel?: string
  aiTone?: string
  aiPromptPreference?: string
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function getChatCompletionsUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  const url = new URL(trimmed)

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('API Base URL 必须使用 http 或 https')
  }

  if (url.pathname.endsWith('/chat/completions')) {
    return url.toString()
  }

  return `${url.toString().replace(/\/+$/, '')}/chat/completions`
}

function extractJsonObject(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const source = fenced?.[1] ?? content
  const start = source.indexOf('{')
  const end = source.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI 返回内容不是可解析的 JSON')
  }

  return JSON.parse(source.slice(start, end + 1)) as Record<string, unknown>
}

function toStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback
  }

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 8)
}

function toObjectArray<T extends Record<string, unknown>>(
  value: unknown,
  mapper: (item: Record<string, unknown>) => T,
) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map(mapper)
    .slice(0, 8)
}

function normalizeAiAdvice(value: Record<string, unknown>) {
  const findings = toObjectArray(value.findings, (item) => ({
    title: String(item.title || '训练风险'),
    detail: String(item.detail || ''),
    severity:
      item.severity === 'high' || item.severity === 'medium' || item.severity === 'low'
        ? item.severity
        : 'medium',
  }))

  const actions = toObjectArray(value.actions, (item) => ({
    title: String(item.title || '训练动作'),
    detail: String(item.detail || ''),
    days: Number.isFinite(Number(item.days)) ? Number(item.days) : undefined,
  }))

  return {
    headline: String(value.headline || 'AI 已生成训练分析'),
    summary: String(value.summary || ''),
    findings,
    actions,
    weeklyFocus: toStringArray(value.weeklyFocus),
    recommendedTags: toStringArray(value.recommendedTags),
  }
}

router.post('/:userId/ai/advice', requireUser, async (req, res) => {
  const settings = (req.body?.settings ?? {}) as AiProviderSettings
  const baseUrl = settings.aiBaseUrl?.trim()
  const apiKey = settings.aiApiKey?.trim()
  const model = settings.aiModel?.trim()

  if (settings.aiProvider && settings.aiProvider !== 'openai-compatible') {
    return res.status(400).json({ error: '当前仅支持 OpenAI Compatible 接口' })
  }

  if (!baseUrl || !apiKey || !model) {
    return res.status(400).json({ error: '请先填写 API Base URL、API Key 和模型名' })
  }

  let endpoint: string
  try {
    endpoint = getChatCompletionsUrl(baseUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'API Base URL 不合法'
    return res.status(400).json({ error: message })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 40000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              '你是算法竞赛训练教练。只返回 JSON，不要 Markdown。JSON 字段必须包含 headline、summary、findings、actions、weeklyFocus、recommendedTags。findings 是对象数组，字段 title/detail/severity。actions 是对象数组，字段 title/detail/days。',
          },
          {
            role: 'user',
            content: JSON.stringify({
              tone: settings.aiTone || 'balanced',
              userPromptPreference: settings.aiPromptPreference || '',
              analysis: req.body?.analysis,
              weakTags: req.body?.weakTags,
              recentSubmissions: req.body?.recentSubmissions,
            }),
          },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text()
      return res.status(502).json({
        error: `AI 接口请求失败 (${response.status})${detail ? `：${detail.slice(0, 180)}` : ''}`,
      })
    }

    const data = (await response.json()) as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return res.status(502).json({ error: 'AI 接口没有返回可用内容' })
    }

    return res.json(normalizeAiAdvice(extractJsonObject(content)))
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'AI 接口请求超时'
        : error instanceof Error
          ? error.message
          : 'AI 分析请求失败'
    return res.status(502).json({ error: message })
  } finally {
    clearTimeout(timeout)
  }
})

export default router
