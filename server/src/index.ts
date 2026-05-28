import './env'
import cors from 'cors'
import express from 'express'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { initDatabase } from './db'
import aiRouter from './routes/ai'
import aiAdviceRouter from './routes/aiAdvice'
import accountsRouter from './routes/accounts'
import dailyRouter from './routes/daily'
import leaderboardRouter from './routes/leaderboard'
import luoguRouter from './routes/luogu'
import settingsRouter from './routes/settings'
import submissionsRouter from './routes/submissions'
import trainingPlanRouter from './routes/trainingPlan'
import userRouter from './routes/user'

const app = express()
const port = Number(process.env.PORT) || 3001

initDatabase()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now()

  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`)
  })

  next()
}

app.use(requestLogger)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/user', userRouter)
app.use('/api/user', accountsRouter)
app.use('/api/user', aiRouter)
app.use('/api/user', aiAdviceRouter)
app.use('/api/user', submissionsRouter)
app.use('/api/user', settingsRouter)
app.use('/api/user', trainingPlanRouter)
app.use('/api/user', dailyRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/luogu', luoguRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'api route not found' })
})

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error)

  if (res.headersSent) {
    return
  }

  res.status(500).json({ error: 'internal server error' })
}

app.use(errorHandler)

app.listen(port, () => {
  console.log(`AlgoLink API server listening on http://localhost:${port}`)
})
