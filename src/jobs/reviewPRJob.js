import { getDiffFromEvent } from '../services/review/getDiffFromEvent.js'
import { filterReviewableDiff } from '../services/review/filterReviewableDiff.js'
import { extractReviewableLines } from '../services/review/extractReviewableLines.js'
import { chunkReviewableLines } from '../services/review/chunkReviewableLines.js'
import { reviewChunkWithGemini } from '../services/review/reviewChunkWithGemini.js'
import { mergeReviewChunks } from '../services/review/mergeReviewChunks.js'
import { createPullRequestReview } from '../services/github.service.js'
import { logger } from '../config/logger.js'

/**
 * Run the full PR review pipeline in the background.
 * @param {object} event - GitHub webhook payload (pull_request event)
 */
export async function runReviewPRJob(event) {
  const repo = event?.repository?.full_name
  const prNumber = event?.pull_request?.number
  const headSha = event?.pull_request?.head?.sha

  if (!repo || prNumber == null) {
    logger.warn(
      { repo, prNumber },
      'Review job skipped: missing repository or PR number',
    )
    return
  }

  try {
    const diffFiles = await getDiffFromEvent(event)
    const filtered = filterReviewableDiff(diffFiles)
    const lines = extractReviewableLines(filtered)

    if (lines.length === 0) {
      logger.info(
        { repo, prNumber },
        'No reviewable added lines; skipping review',
      )
      return
    }

    const chunks = chunkReviewableLines(lines)
    const chunkResults = []

    for (let i = 0; i < chunks.length; i++) {
      const result = await reviewChunkWithGemini(chunks[i], i)
      chunkResults.push(result)
    }

    const { reviewBody, reviewComments } = mergeReviewChunks(chunkResults)

    const commentsForGitHub = reviewComments.map((c) => ({
      file: c.file,
      line: c.line,
      body: `**[${c.severity}]** ${c.body}`,
    }))

    await createPullRequestReview({
      repoFullName: repo,
      pullNumber: prNumber,
      reviewBody,
      comments: commentsForGitHub,
      commitId: headSha,
    })

    logger.info(
      { repo, prNumber, commentCount: commentsForGitHub.length },
      'PR review posted',
    )
  } catch (err) {
    logger.error({ err, repo, prNumber }, 'PR review job failed')
    throw err
  }
}
