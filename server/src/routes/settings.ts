import { Router } from 'express'
import { getDatabase } from '../db'
import { requireUser } from '../middleware'

const router = Router()

router.put('/:userId/settings', requireUser, (req, res) => {
  const userId = req.params.userId
  const settings =
    req.body?.settings && typeof req.body.settings === 'object'
      ? { ...req.body.settings, aiApiKey: '' }
      : req.body?.settings
  const db = getDatabase()

  db.prepare(
    `
      INSERT INTO user_state (user_id, settings)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET settings = excluded.settings
    `,
  ).run(userId, JSON.stringify(settings))

  return res.json({ userId, settings })
})

export default router
