import { env } from '../config/env.js'

function getBaseUrl() {
  return (env.GITLAB_URL || 'https://gitlab.com').replace(/\/$/, '')
}

function getToken() {
  const t = env.GITLAB_TOKEN ?? env.GITLAB_PRIVATE_TOKEN
  if (!t)
    throw new Error(
      'GITLAB_TOKEN or GITLAB_PRIVATE_TOKEN is required for GitLab',
    )
  return t
}

function glFetch(path, options = {}) {
  const url = `${getBaseUrl()}${path}`
  const token = getToken()
  return fetch(url, {
    ...options,
    headers: {
      'PRIVATE-TOKEN': token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

/**
 * Fetch merge request to get diff_refs for positioning comments.
 * @param {string|number} projectId
 * @param {number} iid
 * @returns {Promise<{ diff_refs: { base_sha: string, start_sha: string, head_sha: string } }>}
 */
export async function getMergeRequest(projectId, iid) {
  const encodedId = encodeURIComponent(projectId)
  const res = await glFetch(
    `/api/v4/projects/${encodedId}/merge_requests/${iid}`,
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitLab MR fetch failed: ${res.status} ${text}`)
  }
  return res.json()
}

/**
 * Post a merge request discussion (summary or line comment).
 * @param {object} params
 * @param {string|number} params.projectId
 * @param {number} params.iid
 * @param {string} params.body
 * @param {object} [params.position] - For line-level: { position_type, new_path, new_line, old_path, old_line, base_sha, start_sha, head_sha }
 */
export async function createDiscussion(projectId, iid, body, position = null) {
  const encodedId = encodeURIComponent(projectId)
  const payload = { body }
  if (position) {
    payload.position = position
  }
  const res = await glFetch(
    `/api/v4/projects/${encodedId}/merge_requests/${iid}/discussions`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitLab discussion create failed: ${res.status} ${text}`)
  }
  return res.json()
}

/**
 * Create a full MR review: one discussion for summary, then one discussion per line comment with position.
 * @param {object} params
 * @param {string|number} params.projectId
 * @param {number} params.iid
 * @param {string} params.reviewBody
 * @param {Array<{ file: string, line: number, body: string }>} params.comments
 * @param {object} params.diffRefs - { base_sha, start_sha, head_sha }
 */
export async function createMergeRequestReview({
  projectId,
  iid,
  reviewBody,
  comments,
  diffRefs,
}) {
  if (!diffRefs?.base_sha || !diffRefs?.start_sha || !diffRefs?.head_sha) {
    throw new Error(
      'diff_refs (base_sha, start_sha, head_sha) required for GitLab line comments',
    )
  }

  await createDiscussion(projectId, iid, reviewBody, null)

  for (const c of comments || []) {
    const position = {
      position_type: 'text',
      new_path: c.file,
      new_line: c.line,
      old_path: c.file,
      old_line: c.line,
      base_sha: diffRefs.base_sha,
      start_sha: diffRefs.start_sha,
      head_sha: diffRefs.head_sha,
    }
    await createDiscussion(projectId, iid, c.body, position)
  }
}
