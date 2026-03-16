import pg from 'pg'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { env } from '../config/env.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Run migrations (plain SQL). Call when DATABASE_URL is set.
 * @returns {Promise<void>}
 */
export async function runMigrations() {
  if (!env.DATABASE_URL) return

  const client = new pg.Client({ connectionString: env.DATABASE_URL })
  await client.connect()

  try {
    const files = readdirSync(join(__dirname, 'migrations'))
      .filter((f) => f.endsWith('.sql'))
      .sort()
    for (const file of files) {
      const sql = readFileSync(join(__dirname, 'migrations', file), 'utf-8')
      await client.query(sql)
    }
  } finally {
    await client.end()
  }
}
