import { Router } from 'express'
import { getDatabase } from '../db'
import { requireUser } from '../middleware'

const router = Router()

router.put('/:userId/daily', requireUser, (req, res) => {
  const userId = req.params.userId
  const dailyChallenge = req.body?.dailyChallenge
  const db = getDatabase()

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
