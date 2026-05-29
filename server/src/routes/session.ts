import { Router } from 'express'
import { getDatabase } from '../db'
import { hashSessionToken, requireAuth, getBearerToken } from '../middleware'

const router = Router()

router.delete('/session', requireAuth, (req, res) => {
  const token = getBearerToken(req.get('authorization'))
  const db = getDatabase()
  const tokenHash = hashSessionToken(token)
  db.prepare('DELETE FROM user_sessions WHERE token_hash = ?').run(tokenHash)
  return res.json({ ok: true })
})

export default router
