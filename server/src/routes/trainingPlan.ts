import { Router } from 'express'
import { getDatabase } from '../db'
import { requireUser } from '../middleware'

const router = Router()

router.put('/:userId/training-plan', requireUser, (req, res) => {
  const userId = req.params.userId
  const trainingPlan = req.body?.trainingPlan
  const db = getDatabase()

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
