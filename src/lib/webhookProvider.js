/**
 * Detect Git provider from webhook payload and return provider + validated event.
 * @param {object} body - Raw webhook body
 * @returns {{ provider: 'github' | 'gitlab', event: object }}
 * @throws {Error} If payload is invalid or unknown provider
 */
export function detectAndValidateWebhook(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid webhook payload')
  }

  // GitHub: pull_request event
  if (
    body.pull_request &&
    body.repository?.full_name &&
    typeof body.pull_request.number === 'number'
  ) {
    return { provider: 'github', event: body }
  }

  // GitLab: merge_request hook
  if (
    body.object_kind === 'merge_request' &&
    (body.project?.id != null || body.project_id != null) &&
    body.object_attributes?.iid != null
  ) {
    return { provider: 'gitlab', event: body }
  }

  throw new Error(
    'Unknown or invalid webhook payload (expected GitHub pull_request or GitLab merge_request)',
  )
}

/**
 * Build a dedupe-friendly job ID for the queue.
 * @param {'github'|'gitlab'} provider
 * @param {object} event
 * @returns {string|undefined}
 */
export function getReviewJobId(provider, event) {
  const safe = (value) => String(value).replaceAll(':', '_')

  if (provider === 'github') {
    const repo = event?.repository?.full_name
    const pr = event?.pull_request?.number
    return repo && pr != null ? `github_${safe(repo)}_${safe(pr)}` : undefined
  }
  if (provider === 'gitlab') {
    const projectId = event?.project?.id ?? event?.project_id
    const iid = event?.object_attributes?.iid
    return projectId != null && iid != null
      ? `gitlab_${safe(projectId)}_${safe(iid)}`
      : undefined
  }
  return undefined
}

/**
 * Detect provider from event shape (for use in job).
 * @param {object} event
 * @returns {'github'|'gitlab'|null}
 */
export function detectProviderFromEvent(event) {
  if (!event || typeof event !== 'object') return null
  if (event.pull_request && event.repository?.full_name) return 'github'
  if (
    event.object_kind === 'merge_request' &&
    (event.project?.id != null || event.project_id != null) &&
    event.object_attributes?.iid != null
  ) {
    return 'gitlab'
  }
  return null
}
