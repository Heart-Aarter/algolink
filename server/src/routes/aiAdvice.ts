import { Router } from 'express'
import { getDatabase } from '../db'
import { requireUser } from '../middleware'

const router = Router()

router.get('/:userId/ai-advice', requireUser, (req, res) => {
  const userId = req.params.userId
  const db = getDatabase()
  const row = db
    .prepare('SELECT ai_advice, ai_advice_generated_at FROM user_state WHERE user_id = ?')
    .get(userId) as { ai_advice: string | null; ai_advice_generated_at: string | null } | undefined

  return res.json({
    aiAdvice: row?.ai_advice ? JSON.parse(row.ai_advice) : null,
    aiAdviceGeneratedAt: row?.ai_advice_generated_at ?? null,
  })
})

router.put('/:userId/ai-advice', requireUser, (req, res) => {
  const userId = req.params.userId
  const aiAdvice = req.body?.aiAdvice
  const db = getDatabase()

  db.prepare(
    `
      INSERT INTO user_state (user_id, ai_advice, ai_advice_generated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        ai_advice = excluded.ai_advice,
        ai_advice_generated_at = excluded.ai_advice_generated_at
    `,
  ).run(userId, JSON.stringify(aiAdvice), new Date().toISOString())

  return res.json({ userId, aiAdvice })
})

export default router
