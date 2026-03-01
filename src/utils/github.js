import { env } from '../config/env.js'

const GITHUB_API = 'https://api.github.com'

/**
 * Create a pull request review with body and line-level comments.
 * Uses line + side (RIGHT = new file) for comment placement.
 * @param {object} params
 * @param {string} params.repoFullName - e.g. "owner/repo"
 * @param {number} params.pullNumber - PR number
 * @param {string} params.reviewBody - Markdown body for the review
 * @param {Array<{ file: string, line: number, body: string }>} params.comments - Line-level comments (path, line in new file, body)
 * @param {string} [params.commitId] - Head SHA of the PR (defaults to latest; pass for stability)
 */
export async function createPullRequestReview({
  repoFullName,
  pullNumber,
  reviewBody,
  comments,
  commitId,
}) {
  const token = env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set')
  }

  const [owner, repo] = repoFullName.split('/')
  if (!owner || !repo) {
    throw new Error('Invalid repo full name: ' + repoFullName)
  }

  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`
  const body = {
    commit_id: commitId || undefined,
    body: reviewBody,
    event: 'COMMENT',
    comments: (comments || []).map((c) => ({
      path: c.file,
      line: c.line,
      side: 'RIGHT',
      body: c.body,
    })),
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(
      `GitHub API ${response.status}: ${response.statusText} - ${errText}`,
    )
  }

  return response.json()
}
