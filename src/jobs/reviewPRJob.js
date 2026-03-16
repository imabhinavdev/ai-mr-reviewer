import { getDiffFromEvent } from '../services/review/getDiffFromEvent.js'
import { filterReviewableDiff } from '../services/review/filterReviewableDiff.js'
import { getReviewChunks } from '../services/review/getReviewChunks.js'
import { getReviewRules } from '../services/review/getReviewRules.js'
import { reviewChunkWithAI } from '../services/review/reviewChunkWithAI.js'
import { mergeReviewChunks } from '../services/review/mergeReviewChunks.js'
import { getExistingReviewComments } from '../services/review/getExistingReviewComments.js'
import { postReview } from '../services/review/postReview.js'
import { detectProviderFromEvent } from '../lib/webhookProvider.js'
import { logger } from '../config/logger.js'
import { isDbConfigured } from '../config/db.js'
import { updateReviewEventByBullmqJobId } from '../db/repositories/reviewEvents.js'

/** Default: only error and warning. If rules mention suggestions/info, allow those too. */
const DEFAULT_SEVERITIES = ['error', 'warning']
const ALL_SEVERITIES = ['error', 'warning', 'info', 'suggestion']

/**
 * @param {Array<{ file: string, hunks?: Array<{ addedLines?: Array<unknown>, removedLines?: Array<unknown> }> }>} diffFiles
 * @returns {{ filesChanged: number, linesAdded: number, linesRemoved: number }}
 */
function computeComplexity(diffFiles) {
  if (!Array.isArray(diffFiles))
    return { filesChanged: 0, linesAdded: 0, linesRemoved: 0 }
  let linesAdded = 0
  let linesRemoved = 0
  for (const f of diffFiles) {
    const hunks = f?.hunks ?? []
    for (const h of hunks) {
      linesAdded += h.addedLines?.length ?? 0
      linesRemoved += h.removedLines?.length ?? 0
    }
  }
  return {
    filesChanged: diffFiles.length,
    linesAdded,
    linesRemoved,
  }
}

/**
 * @param {Array<{ category?: string, severity: string }>} comments
 * @returns {Array<{ category: string, severity: string, count: number }>}
 */
