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
  const now = new Date()
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
      queuedAt: now,
    })
    .returning({ id: reviewEvents.id })
  return row
}

/**
 * @param {string} bullmqJobId
 * @param {{ status?: 'completed' | 'failed', commentsPostedCount?: number, durationSeconds?: number, aiProvider?: string, failureReason?: string, filesChanged?: number, linesAdded?: number, linesRemoved?: number, queuedAt?: Date, diffFetchedAt?: Date, aiStartedAt?: Date, commentsPostedAt?: Date }} update
 * @returns {Promise<void>}
 */
export async function updateReviewEventByBullmqJobId(bullmqJobId, update) {
  const db = getDb()
  const values = { updatedAt: new Date() }
  if (update.status != null) values.status = update.status
  if (typeof update.commentsPostedCount === 'number') {
    values.commentsPostedCount = update.commentsPostedCount
  }
  if (typeof update.durationSeconds === 'number') {
    values.durationSeconds = update.durationSeconds
  }
  if (update.aiProvider != null) values.aiProvider = update.aiProvider
  if (update.failureReason != null) values.failureReason = update.failureReason
  if (typeof update.filesChanged === 'number')
    values.filesChanged = update.filesChanged
  if (typeof update.linesAdded === 'number')
    values.linesAdded = update.linesAdded
  if (typeof update.linesRemoved === 'number')
    values.linesRemoved = update.linesRemoved
  if (update.queuedAt != null) values.queuedAt = update.queuedAt
  if (update.diffFetchedAt != null) values.diffFetchedAt = update.diffFetchedAt
  if (update.aiStartedAt != null) values.aiStartedAt = update.aiStartedAt
  if (update.commentsPostedAt != null)
    values.commentsPostedAt = update.commentsPostedAt
  await db
    .update(reviewEvents)
    .set(values)
    .where(eq(reviewEvents.bullmqJobId, bullmqJobId))
}

/**
 * @returns {Promise<{
 *   total: number
 *   byStatus: { queued: number, completed: number, failed: number }
 *   totalComments: number
 *   last7Days: number
 *   last30Days: number
 *   reviewsToday: number
 *   avgReviewTimeSeconds: number | null
 *   activeProjects: number
 * }>}
 */
export async function getOverview() {
  const db = getDb()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const startOfToday = new Date()
  startOfToday.setUTCHours(0, 0, 0, 0)

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
    .select({
      sum: sql`coalesce(sum(${reviewEvents.commentsPostedCount}), 0)::int`,
    })
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

  const todayRows = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(gte(reviewEvents.createdAt, startOfToday))
  const reviewsToday = todayRows[0]?.count ?? 0

  const [avgResult] = await db
    .select({
      avg: sql`avg(${reviewEvents.durationSeconds})::float`,
    })
    .from(reviewEvents)
    .where(sql`${reviewEvents.durationSeconds} IS NOT NULL`)
  const avgReviewTimeSeconds =
    avgResult?.avg != null ? Number(avgResult.avg) : null

  const distinctRepos = await db
    .select({ count: sql`count(distinct ${reviewEvents.repoId})::int` })
    .from(reviewEvents)
  const activeProjects = distinctRepos[0]?.count ?? 0

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
    reviewsToday,
    avgReviewTimeSeconds,
    activeProjects,
  }
}

/**
 * @param {{
 *   provider?: string
 *   repo?: string
 *   status?: string
 *   from?: string
 *   to?: string
 *   authorUsername?: string
 *   limit?: number
 *   offset?: number
 * }} filters
 * @returns {Promise<{ events: Array<import('../schema.js').reviewEvents.$inferSelect>, total: number }>}
 */
