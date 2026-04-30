import { Router } from 'express'
import { getDatabase } from '../db.js'

const router = Router()

type UserRow = {
  id: string
}

router.put('/:userId/daily', (req, res) => {
  const userId = req.params.userId
  const dailyChallenge = req.body?.dailyChallenge
  const db = getDatabase()
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as UserRow | undefined

  if (!user) {
    return res.status(404).json({ error: 'user not found' })
  }

  db.prepare(
    `
      INSERT INTO user_state (user_id, daily_challenge)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET daily_challenge = excluded.daily_challenge
    `,
  ).run(userId, JSON.stringify(dailyChallenge))

  return res.json({ userId, dailyChallenge })
})

export default router
