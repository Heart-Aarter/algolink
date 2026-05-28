import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envFiles = [
  resolve(__dirname, '..', '..', '.env'),
  resolve(__dirname, '..', '.env'),
]

function parseEnvLine(line: string) {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith('#')) {
    return null
  }

  const separatorIndex = trimmed.indexOf('=')

  if (separatorIndex <= 0) {
    return null
  }

  const key = trimmed.slice(0, separatorIndex).trim().replace(/^\uFEFF/, '')
  let value = trimmed.slice(separatorIndex + 1).trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return { key, value }
}

export function loadEnv() {
  for (const envFile of envFiles) {
    if (!existsSync(envFile)) {
      continue
    }

    const lines = readFileSync(envFile, 'utf8').split(/\r?\n/)

    for (const line of lines) {
      const parsed = parseEnvLine(line)

      if (parsed && !process.env[parsed.key]) {
        process.env[parsed.key] = parsed.value
      }
    }
  }
}

loadEnv()