export async function listEvents(filters = {}) {
  const db = getDb()
  const {
    provider,
    repo,
    status,
    from,
    to,
    authorUsername,
    limit = 50,
    offset = 0,
  } = filters

  const conditions = []
  if (provider) conditions.push(eq(reviewEvents.provider, provider))
  if (repo) conditions.push(eq(reviewEvents.repoName, repo))
  if (status) conditions.push(eq(reviewEvents.status, status))
  if (from) conditions.push(gte(reviewEvents.createdAt, new Date(from)))
  if (to) conditions.push(lte(reviewEvents.createdAt, new Date(to)))
  if (authorUsername != null && authorUsername !== '')
    conditions.push(eq(reviewEvents.authorUsername, authorUsername))

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
 * @param {number} id - review_events.id
 * @returns {Promise<import('../schema.js').reviewEvents.$inferSelect | null>}
 */
export async function getEventById(id) {
  const db = getDb()
  const rows = await db
    .select()
    .from(reviewEvents)
    .where(eq(reviewEvents.id, id))
    .limit(1)
  return rows[0] ?? null
}

/**
 * @param {string} bullmqJobId
 * @returns {Promise<number | null>} review_events.id
 */
export async function getReviewEventIdByBullmqJobId(bullmqJobId) {
  const db = getDb()
  const rows = await db
    .select({ id: reviewEvents.id })
    .from(reviewEvents)
    .where(eq(reviewEvents.bullmqJobId, bullmqJobId))
    .limit(1)
  return rows[0]?.id ?? null
}

/**
 * @param {string} provider - e.g. 'github' | 'gitlab'
 * @returns {Promise<{ reposReviewed: number, lastActivityAt: Date | null }>}
 */
export async function getProviderStats(provider) {
  const db = getDb()
  const countRows = await db
    .select({ count: sql`count(distinct ${reviewEvents.repoId})::int` })
    .from(reviewEvents)
    .where(eq(reviewEvents.provider, provider))
  const maxRows = await db
    .select({ max: sql`max(${reviewEvents.createdAt})` })
    .from(reviewEvents)
    .where(eq(reviewEvents.provider, provider))
  return {
    reposReviewed: countRows[0]?.count ?? 0,
    lastActivityAt: maxRows[0]?.max ?? null,
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
 * @returns {Promise<Array<{ authorUsername: string | null, provider: string, mrCount: number, commentCount: number, repositories: string[], lastActivity: Date | null }>>}
 */
export async function listUsers() {
  const pool = getPool()
  const result = await pool.query(
    `SELECT
       author_username AS "authorUsername",
       provider,
       count(*)::int AS "mrCount",
       coalesce(sum(comments_posted_count), 0)::int AS "commentCount",
       coalesce(array_agg(DISTINCT repo_name) FILTER (WHERE repo_name IS NOT NULL), ARRAY[]::text[]) AS "repositories",
       max(updated_at) AS "lastActivity"
     FROM review_events
     WHERE author_username IS NOT NULL
     GROUP BY author_username, provider
     ORDER BY count(*) DESC`,
  )
  const rows = result.rows ?? []
  return rows.map((r) => ({
    authorUsername: r.authorUsername,
    provider: r.provider,
    mrCount: Number(r.mrCount),
    commentCount: Number(r.commentCount),
    repositories: Array.isArray(r.repositories) ? r.repositories : [],
    lastActivity:
      r.lastActivity instanceof Date
        ? r.lastActivity
        : r.lastActivity
          ? new Date(r.lastActivity)
          : null,
  }))
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
    date:
      r.date instanceof Date
        ? r.date.toISOString().slice(0, 10)
        : String(r.date).slice(0, 10),
    count: Number(r.count),
  }))
}

/**
 * @param {string} provider
 * @param {string} username
 * @returns {Promise<{
 *   username: string
 *   provider: string
 *   repoCount: number
 *   totalPRs: number
 *   totalComments: number
 *   firstSeen: Date | null
 *   lastActivity: Date | null
 *   prsWithIssues: number
 *   avgIssuesPerPR: number
 * } | null>}
 */
export async function getUserProfile(provider, username) {
  const db = getDb()

  const baseConditions = and(
    eq(reviewEvents.provider, provider),
    eq(reviewEvents.authorUsername, username),
  )

  const [aggRow] = await db
    .select({
      repoCount: sql`count(distinct ${reviewEvents.repoId})::int`,
      totalPRs: sql`count(*)::int`,
      totalComments: sql`coalesce(sum(${reviewEvents.commentsPostedCount}), 0)::int`,
      firstSeen: sql`min(${reviewEvents.createdAt})`,
      lastActivity: sql`max(${reviewEvents.updatedAt})`,
      prsWithIssues: sql`count(*) FILTER (WHERE ${reviewEvents.commentsPostedCount} > 0)::int`,
    })
    .from(reviewEvents)
    .where(baseConditions)

  if (!aggRow || Number(aggRow.totalPRs) === 0) return null

  const totalPRs = Number(aggRow.totalPRs)
  const totalComments = Number(aggRow.totalComments)
  const prsWithIssues = Number(aggRow.prsWithIssues)

  return {
    username,
    provider,
    repoCount: Number(aggRow.repoCount),
    totalPRs,
    totalComments,
    firstSeen:
      aggRow.firstSeen instanceof Date
        ? aggRow.firstSeen
        : aggRow.firstSeen
          ? new Date(aggRow.firstSeen)
          : null,
    lastActivity:
      aggRow.lastActivity instanceof Date
        ? aggRow.lastActivity
        : aggRow.lastActivity
          ? new Date(aggRow.lastActivity)
          : null,
    prsWithIssues,
    avgIssuesPerPR:
      totalPRs > 0 ? Math.round((totalComments / totalPRs) * 10) / 10 : 0,
  }
}

