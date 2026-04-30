import cors from 'cors'
import express from 'express'
import { initDatabase } from './db.js'
import accountsRouter from './routes/accounts.js'
import dailyRouter from './routes/daily.js'
import settingsRouter from './routes/settings.js'
import submissionsRouter from './routes/submissions.js'
import trainingPlanRouter from './routes/trainingPlan.js'
import userRouter from './routes/user.js'

const app = express()
const port = 3001

initDatabase()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/user', userRouter)
app.use('/api/user', accountsRouter)
app.use('/api/user', submissionsRouter)
app.use('/api/user', settingsRouter)
app.use('/api/user', trainingPlanRouter)
app.use('/api/user', dailyRouter)

app.listen(port, () => {
  console.log(`AlgoLink API server listening on http://localhost:${port}`)
})
