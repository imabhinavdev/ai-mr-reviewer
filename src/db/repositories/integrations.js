import { eq } from 'drizzle-orm'
import { getDb } from '../../config/db.js'
import { integrations } from '../schema.js'
import { env } from '../../config/env.js'

const INTEGRATION_DEFS = [
  { type: 'github', name: 'GitHub', envKeys: ['GITHUB_TOKEN'] },
  { type: 'gitlab', name: 'GitLab', envKeys: ['GITLAB_TOKEN', 'GITLAB_PRIVATE_TOKEN'] },
]

/**
 * Sync integrations table from current env. Sets configured=true if any of the env keys are set.
 * @returns {Promise<Array<{ id: number, name: string, type: string, configured: boolean, syncedAt: Date }>>}
 */
export async function syncIntegrationsFromEnv() {
  const db = getDb()
  const now = new Date()

  for (const def of INTEGRATION_DEFS) {
    const configured = def.envKeys.some((key) => env[key] && String(env[key]).trim().length > 0)
    const existing = await db.select().from(integrations).where(eq(integrations.type, def.type)).limit(1)
    if (existing.length > 0) {
      await db
        .update(integrations)
        .set({ configured, name: def.name, syncedAt: now })
        .where(eq(integrations.type, def.type))
    } else {
      await db.insert(integrations).values({
        name: def.name,
        type: def.type,
        configured,
        syncedAt: now,
      })
    }
  }

  return listIntegrations()
}

/**
 * @returns {Promise<Array<{ id: number, name: string, type: string, configured: boolean, syncedAt: Date }>>}
 */
export async function listIntegrations() {
  const db = getDb()
  const rows = await db.select().from(integrations).orderBy(integrations.type)
  return rows
}