/**
 * @param {string} provider
 * @param {string} username
 * @returns {Promise<Array<{ repoName: string, repoId: string, mrCount: number, commentCount: number, lastContribution: Date | null }>>}
 */
export async function listReposByUser(provider, username) {
  const pool = getPool()
  const result = await pool.query(
    `SELECT
       repo_id AS "repoId",
       repo_name AS "repoName",
       count(*)::int AS "mrCount",
       coalesce(sum(comments_posted_count), 0)::int AS "commentCount",
       max(updated_at) AS "lastContribution"
     FROM review_events
     WHERE provider = $1 AND author_username = $2
     GROUP BY repo_id, repo_name
     ORDER BY count(*) DESC`,
    [provider, username],
  )
  const rows = result.rows ?? []
  return rows.map((r) => ({
    repoId: r.repoId,
    repoName: r.repoName,
    mrCount: Number(r.mrCount),
    commentCount: Number(r.commentCount),
    lastContribution:
      r.lastContribution instanceof Date
        ? r.lastContribution
        : r.lastContribution
          ? new Date(r.lastContribution)
          : null,
  }))
}

/**
 * @param {string} provider
 * @param {string} username
 * @param {{ from: string, to: string, bucket?: 'day' | 'week' }} params
 * @returns {Promise<Array<{ date: string, count: number }>>}
 */
export async function getActivityByUser(provider, username, params) {
  const { from, to, bucket = 'day' } = params
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const dateTrunc = bucket === 'week' ? 'week' : 'day'

  const pool = getPool()
  const result = await pool.query(
    `SELECT date_trunc($1, created_at)::date AS date, count(*)::int AS count
     FROM review_events
     WHERE author_username = $2 AND provider = $3
       AND created_at >= $4 AND created_at <= $5
     GROUP BY date_trunc($1, created_at)
     ORDER BY date`,
    [dateTrunc, username, provider, fromDate, toDate],
  )
  const rows = result.rows ?? []

  return rows.map((r) => ({
    date:
      r.date instanceof Date
        ? r.date.toISOString().slice(0, 10)
        : String(r.date).slice(0, 10),
    count: Number(r.count),
  }))
}

/**
 * Issues (AI comments) over time for a user – sum of comments_posted_count per date bucket.
 * @param {string} provider
 * @param {string} username
 * @param {{ from: string, to: string, bucket?: 'day' | 'week' }} params
 * @returns {Promise<Array<{ date: string, count: number }>>}
 */
export async function getIssuesActivityByUser(provider, username, params) {
  const { from, to, bucket = 'day' } = params
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const dateTrunc = bucket === 'week' ? 'week' : 'day'

  const pool = getPool()
  const result = await pool.query(
    `SELECT date_trunc($1, created_at)::date AS date, coalesce(sum(comments_posted_count), 0)::int AS count
     FROM review_events
     WHERE author_username = $2 AND provider = $3
       AND created_at >= $4 AND created_at <= $5
     GROUP BY date_trunc($1, created_at)
     ORDER BY date`,
    [dateTrunc, username, provider, fromDate, toDate],
  )
  const rows = result.rows ?? []

  return rows.map((r) => ({
    date:
      r.date instanceof Date
        ? r.date.toISOString().slice(0, 10)
        : String(r.date).slice(0, 10),
    count: Number(r.count),
  }))
}

/**
 * Repo-scoped overview metrics for repository health page.
 * @param {string} provider - 'github' | 'gitlab'
 * @param {string} repoId - repo_id (e.g. owner/repo for GitHub, numeric for GitLab)
 * @returns {Promise<{
 *   total: number
 *   reviewsThisWeek: number
 *   avgReviewTimeSeconds: number | null
 *   totalComments: number
 *   failedCount: number
 *   successRate: number | null
 *   repoName: string | null
 * }>}
 */
