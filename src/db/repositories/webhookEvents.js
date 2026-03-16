import { desc } from 'drizzle-orm'
import { getDb } from '../../config/db.js'
import { webhookEvents } from '../schema.js'

/**
 * @param {{ provider: string, eventType: string, repoName: string, action?: string, accepted?: boolean, queued?: boolean }}
 * @returns {Promise<{ id: number }>}
 */
export async function insertWebhookEvent(input) {
  const db = getDb()
  const [row] = await db
    .insert(webhookEvents)
    .values({
      provider: input.provider,
      eventType: input.eventType,
      repoName: input.repoName,
      action: input.action ?? null,
      accepted: input.accepted !== false,
      queued: input.queued === true,
    })
    .returning({ id: webhookEvents.id })
  return row
}

/**
 * @param {{ limit?: number }} opts
 * @returns {Promise<Array<{ id: number, provider: string, eventType: string, repoName: string, action: string | null, accepted: boolean, queued: boolean, receivedAt: Date }>>}
 */
export async function listWebhookEvents(opts = {}) {
  const limit = Math.min(opts.limit ?? 50, 100)
  const db = getDb()
  const rows = await db
    .select()
    .from(webhookEvents)
    .orderBy(desc(webhookEvents.receivedAt))
    .limit(limit)
  return rows
}
