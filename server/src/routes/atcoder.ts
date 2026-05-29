import { Router, type Request } from 'express'

const router = Router()
const atcoderOrigin = 'https://kenkoooo.com'
const atcoderTimeoutMs = 10000

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

router.get('/*path', async (req, res, next) => {
  const path = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path
  const targetUrl = new URL(`/atcoder/${path ?? ''}`, atcoderOrigin)
  appendQuery(targetUrl, req)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), atcoderTimeoutMs)

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'AlgoLink/1.0 (+https://github.com)',
      },
      signal: controller.signal,
    })
    const body = await response.text()

    if (!response.ok) {
      res.status(502).json({ error: `AtCoder Problems API request failed (${response.status})` })
      return
    }

    const contentType = response.headers.get('content-type') ?? 'application/json; charset=utf-8'
    res.status(response.status).type(contentType).send(body)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(504).json({ error: 'AtCoder Problems API request timed out' })
      return
    }

    next(error)
  } finally {
    clearTimeout(timeout)
  }
})

export default router