export async function getRepoOverview(provider, repoId) {
  const db = getDb()
  const pool = getPool()
  const baseConditions = and(
    eq(reviewEvents.provider, provider),
    eq(reviewEvents.repoId, repoId),
  )

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalRow] = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(baseConditions)
  const total = totalRow?.count ?? 0

  const [weekRow] = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(and(baseConditions, gte(reviewEvents.createdAt, sevenDaysAgo)))
  const reviewsThisWeek = weekRow?.count ?? 0

  const [avgRow] = await db
    .select({ avg: sql`avg(${reviewEvents.durationSeconds})::float` })
    .from(reviewEvents)
    .where(
      and(baseConditions, sql`${reviewEvents.durationSeconds} IS NOT NULL`),
    )
  const avgReviewTimeSeconds = avgRow?.avg != null ? Number(avgRow.avg) : null

  const [commentsRow] = await db
    .select({
      sum: sql`coalesce(sum(${reviewEvents.commentsPostedCount}), 0)::int`,
    })
    .from(reviewEvents)
    .where(baseConditions)
  const totalComments = commentsRow?.sum ?? 0

  const [failedRow] = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(and(baseConditions, eq(reviewEvents.status, 'failed')))
  const failedCount = failedRow?.count ?? 0

  const [completedRow] = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(and(baseConditions, eq(reviewEvents.status, 'completed')))
  const completedCount = completedRow?.count ?? 0
  const successRate = total > 0 ? (completedCount / total) * 100 : null

  const [nameRow] = await db
    .select({ repoName: reviewEvents.repoName })
    .from(reviewEvents)
    .where(baseConditions)
    .limit(1)
  const repoName = nameRow?.repoName ?? null

  return {
    total,
    reviewsThisWeek,
    avgReviewTimeSeconds,
    totalComments,
    failedCount,
    successRate,
    repoName,
  }
}

/**
 * Repo-scoped activity for charts (reviews per day/week).
 * @param {string} provider
 * @param {string} repoId
 * @param {{ from: string, to: string, bucket?: 'day' | 'week' }} params
 * @returns {Promise<Array<{ date: string, count: number }>>}
 */
export async function getRepoActivity(provider, repoId, params) {
  const { from, to, bucket = 'day' } = params
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const dateTrunc = bucket === 'week' ? 'week' : 'day'

  const pool = getPool()
  const result = await pool.query(
    `SELECT date_trunc($1, created_at)::date AS date, count(*)::int AS count
     FROM review_events
     WHERE provider = $2 AND repo_id = $3
       AND created_at >= $4 AND created_at <= $5
     GROUP BY date_trunc($1, created_at)
     ORDER BY date`,
    [dateTrunc, provider, repoId, fromDate, toDate],
  )
  const rows = result.rows ?? []

  return rows.map((r) => ({
    date:
      r.date instanceof Date
        ? r.date.toISOString().slice(0, 10)
        : String(r.date).slice(0, 10),
    count: Number(r.count),
  }))
}

/**
 * Contributors for a single repo (authors with PR count and comment count).
 * @param {string} provider
 * @param {string} repoId
 * @returns {Promise<Array<{ authorUsername: string | null, mrCount: number, commentCount: number, lastActivity: Date | null }>>}
 */
export async function listUsersByRepo(provider, repoId) {
  const pool = getPool()
  const result = await pool.query(
    `SELECT
       author_username AS "authorUsername",
       count(*)::int AS "mrCount",
       coalesce(sum(comments_posted_count), 0)::int AS "commentCount",
       max(updated_at) AS "lastActivity"
     FROM review_events
     WHERE provider = $1 AND repo_id = $2
     GROUP BY author_username
     ORDER BY count(*) DESC`,
    [provider, repoId],
  )
  const rows = result.rows ?? []
  return rows.map((r) => ({
    authorUsername: r.authorUsername,
    mrCount: Number(r.mrCount),
    commentCount: Number(r.commentCount),
    lastActivity:
      r.lastActivity instanceof Date
        ? r.lastActivity
        : r.lastActivity
          ? new Date(r.lastActivity)
          : null,
  }))
}

/**
 * Issue distribution for repo (MVP: reviews with 0 vs 1+ comments; no severity yet).
 * @param {string} provider
 * @param {string} repoId
 * @returns {Promise<{ reviewsWithNoIssues: number, reviewsWithIssues: number, totalComments: number }>}
 */
