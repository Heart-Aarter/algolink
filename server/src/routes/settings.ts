import { Router } from 'express'
import { getDatabase } from '../db'
import { requireUser } from '../middleware'
import { encryptSecret } from '../secrets'

const router = Router()

router.put('/:userId/settings', requireUser, (req, res) => {
  const userId = req.params.userId
  const rawSettings =
    req.body?.settings && typeof req.body.settings === 'object' ? req.body.settings : null

  if (!rawSettings) {
    return res.status(400).json({ error: 'Settings must be an object' })
  }

  const settings = Object.fromEntries(
    Object.entries(rawSettings as Record<string, unknown>).filter(([key]) => key !== 'aiApiKey'),
  )
  const db = getDatabase()

  db.prepare(
    `
      INSERT INTO user_state (user_id, settings)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET settings = excluded.settings
    `,
  ).run(userId, JSON.stringify(settings))

  const secretRow = db
    .prepare('SELECT ai_api_key_ciphertext FROM user_secrets WHERE user_id = ?')
    .get(userId) as { ai_api_key_ciphertext: string | null } | undefined

  return res.json({ userId, settings, hasAiApiKey: Boolean(secretRow?.ai_api_key_ciphertext) })
})

router.put('/:userId/settings/ai-key', requireUser, (req, res) => {
  const userId = req.params.userId
  const apiKey = typeof req.body?.aiApiKey === 'string' ? req.body.aiApiKey.trim() : ''

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' })
  }

  if (apiKey.length > 1024) {
    return res.status(400).json({ error: 'API Key is too long' })
  }

  const db = getDatabase()

  try {
    const encrypted = encryptSecret(apiKey)

    db.prepare(
      `
        INSERT INTO user_secrets (
          user_id,
          ai_api_key_ciphertext,
          ai_api_key_iv,
          ai_api_key_tag,
          updated_at
        )
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          ai_api_key_ciphertext = excluded.ai_api_key_ciphertext,
          ai_api_key_iv = excluded.ai_api_key_iv,
          ai_api_key_tag = excluded.ai_api_key_tag,
          updated_at = CURRENT_TIMESTAMP
      `,
    ).run(userId, encrypted.ciphertext, encrypted.iv, encrypted.tag)
  } catch (error) {
    console.error('Failed to encrypt API key:', error)
    return res.status(500).json({ error: 'Failed to save API key' })
  }

  const secretRow = db
    .prepare('SELECT ai_api_key_ciphertext FROM user_secrets WHERE user_id = ?')
    .get(userId) as { ai_api_key_ciphertext: string | null } | undefined

  return res.json({ userId, hasAiApiKey: Boolean(secretRow?.ai_api_key_ciphertext) })
})

router.delete('/:userId/settings/ai-key', requireUser, (req, res) => {
  const userId = req.params.userId
  const db = getDatabase()

  db.prepare('DELETE FROM user_secrets WHERE user_id = ?').run(userId)

  return res.json({ userId, hasAiApiKey: false })
})

export default router
