import { Router } from 'express'
import { getDatabase } from '../db'
import { hashSessionToken, requireAuth } from '../middleware'

const router = Router()

function getBearerToken(value: string | undefined) {
  if (!value) return ''
  const [scheme, token] = value.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : ''
}

router.delete('/session', requireAuth, (req, res) => {
  const token = getBearerToken(req.get('authorization'))
  const db = getDatabase()
  const tokenHash = hashSessionToken(token)
  db.prepare('DELETE FROM user_sessions WHERE token_hash = ?').run(tokenHash)
  return res.json({ ok: true })
})

export default router