export async function getRepoIssueSummary(provider, repoId) {
  const db = getDb()
  const baseConditions = and(
    eq(reviewEvents.provider, provider),
    eq(reviewEvents.repoId, repoId),
  )

  const [noIssuesRow] = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(and(baseConditions, eq(reviewEvents.commentsPostedCount, 0)))
  const [withIssuesRow] = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(and(baseConditions, sql`${reviewEvents.commentsPostedCount} > 0`))
  const [commentsRow] = await db
    .select({
      sum: sql`coalesce(sum(${reviewEvents.commentsPostedCount}), 0)::int`,
    })
    .from(reviewEvents)
    .where(baseConditions)

  return {
    reviewsWithNoIssues: noIssuesRow?.count ?? 0,
    reviewsWithIssues: withIssuesRow?.count ?? 0,
    totalComments: commentsRow?.sum ?? 0,
  }
}

/**
 * Health score 0–10 and reasons for the repo.
 * @param {string} provider
 * @param {string} repoId
 * @returns {Promise<{ score: number, reasons: string[] }>}
 */
export async function getRepoHealthScore(provider, repoId) {
  const overview = await getRepoOverview(provider, repoId)
  const reasons = []
  let score = 5

  if (overview.total === 0) {
    return { score: 0, reasons: ['No review activity yet'] }
  }

  if (overview.reviewsThisWeek >= 5) {
    score += 1.5
    reasons.push('High PR activity this week')
  } else if (overview.reviewsThisWeek >= 1) {
    score += 0.5
    reasons.push('Some PR activity this week')
  } else {
    reasons.push('Low activity this week')
  }

  if (overview.successRate != null) {
    if (overview.successRate >= 95) {
      score += 2
      reasons.push('High review success rate')
    } else if (overview.successRate >= 80) {
      score += 1
      reasons.push('Good success rate')
    } else if (overview.successRate < 50) {
      score -= 1.5
      reasons.push('Many failed reviews')
    }
  }

  if (
    overview.avgReviewTimeSeconds != null &&
    overview.avgReviewTimeSeconds < 60
  ) {
    score += 1
    reasons.push('Fast average review time')
  } else if (
    overview.avgReviewTimeSeconds != null &&
    overview.avgReviewTimeSeconds > 120
  ) {
    score -= 0.5
    reasons.push('Slow average review time')
  }

  const commentsPerReview =
    overview.total > 0 ? overview.totalComments / overview.total : 0
  if (commentsPerReview > 20) {
    score -= 1
    reasons.push('Many AI issues per PR')
  } else if (commentsPerReview > 5) {
    reasons.push('Moderate AI feedback volume')
  }

  score = Math.max(0, Math.min(10, Math.round(score * 10) / 10))
  return { score, reasons }
}

/**
 * Retries/failures today and last failure reason for Retry Monitor.
 * @returns {Promise<{ retriesToday: number, lastFailure: { reason: string, at: Date } | null }>}
 */
export async function getRetriesToday() {
  const db = getDb()
  const startOfToday = new Date()
  startOfToday.setUTCHours(0, 0, 0, 0)

  const [countRow] = await db
    .select({ count: sql`count(*)::int` })
    .from(reviewEvents)
    .where(
      and(
        eq(reviewEvents.status, 'failed'),
        gte(reviewEvents.updatedAt, startOfToday),
      ),
    )
  const retriesToday = countRow?.count ?? 0

  const [lastRow] = await db
    .select({
      failureReason: reviewEvents.failureReason,
      updatedAt: reviewEvents.updatedAt,
    })
    .from(reviewEvents)
    .where(eq(reviewEvents.status, 'failed'))
    .orderBy(desc(reviewEvents.updatedAt))
    .limit(1)
  const lastFailure =
    lastRow != null
      ? {
          reason: lastRow.failureReason ?? 'Unknown',
          at:
            lastRow.updatedAt instanceof Date
              ? lastRow.updatedAt
              : new Date(lastRow.updatedAt),
        }
      : null

  return { retriesToday, lastFailure }
}

/**
 * Health scores for all repositories (for Repository Health list).
 * @returns {Promise<Array<{ provider: string, repoId: string, repoName: string, score: number, reasons: string[] }>>}
 */
