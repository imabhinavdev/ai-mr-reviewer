import { createPullRequestReview } from '../github.service.js'
import { getMergeRequest, createMergeRequestReview } from '../gitlab.service.js'

/**
 * Post review (summary + line comments) to the appropriate Git provider.
 * @param {object} params
 * @param {'github'|'gitlab'} params.provider
 * @param {object} params.event - Webhook event payload
 * @param {string} params.reviewBody
 * @param {Array<{ file: string, line: number, body: string }>} params.reviewComments
 */
export async function postReview({
  provider,
  event,
  reviewBody,
  reviewComments,
}) {
  const comments = (reviewComments || []).map((c) => ({
    file: c.file,
    line: c.line,
    body: c.body,
  }))

  if (provider === 'github') {
    const repo = event.repository?.full_name
    const pullNumber = event.pull_request?.number
    const commitId = event.pull_request?.head?.sha
    if (!repo || pullNumber == null) {
      throw new Error(
        'GitHub event missing repository.full_name or pull_request.number',
      )
    }
    await createPullRequestReview({
      repoFullName: repo,
      pullNumber,
      reviewBody,
      comments,
      commitId,
    })
    return
  }

  if (provider === 'gitlab') {
    const projectId = event.project?.id ?? event.project_id
    const iid = event.object_attributes?.iid
    if (projectId == null || iid == null) {
      throw new Error(
        'GitLab event missing project.id or object_attributes.iid',
      )
    }
    const mr = await getMergeRequest(projectId, iid)
    const diffRefs = mr.diff_refs
    if (!diffRefs) {
      throw new Error('GitLab MR missing diff_refs; cannot post line comments')
    }
    await createMergeRequestReview({
      projectId,
      iid,
      reviewBody,
      comments,
      diffRefs,
    })
    return
  }

  throw new Error(`Unknown provider: ${provider}`)
}
