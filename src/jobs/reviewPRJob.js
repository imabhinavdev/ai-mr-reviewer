import { getDiffFromEvent } from '../services/review/getDiffFromEvent.js'
import { filterReviewableDiff } from '../services/review/filterReviewableDiff.js'
import { extractReviewableLines } from '../services/review/extractReviewableLines.js'
import { chunkReviewableLines } from '../services/review/chunkReviewableLines.js'
import { reviewChunkWithAI } from '../services/review/reviewChunkWithAI.js'
import { mergeReviewChunks } from '../services/review/mergeReviewChunks.js'
import { postReview } from '../services/review/postReview.js'
import { detectProviderFromEvent } from '../lib/webhookProvider.js'
import { logger } from '../config/logger.js'

/**
 * Run the full PR/MR review pipeline in the background.
 * @param {object} event - Webhook payload (GitHub pull_request or GitLab merge_request)
 */
export async function runReviewPRJob(event) {
  const provider = detectProviderFromEvent(event)
  if (!provider) {
    logger.warn(
      { event: !!event },
      'Review job skipped: unknown webhook payload',
    )
    return
  }

  const repoLabel =
    provider === 'github'
      ? event?.repository?.full_name
      : (event?.project?.path_with_namespace ?? event?.project_id)
  const mrNumber =
    provider === 'github'
      ? event?.pull_request?.number
      : event?.object_attributes?.iid

  if (!repoLabel || mrNumber == null) {
    logger.warn(
      { provider, repoLabel, mrNumber },
      'Review job skipped: missing repo or MR/PR identifier',
    )
    return
  }

  try {
    const diffFiles = await getDiffFromEvent(event)
    const filtered = filterReviewableDiff(diffFiles)
    const lines = extractReviewableLines(filtered)

    if (lines.length === 0) {
      logger.info(
        { provider, repoLabel, mrNumber },
        'No reviewable added lines; skipping review',
      )
      return
    }

    const chunks = chunkReviewableLines(lines)
    const chunkResults = []

    for (let i = 0; i < chunks.length; i++) {
      const result = await reviewChunkWithAI(chunks[i], i)
      chunkResults.push(result)
    }

    const { reviewBody, reviewComments } = mergeReviewChunks(chunkResults)

    const commentsForGit = reviewComments.map((c) => ({
      file: c.file,
      line: c.line,
      body: `**[${c.severity}]** ${c.body}`,
    }))

    await postReview({
      provider,
      event,
      reviewBody,
      reviewComments: commentsForGit,
    })

    logger.info(
      { provider, repoLabel, mrNumber, commentCount: commentsForGit.length },
      'Review posted',
    )
  } catch (err) {
    logger.error({ err, provider, repoLabel, mrNumber }, 'Review job failed')
    throw err
  }
}
