import { detectProviderFromEvent } from '../../lib/webhookProvider.js'
import {
  getGitHubBotUser,
  listPullRequestReviewComments,
} from '../github.service.js'
import {
  getGitLabBotUser,
  getMergeRequest,
  listMergeRequestDiscussions,
} from '../gitlab.service.js'

/**
 * Get the set of (file, line) keys where we have already posted a review comment
 * on the current head commit. Used to avoid posting duplicate comments.
 * @param {object} event - Webhook payload (GitHub pull_request or GitLab merge_request)
 * @returns {Promise<Set<string>>} Set of "file:line" keys (e.g. "src/foo.js:42")
 */
export async function getExistingReviewComments(event) {
  const provider = detectProviderFromEvent(event)
  if (!provider) return new Set()

  if (provider === 'github') {
    return getExistingReviewCommentsGitHub(event)
  }
  if (provider === 'gitlab') {
    return getExistingReviewCommentsGitLab(event)
  }
  return new Set()
}

/**
 * @param {object} event - GitHub pull_request webhook
 * @returns {Promise<Set<string>>}
 */
async function getExistingReviewCommentsGitHub(event) {
  const repo = event?.repository?.full_name
  const pullNumber = event?.pull_request?.number
  const headSha = event?.pull_request?.head?.sha
  if (!repo || pullNumber == null || !headSha) return new Set()

  const [botUser, comments] = await Promise.all([
    getGitHubBotUser(),
    listPullRequestReviewComments(repo, pullNumber),
  ])

  const botLogin = botUser?.login
  if (!botLogin) return new Set()

  const keys = new Set()
  for (const c of comments) {
    if (c.commit_id !== headSha) continue
    if (!c.user || c.user.login !== botLogin) continue
    const path = c.path
    const line = c.line
    if (path != null && line != null) {
      keys.add(`${path}:${line}`)
    }
  }
  return keys
}

/**
 * @param {object} event - GitLab merge_request webhook
 * @returns {Promise<Set<string>>}
 */
async function getExistingReviewCommentsGitLab(event) {
  const projectId = event?.project?.id ?? event?.project_id
  const iid = event?.object_attributes?.iid
  if (projectId == null || iid == null) return new Set()

  const [mr, discussions, botUser] = await Promise.all([
    getMergeRequest(projectId, iid),
    listMergeRequestDiscussions(projectId, iid),
    getGitLabBotUser(),
  ])

  const headSha = mr?.diff_refs?.head_sha
  if (!headSha) return new Set()

  const botUsername = botUser?.username
  if (!botUsername) return new Set()

  const keys = new Set()
  for (const discussion of discussions) {
    const notes = discussion.notes || []
    for (const note of notes) {
      if (note.system) continue
      const author = note.author
      if (!author || author.username !== botUsername) continue
      const position = note.position
      if (!position || position.head_sha !== headSha) continue
      const path = position.new_path
      const line = position.new_line
      if (path != null && line != null) {
        keys.add(`${path}:${line}`)
      }
    }
  }
  return keys
}
