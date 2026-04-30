import cors from 'cors'
import express from 'express'
import { initDatabase } from './db.js'

const app = express()
const port = 3001

initDatabase()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.listen(port, () => {
  console.log(`AlgoLink API server listening on http://localhost:${port}`)
})