export async function getReposHealthList() {
  const projects = await listProjects()
  const results = []
  for (const p of projects) {
    const health = await getRepoHealthScore(p.provider, p.repoId)
    results.push({
      provider: p.provider,
      repoId: p.repoId,
      repoName: p.repoName,
      score: health.score,
      reasons: health.reasons,
    })
  }
  results.sort((a, b) => b.score - a.score)
  return results
}

/**
 * PR complexity metrics (avg files, avg lines added, max lines added).
 * @param {{ provider?: string, repoId?: string }} filters - optional repo scope
 * @returns {Promise<{ avgFilesChanged: number, avgLinesAdded: number, maxLinesAdded: number, sampleSize: number }>}
 */
export async function getPrComplexity(filters = {}) {
  const db = getDb()
  const conditions = []
  if (filters.provider)
    conditions.push(eq(reviewEvents.provider, filters.provider))
  if (filters.repoId) conditions.push(eq(reviewEvents.repoId, filters.repoId))
  conditions.push(sql`${reviewEvents.filesChanged} IS NOT NULL`)
  conditions.push(sql`${reviewEvents.linesAdded} IS NOT NULL`)
  const where = and(...conditions)

  const [agg] = await db
    .select({
      avgFiles: sql`avg(${reviewEvents.filesChanged})::float`,
      avgLines: sql`avg(${reviewEvents.linesAdded})::float`,
      maxLines: sql`max(${reviewEvents.linesAdded})::int`,
      sampleSize: sql`count(*)::int`,
    })
    .from(reviewEvents)
    .where(where)
  const sampleSize = Number(agg?.sampleSize ?? 0)
  return {
    avgFilesChanged:
      sampleSize > 0 ? Math.round(Number(agg?.avgFiles ?? 0) * 10) / 10 : 0,
    avgLinesAdded: sampleSize > 0 ? Math.round(Number(agg?.avgLines ?? 0)) : 0,
    maxLinesAdded: Number(agg?.maxLines ?? 0),
    sampleSize,
  }
}

/**
 * Two review events for comparison (by id). Returns null for any missing id.
 * @param {number} id1
 * @param {number} id2
 * @returns {Promise<{ event1: import('../schema.js').reviewEvents.$inferSelect | null, event2: import('../schema.js').reviewEvents.$inferSelect | null }>}
 */
export async function getReviewCompare(id1, id2) {
  const db = getDb()
  const [e1, e2] = await Promise.all([
    db.select().from(reviewEvents).where(eq(reviewEvents.id, id1)).limit(1),
    db.select().from(reviewEvents).where(eq(reviewEvents.id, id2)).limit(1),
  ])
  return {
    event1: e1[0] ?? null,
    event2: e2[0] ?? null,
  }
}

/**
 * Smart alerts: review failure rate today vs 7-day baseline.
 * @returns {Promise<Array<{ id: string, message: string, severity: string }>>}
 */
export async function getAlerts() {
  const db = getDb()
  const pool = getPool()
  const alerts = []

  const startOfToday = new Date()
  startOfToday.setUTCHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const result = await pool.query(
    `SELECT
       count(*) FILTER (WHERE status = 'failed' AND updated_at >= $1)::int AS failed_today,
       count(*) FILTER (WHERE updated_at >= $1)::int AS total_today,
       count(*) FILTER (WHERE status = 'failed' AND updated_at >= $2)::int AS failed_7d,
       count(*) FILTER (WHERE updated_at >= $2)::int AS total_7d
     FROM review_events
     WHERE updated_at >= $2`,
    [startOfToday, sevenDaysAgo],
  )
  const r = result.rows?.[0]
  if (r) {
    const totalToday = Number(r.total_today ?? 0)
    const failedToday = Number(r.failed_today ?? 0)
    const total7d = Number(r.total_7d ?? 0)
    const failed7d = Number(r.failed_7d ?? 0)
    const rateToday = totalToday > 0 ? (failedToday / totalToday) * 100 : 0
    const rate7d = total7d > 0 ? (failed7d / total7d) * 100 : 0
    if (totalToday > 0 && rate7d < 100 && rateToday > rate7d * 1.2) {
      const pct = Math.round(((rateToday - rate7d) / rate7d) * 100)
      alerts.push({
        id: 'review-failures-spike',
        message: `Review failures increased by ${pct}% today compared to 7-day average.`,
        severity: 'warning',
      })
    }
  }

  return alerts
}
