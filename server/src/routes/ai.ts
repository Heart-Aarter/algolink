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

const supportedAiProviders = ['openai-compatible', 'deepseek'] as const
const deepSeekDefaults = {
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-v4-flash',
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function getProviderLabel(provider: string) {
  return provider === 'deepseek' ? 'DeepSeek' : 'OpenAI Compatible'
}

function getConfiguredProvider(value: string | undefined) {
  if (!value) {
    return 'openai-compatible'
  }

  if (supportedAiProviders.includes(value as (typeof supportedAiProviders)[number])) {
    return value
  }

  throw new Error('当前支持 OpenAI Compatible 和 DeepSeek 两种 AI 接口类型')
}

function getProviderConfig(settings: AiProviderSettings) {
  const provider = getConfiguredProvider(settings.aiProvider)
  const baseUrl =
    settings.aiBaseUrl?.trim() || (provider === 'deepseek' ? deepSeekDefaults.baseUrl : '')
  const model = settings.aiModel?.trim() || (provider === 'deepseek' ? deepSeekDefaults.model : '')
  const apiKey = settings.aiApiKey?.trim()

  if (!apiKey) {
    throw new Error(`请先填写 ${getProviderLabel(provider)} API Key`)
  }

  if (!baseUrl || !model) {
    throw new Error(`请先填写 ${getProviderLabel(provider)} 的 API Base URL 和模型名`)
  }

  return {
    provider,
    baseUrl,
    apiKey,
    model,
  }
}

function getProviderLabel(provider: string) {
  return provider === 'deepseek' ? 'DeepSeek' : 'OpenAI Compatible'
}

function getConfiguredProvider(value: string | undefined) {
  if (!value) {
    return 'openai-compatible'
  }

  if (supportedAiProviders.includes(value as (typeof supportedAiProviders)[number])) {
    return value
  }

  throw new Error('当前支持 OpenAI Compatible 和 DeepSeek 两种 AI 接口类型')
}

function getProviderConfig(settings: AiProviderSettings) {
  let provider = getConfiguredProvider(settings.aiProvider)
  const baseUrl =
    settings.aiBaseUrl?.trim() || (provider === 'deepseek' ? deepSeekDefaults.baseUrl : '')
  const model = settings.aiModel?.trim() || (provider === 'deepseek' ? deepSeekDefaults.model : '')
  const apiKey = settings.aiApiKey?.trim()

  if (
    provider === 'openai-compatible' &&
    (baseUrl.includes('api.deepseek.com') || model.toLowerCase().startsWith('deepseek'))
  ) {
    provider = 'deepseek'
  }

  if (!apiKey) {
    throw new Error(`请先填写 ${getProviderLabel(provider)} API Key`)
  }

  if (!baseUrl || !model) {
    throw new Error(`请先填写 ${getProviderLabel(provider)} 的 API Base URL 和模型名`)
  }

  return {
    provider,
    baseUrl,
    apiKey,
    model,
  }
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

  try {
    return JSON.parse(source.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    throw new Error('AI 返回内容不是有效 JSON')
  }
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

async function readErrorDetail(response: Response) {
  const raw = await response.text()

  if (!raw) {
    return ''
  }

  try {
    const parsed = JSON.parse(raw) as {
      error?: string | { message?: string; code?: string; type?: string }
      message?: string
    }
    const error = parsed.error

    if (typeof error === 'string') {
      return error
    }

    if (error?.message) {
      return error.message
    }

    return parsed.message || raw
  } catch {
    return raw
  }
}

function getProviderErrorMessage(provider: string, status: number, detail: string) {
  const providerLabel = getProviderLabel(provider)
  const clippedDetail = detail.trim().slice(0, 220)
  const suffix = clippedDetail ? `：${clippedDetail}` : ''

  if (status === 401 || status === 403) {
    return `${providerLabel} 鉴权失败，请检查 API Key 是否正确${suffix}`
  }

  if (status === 400) {
    return `${providerLabel} 请求参数无效，请检查 API Base URL、模型名和 JSON 输出配置${suffix}`
  }

  if (status === 402) {
    return `${providerLabel} 余额不足或账号不可用，请检查控制台余额${suffix}`
  }

  if (status === 404) {
    return `${providerLabel} 模型或接口地址不存在，请检查 API Base URL 和模型名${suffix}`
  }

  if (status === 429) {
    return `${providerLabel} 请求过于频繁或触发限流，请稍后重试${suffix}`
  }

  return `${providerLabel} 接口请求失败 (${status})${suffix}`
}

function getRequestErrorMessage(provider: string, error: Error) {
  if (error.name === 'AbortError') {
    return `${getProviderLabel(provider)} 接口请求超时`
  }

  if (error.message === 'fetch failed') {
    const cause = error.cause instanceof Error ? `：${error.cause.message}` : ''
    return `${getProviderLabel(provider)} 网络请求失败，请检查服务器网络、DNS、HTTPS 证书或反向代理配置${cause}`
  }

  return error.message
}

router.post('/:userId/ai/advice', requireUser, async (req, res) => {
  let config: ReturnType<typeof getProviderConfig>
  let endpoint: string

  try {
    config = getProviderConfig((req.body?.settings ?? {}) as AiProviderSettings)
    endpoint = getChatCompletionsUrl(config.baseUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 接口配置无效'
    return res.status(400).json({ error: message })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 40000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.35,
        stream: false,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              '你是算法竞赛训练教练。只返回 JSON，不要 Markdown。JSON 字段必须包含 headline、summary、findings、actions、weeklyFocus、recommendedTags。findings 是对象数组，字段 title/detail/severity；actions 是对象数组，字段 title/detail/days。必须输出一个完整 JSON object。',
          },
          {
            role: 'user',
            content: JSON.stringify({
              tone: req.body?.settings?.aiTone || 'balanced',
              userPromptPreference: req.body?.settings?.aiPromptPreference || '',
              analysis: req.body?.analysis,
              weakTags: req.body?.weakTags,
              recentSubmissions: req.body?.recentSubmissions,
              expectedJsonExample: {
                headline: '一句训练判断',
                summary: '一段简短总结',
                findings: [{ title: '问题标题', detail: '问题细节', severity: 'medium' }],
                actions: [{ title: '行动标题', detail: '行动细节', days: 3 }],
                weeklyFocus: ['图论'],
                recommendedTags: ['dp'],
              },
            }),
          },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await readErrorDetail(response)
      return res.status(502).json({
        error: getProviderErrorMessage(config.provider, response.status, detail),
      })
    }

    const data = (await response.json()) as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return res
        .status(502)
        .json({ error: `${getProviderLabel(config.provider)} 没有返回可用内容` })
    }

    return res.json(normalizeAiAdvice(extractJsonObject(content)))
  } catch (error) {
    const message =
      error instanceof Error ? getRequestErrorMessage(config.provider, error) : 'AI 分析请求失败'
    return res.status(502).json({ error: message })
  } finally {
    clearTimeout(timeout)
  }
})

export default router
