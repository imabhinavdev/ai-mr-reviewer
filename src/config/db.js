import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

/** @type {pg.Pool | null} */
let pool = null

/** @type {ReturnType<typeof drizzle> | null} */
let db = null

/**
 * Get the pg Pool. Requires DATABASE_URL. Use for raw queries.
 * @returns {pg.Pool}
 */
export function getPool() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set; database is required for dashboard and analytics')
  }
  if (!pool) {
    pool = new Pool({ connectionString: env.DATABASE_URL })
    db = drizzle(pool)
  }
  return pool
}

/**
 * Get the Drizzle db instance. Requires DATABASE_URL to be set.
 * @returns {ReturnType<typeof drizzle>}
 * @throws {Error} If DATABASE_URL is not set
 */
export function getDb() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set; database is required for dashboard and analytics')
  }
  if (!db) {
    pool = new Pool({ connectionString: env.DATABASE_URL })
    db = drizzle(pool)
  }
  return db
}

/**
 * Check if database is configured (DATABASE_URL set).
 * @returns {boolean}
 */
export function isDbConfigured() {
  return Boolean(env.DATABASE_URL)
}

/**
 * Close the database pool. Call on graceful shutdown.
 * @returns {Promise<void>}
 */
export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
    db = null
  }
}
