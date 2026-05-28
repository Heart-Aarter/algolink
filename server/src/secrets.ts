import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { loadEnv } from './env'

const algorithm = 'aes-256-gcm'

function getEncryptionKey() {
  loadEnv()
  const secret = process.env.ALGOLINK_ENCRYPTION_SECRET

  if (!secret || secret.trim().length < 16) {
    throw new Error('ALGOLINK_ENCRYPTION_SECRET must be set to at least 16 characters')
  }

  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(algorithm, getEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

export function decryptSecret(value: { ciphertext: string; iv: string; tag: string }) {
  const decipher = createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(value.iv, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(value.tag, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
