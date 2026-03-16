import { inArray } from 'drizzle-orm'
import { getDb, getPool } from '../../config/db.js'
import { reviewFindings } from '../schema.js'

/**
 * Bulk insert findings for a review event. Caller may aggregate by (category, severity) and pass one row per group with count.
 * @param {number} reviewEventId
 * @param {Array<{ category: string, severity: string, count?: number }>} findings
 * @returns {Promise<void>}
 */
export async function insertReviewFindings(reviewEventId, findings) {
  if (!findings || findings.length === 0) return
  const db = getDb()
  await db.insert(reviewFindings).values(
    findings.map((f) => ({
      reviewEventId,
      category: f.category,
      severity: f.severity,
      count: typeof f.count === 'number' ? f.count : 1,
    })),
  )
}

/**
 * Global detection category counts (for Top Issue Categories).
 * @returns {Promise<Record<string, number>>}
 */
export async function getDetectionCategories() {
  const pool = getPool()
  const result = await pool.query(
    `SELECT category, coalesce(sum(count), 0)::int AS total
     FROM review_findings
     GROUP BY category
     ORDER BY total DESC`,
  )
  const rows = result.rows ?? []
  const out = {}
  for (const r of rows) {
    out[r.category] = Number(r.total)
  }
  return out
}

/**
 * Code quality insights for a user (category counts across their reviews).
 * @param {string} provider
 * @param {string} username
 * @returns {Promise<Record<string, number>>}
 */
export async function getUserCodeQualityInsights(provider, username) {
  const pool = getPool()
  const result = await pool.query(
    `SELECT rf.category, coalesce(sum(rf.count), 0)::int AS total
     FROM review_findings rf
     JOIN review_events re ON re.id = rf.review_event_id
     WHERE re.provider = $1 AND re.author_username = $2
     GROUP BY rf.category
     ORDER BY total DESC`,
    [provider, username],
  )
  const rows = result.rows ?? []
  const out = {}
  for (const r of rows) {
    out[r.category] = Number(r.total)
  }
  return out
}

/**
 * Global code quality insights (aggregate category counts across all reviews).
 * @returns {Promise<Record<string, number>>}
 */
export async function getGlobalCodeQualityInsights() {
  return getDetectionCategories()
}

/**
 * Findings summary for specific review events (for compare endpoint).
 * @param {number[]} reviewEventIds
 * @returns {Promise<Record<number, Array<{ category: string, severity: string, count: number }>>>}
 */
export async function getFindingsByReviewEventIds(reviewEventIds) {
  if (!reviewEventIds.length) return {}
  const db = getDb()
  const rows = await db
    .select({
      reviewEventId: reviewFindings.reviewEventId,
      category: reviewFindings.category,
      severity: reviewFindings.severity,
      count: reviewFindings.count,
    })
    .from(reviewFindings)
    .where(inArray(reviewFindings.reviewEventId, reviewEventIds))
  const byEvent = {}
  for (const r of rows) {
    const id = r.reviewEventId
    if (!byEvent[id]) byEvent[id] = []
    byEvent[id].push({ category: r.category, severity: r.severity, count: r.count })
  }
  return byEvent
}
