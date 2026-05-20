import { Router } from 'express'
import { getDatabase } from '../db'
import { requireUser } from '../middleware'

const router = Router()

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

router.put('/:userId/submissions', requireUser, (req, res) => {
  const userId = req.params.userId
  const submissions = req.body?.submissions
  const db = getDatabase()

  if (!isPlainObject(submissions)) {
    return res.status(400).json({ error: 'submissions must be an object' })
  }

  const upsertSubmission = db.prepare(`
    INSERT INTO user_submissions (user_id, platform, data)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, platform) DO UPDATE SET data = excluded.data
  `)
  const saveSubmissions = db.transaction((items: [string, unknown][]) => {
    for (const [platform, data] of items) {
      upsertSubmission.run(userId, platform, JSON.stringify(data))
    }
  })

  saveSubmissions(Object.entries(submissions))

  return res.json({ userId, submissions })
})

export default router
