import { eq, sql, and, gte, lte, desc } from 'drizzle-orm'
import { getDb, getPool } from '../../config/db.js'
import { reviewEvents } from '../schema.js'

/**
 * @param {{
 *   provider: string
 *   repoId: string
 *   repoName: string
 *   mrNumber: number
 *   authorUsername: string | null
 *   bullmqJobId: string
 * }} input
 * @returns {Promise<{ id: number }>}
 */
export async function insertReviewEvent(input) {
  const db = getDb()
  const [row] = await db
    .insert(reviewEvents)
    .values({
      provider: input.provider,
      repoId: input.repoId,
      repoName: input.repoName,
      mrNumber: input.mrNumber,
      authorUsername: input.authorUsername ?? null,
      status: 'queued',
      commentsPostedCount: 0,
      bullmqJobId: input.bullmqJobId,
    })
    .returning({ id: reviewEvents.id })
  return row
}

/**
 * @param {string} bullmqJobId
 * @param {{ status: 'completed' | 'failed', commentsPostedCount?: number }} update
 * @returns {Promise<void>}
 */
export async function updateReviewEventByBullmqJobId(bullmqJobId, update) {
  const db = getDb()
  const values = {
    status: update.status,
    updatedAt: new Date(),
  }
  if (typeof update.commentsPostedCount === 'number') {
    values.commentsPostedCount = update.commentsPostedCount
  }
  await db.update(reviewEvents).set(values).where(eq(reviewEvents.bullmqJobId, bullmqJobId))
}

/**
 * @returns {Promise<{
 *   total: number
 *   byStatus: { queued: number, completed: number, failed: number }
 *   totalComments: number
 *   last7Days: number
 *   last30Days: number
 * }>}
 */
export async function getOverview() {
  const db = getDb()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const totalRows = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
  const totalResult = totalRows[0]

  const byStatusRows = await db
    .select({
      status: reviewEvents.status,
      count: sql`count(*)::int`.as('count'),
    })
    .from(reviewEvents)
    .groupBy(reviewEvents.status)

  const [commentsResult] = await db
    .select({ sum: sql`coalesce(sum(${reviewEvents.commentsPostedCount}), 0)::int` })
    .from(reviewEvents)

  const last7Rows = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(gte(reviewEvents.createdAt, sevenDaysAgo))
  const last7 = last7Rows[0]

  const last30Rows = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(gte(reviewEvents.createdAt, thirtyDaysAgo))
  const last30 = last30Rows[0]

  const byStatus = { queued: 0, completed: 0, failed: 0 }
  for (const row of byStatusRows) {
    if (row.status in byStatus) byStatus[row.status] = row.count
  }

  return {
    total: totalResult?.count ?? 0,
    byStatus,
    totalComments: commentsResult?.sum ?? 0,
    last7Days: last7?.count ?? 0,
    last30Days: last30?.count ?? 0,
  }
}

/**
 * @param {{
 *   provider?: string
 *   repo?: string
 *   status?: string
 *   from?: string
 *   to?: string
 *   limit?: number
 *   offset?: number
 * }} filters
 * @returns {Promise<{ events: Array<import('../schema.js').reviewEvents.$inferSelect>, total: number }>}
 */
export async function listEvents(filters = {}) {
  const db = getDb()
  const { provider, repo, status, from, to, limit = 50, offset = 0 } = filters

  const conditions = []
  if (provider) conditions.push(eq(reviewEvents.provider, provider))
  if (repo) conditions.push(eq(reviewEvents.repoName, repo))
  if (status) conditions.push(eq(reviewEvents.status, status))
  if (from) conditions.push(gte(reviewEvents.createdAt, new Date(from)))
  if (to) conditions.push(lte(reviewEvents.createdAt, new Date(to)))

  const where = conditions.length ? and(...conditions) : undefined

  const events = await db
    .select()
    .from(reviewEvents)
    .where(where)
    .orderBy(desc(reviewEvents.createdAt))
    .limit(Math.min(limit, 100))
    .offset(offset)

  const countRows = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(where)
  const countResult = countRows[0]

  return {
    events,
    total: countResult?.count ?? 0,
  }
}

/**
 * @returns {Promise<Array<{ repoId: string, repoName: string, provider: string, mrCount: number, commentCount: number }>>}
 */
export async function listProjects() {
  const db = getDb()
  const rows = await db
    .select({
      repoId: reviewEvents.repoId,
      repoName: reviewEvents.repoName,
      provider: reviewEvents.provider,
      mrCount: sql`count(*)::int`,
      commentCount: sql`coalesce(sum(${reviewEvents.commentsPostedCount}), 0)::int`,
    })
    .from(reviewEvents)
    .groupBy(reviewEvents.repoId, reviewEvents.repoName, reviewEvents.provider)
    .orderBy(sql`count(*) desc`)

  return rows
}

/**
 * @returns {Promise<Array<{ authorUsername: string | null, provider: string, mrCount: number, commentCount: number }>>}
 */
export async function listUsers() {
  const db = getDb()
  const rows = await db
    .select({
      authorUsername: reviewEvents.authorUsername,
      provider: reviewEvents.provider,
      mrCount: sql`count(*)::int`,
      commentCount: sql`coalesce(sum(${reviewEvents.commentsPostedCount}), 0)::int`,
    })
    .from(reviewEvents)
    .groupBy(reviewEvents.authorUsername, reviewEvents.provider)
    .orderBy(sql`count(*) desc`)

  return rows
}

/**
 * @param {{ from: string, to: string, bucket?: 'day' | 'week' }} params
 * @returns {Promise<Array<{ date: string, count: number }>>}
 */
export async function getActivity(params) {
  const { from, to, bucket = 'day' } = params
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const dateTrunc = bucket === 'week' ? 'week' : 'day'

  const pool = getPool()
  const result = await pool.query(
    `SELECT date_trunc($1, created_at)::date AS date, count(*)::int AS count
     FROM review_events
     WHERE created_at >= $2 AND created_at <= $3
     GROUP BY date_trunc($1, created_at)
     ORDER BY date`,
    [dateTrunc, fromDate, toDate],
  )
  const rows = result.rows ?? []

  return rows.map((r) => ({
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
    count: Number(r.count),
  }))
}