function aggregateFindings(comments) {
  const map = new Map()
  for (const c of comments) {
    const key = `${c.category ?? 'other'}:${c.severity}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([key, count]) => {
    const [category, severity] = key.split(':')
    return { category, severity, count }
  })
}

/**
 * @param {string} rules - Content of .nirik/rules.md
 * @returns {boolean} true if rules explicitly ask for info or suggestions
 */
function rulesAllowInfoOrSuggestion(rules) {
  if (!rules || !String(rules).trim()) return false
  const r = String(rules).toLowerCase()
  return /suggestion|info|hints/.test(r)
}

/**
 * Run the full PR/MR review pipeline in the background.
 * @param {object} event - Webhook payload (GitHub pull_request or GitLab merge_request)
 * @param {{ jobId?: string }} [jobMeta] - Optional job metadata from the queue worker
 * @returns {Promise<{ commentsPosted: number, findings?: Array<{ category: string, severity: string, count: number }>, filesChanged?: number, linesAdded?: number, linesRemoved?: number } | undefined>}
 */
export async function runReviewPRJob(event, jobMeta = {}) {
  const provider = detectProviderFromEvent(event)
  if (!provider) {
    logger.warn(
      { event: !!event, jobId: jobMeta.jobId },
      'Review job skipped: unknown webhook payload',
    )
    return undefined
  }

  const repoLabel =
    provider === 'github'
      ? event?.repository?.full_name
      : (event?.project?.path_with_namespace ?? event?.project_id)
  const mrNumber =
    provider === 'github'
      ? event?.pull_request?.number
      : event?.object_attributes?.iid

  const jobKey = `${provider}:${repoLabel ?? 'unknown'}:${mrNumber ?? 'unknown'}`

  if (!repoLabel || mrNumber == null) {
    logger.warn(
      { provider, repoLabel, mrNumber, jobId: jobMeta.jobId, jobKey },
      'Review job skipped: missing repo or MR/PR identifier',
    )
    return undefined
  }

  try {
    const [diffResult, customRules] = await Promise.all([
      getDiffFromEvent(event),
      getReviewRules(event),
    ])
    const diffFiles = diffResult.diffFiles ?? diffResult
    const diffRefs = diffResult.diffRefs ?? null

    logger.info(
      {
        provider,
        repoLabel,
        mrNumber,
        jobId: jobMeta.jobId,
        jobKey,
        diffFileCount: Array.isArray(diffFiles) ? diffFiles.length : 0,
        hasDiffRefs: !!diffRefs,
      },
      'Diff loaded',
    )

    const complexity = computeComplexity(
      Array.isArray(diffFiles) ? diffFiles : [],
    )
    if (isDbConfigured() && jobMeta.jobId) {
      try {
        await updateReviewEventByBullmqJobId(jobMeta.jobId, {
          diffFetchedAt: new Date(),
          filesChanged: complexity.filesChanged,
          linesAdded: complexity.linesAdded,
          linesRemoved: complexity.linesRemoved,
        })
      } catch (err) {
        logger.warn(
          { err, jobId: jobMeta.jobId },
          'Failed to update review event (diff fetched)',
        )
      }
    }

    const filtered = filterReviewableDiff(diffFiles)
    const chunks = getReviewChunks(filtered)

    if (chunks.length === 0) {
      logger.info(
        {
          provider,
          repoLabel,
          mrNumber,
          jobId: jobMeta.jobId,
          jobKey,
          commented: false,
          reason: 'no_reviewable_lines',
        },
        'No reviewable hunks; skipping review (nothing commented)',
      )
      return {
        commentsPosted: 0,
        findings: [],
        filesChanged: complexity.filesChanged,
        linesAdded: complexity.linesAdded,
        linesRemoved: complexity.linesRemoved,
      }
    }

    if (isDbConfigured() && jobMeta.jobId) {
      try {
        await updateReviewEventByBullmqJobId(jobMeta.jobId, {
          aiStartedAt: new Date(),
        })
      } catch (err) {
        logger.warn(
          { err, jobId: jobMeta.jobId },
          'Failed to update review event (AI started)',
        )
      }
    }

    const chunkResults = []

    for (let i = 0; i < chunks.length; i++) {
      const result = await reviewChunkWithAI(chunks[i], i, { customRules })
      chunkResults.push(result)
    }

    const { reviewBody, reviewComments } = mergeReviewChunks(chunkResults)

    const allowedSeverities = rulesAllowInfoOrSuggestion(customRules)
      ? ALL_SEVERITIES
      : DEFAULT_SEVERITIES
    const filteredComments = reviewComments.filter((c) =>
      allowedSeverities.includes(c.severity),
    )
    const findings = aggregateFindings(filteredComments)

    const commentsForGit = filteredComments.map((c) => ({
      file: c.file,
      line: c.line,
      body: `**[${c.severity}]** ${c.body}`,
    }))

    const existingKeys = await getExistingReviewComments(event)
    const commentsToPost = commentsForGit.filter((c) => {
      const key = `${c.file}:${c.line}`
      return !existingKeys.has(key)
    })

    if (commentsToPost.length === 0) {
      logger.info(
        {
          provider,
          repoLabel,
          mrNumber,
          jobId: jobMeta.jobId,
          jobKey,
          commented: false,
          reason: 'all_already_exist',
          note: 'Likely a repeat webhook for the same diff; all findings already commented from a previous run',
          totalFindings: commentsForGit.length,
        },
        'No new findings; skipping post (all comments already exist; nothing commented)',
      )
      if (isDbConfigured() && jobMeta.jobId) {
        try {
          await updateReviewEventByBullmqJobId(jobMeta.jobId, {
            commentsPostedAt: new Date(),
          })
        } catch (_) {}
      }
      return {
        commentsPosted: 0,
        findings,
        filesChanged: complexity.filesChanged,
        linesAdded: complexity.linesAdded,
        linesRemoved: complexity.linesRemoved,
      }
    }

    logger.info(
      {
        provider,
        repoLabel,
        mrNumber,
        jobId: jobMeta.jobId,
        jobKey,
        commentCount: commentsToPost.length,
        skipped: commentsForGit.length - commentsToPost.length,
      },
      'Posting review to GitLab',
    )

    await postReview({
      provider,
      event,
      reviewBody,
      reviewComments: commentsToPost,
      diffRefs,
    })

    if (isDbConfigured() && jobMeta.jobId) {
      try {
        await updateReviewEventByBullmqJobId(jobMeta.jobId, {
          commentsPostedAt: new Date(),
        })
      } catch (_) {}
    }

    logger.info(
      {
        provider,
        repoLabel,
        mrNumber,
        jobId: jobMeta.jobId,
        jobKey,
        commented: true,
        commentCount: commentsToPost.length,
        skipped: commentsForGit.length - commentsToPost.length,
      },
      'Review posted successfully (summary + line comments)',
    )
    return {
      commentsPosted: commentsToPost.length,
      findings,
      filesChanged: complexity.filesChanged,
      linesAdded: complexity.linesAdded,
      linesRemoved: complexity.linesRemoved,
    }
  } catch (err) {
    logger.error(
      {
        err,
        provider,
        repoLabel,
        mrNumber,
        jobId: jobMeta.jobId,
        jobKey,
        commented: false,
        reason: 'job_failed',
      },
      'Review job failed (nothing commented)',
    )
    throw err
  }
}
