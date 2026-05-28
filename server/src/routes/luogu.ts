import { Router, type Request, type RequestHandler } from 'express'

const router = Router()
const luoguOrigin = 'https://www.luogu.com.cn'
const luoguTimeoutMs = 10000
const redirectStatuses = new Set([301, 302, 303, 307, 308])

type LuoguPathResolver = string | ((req: Request) => string)

const luoguHeaders = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest',
  'x-lentille-request': 'content-only',
}

function appendQuery(targetUrl: URL, req: Request) {
  Object.entries(req.query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'string') {
          targetUrl.searchParams.append(key, item)
        }
      })
      return
    }

    if (typeof value === 'string') {
      targetUrl.searchParams.set(key, value)
    }
  })
}

function getTargetUrl(req: Request, pathResolver: LuoguPathResolver) {
  const pathname = typeof pathResolver === 'function' ? pathResolver(req) : pathResolver
  const targetUrl = new URL(pathname, luoguOrigin)
  appendQuery(targetUrl, req)
  return targetUrl
}

function getLuoguProxyError(response: Response) {
  const location = response.headers.get('location')

  if (location) {
    const redirectedUrl = new URL(location, luoguOrigin)

    if (redirectedUrl.origin === luoguOrigin && redirectedUrl.pathname === response.url.replace(luoguOrigin, '').split('?')[0]) {
      return '洛谷接口触发访问校验，已阻止同地址重定向；请稍后重试'
    }
  }

  return '洛谷接口触发重定向校验，请稍后重试'
}

function rejectBadRequest(message: string): RequestHandler {
  return (_req, res) => {
    res.status(400).json({ error: message })
  }
}

function validateKeyword(paramName: string, maxLength: number): RequestHandler {
  return (req, res, next) => {
    const value = req.query[paramName]

    if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
      res.status(400).json({ error: '洛谷查询参数无效' })
      return
    }

    next()
  }
}

function proxyLuogu(pathResolver: LuoguPathResolver): RequestHandler {
  return async (req, res, next) => {
    const targetUrl = getTargetUrl(req, pathResolver)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), luoguTimeoutMs)

    try {
      const response = await fetch(targetUrl, {
        headers: luoguHeaders,
        redirect: 'manual',
        signal: controller.signal,
      })

      if (redirectStatuses.has(response.status)) {
        res.status(502).json({ error: getLuoguProxyError(response) })
        return
      }

      const body = await response.text()

      if (!response.ok) {
        res.status(502).json({
          error: `洛谷公开接口请求失败 (${response.status})`,
        })
        return
      }

      const contentType = response.headers.get('content-type') ?? 'application/json; charset=utf-8'
      res.status(response.status).type(contentType).send(body)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        res.status(504).json({ error: '洛谷公开接口请求超时，请稍后重试' })
        return
      }

      next(error)
    } finally {
      clearTimeout(timeout)
    }
  }
}

router.get('/api/user/search', validateKeyword('keyword', 80), proxyLuogu('/api/user/search'))

router.get('/user/:uid/practice', (req, _res, next) => {
  const uid = req.params.uid

  if (typeof uid !== 'string' || !/^\d+$/.test(uid)) {
    rejectBadRequest('洛谷用户 ID 无效')(req, _res, next)
    return
  }

  next()
}, proxyLuogu((req) => `/user/${String(req.params.uid)}/practice`))

router.get('/problem/list', validateKeyword('keyword', 40), proxyLuogu('/problem/list'))
router.get('/_lfe/tags', proxyLuogu('/_lfe/tags'))

export default router
