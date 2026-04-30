import { Router } from 'express'
import { getDatabase } from '../db'

const router = Router()

type UserRow = {
  id: string
}

router.put('/:userId/training-plan', (req, res) => {
  const userId = req.params.userId
  const trainingPlan = req.body?.trainingPlan
  const db = getDatabase()
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as UserRow | undefined

  if (!user) {
    return res.status(404).json({ error: 'user not found' })
  }

  db.prepare(
    `
      INSERT INTO user_state (user_id, training_plan)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET training_plan = excluded.training_plan
    `,
  ).run(userId, JSON.stringify(trainingPlan))

  return res.json({ userId, trainingPlan })
})

export default router
