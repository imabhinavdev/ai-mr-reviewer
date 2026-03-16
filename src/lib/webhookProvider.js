/** GitHub pull_request actions we process: PR opened or new commits pushed. */
const GITHUB_ACTIONS = new Set(['opened', 'synchronize'])

/** GitLab merge_request actions we process: MR opened, reopened, or new commits. */
const GITLAB_ACTIONS = new Set(['open', 'reopen', 'update'])

/**
 * Whether this webhook event should trigger a review (only PR/MR opened or sync).
 * @param {'github'|'gitlab'} provider
 * @param {object} event - Parsed webhook event
 * @returns {boolean}
 */
export function isReviewableAction(provider, event) {
  if (provider === 'github') {
    const action = event?.action
    return typeof action === 'string' && GITHUB_ACTIONS.has(action)
  }
  if (provider === 'gitlab') {
    const action = event?.object_attributes?.action
    return typeof action === 'string' && GITLAB_ACTIONS.has(action)
  }
  return false
}

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
 * Extract repo and author for analytics (review_events).
 * @param {'github'|'gitlab'} provider
 * @param {object} event
 * @returns {{ repoId: string, repoName: string, authorUsername: string | null }}
 */
export function getReviewEventPayload(provider, event) {
  if (provider === 'github') {
    return {
      repoId: event?.repository?.full_name ?? '',
      repoName: event?.repository?.full_name ?? '',
      authorUsername: event?.pull_request?.user?.login ?? null,
    }
  }
  if (provider === 'gitlab') {
    const projectId = event?.project?.id ?? event?.project_id
    return {
      repoId: projectId != null ? String(projectId) : '',
      repoName: event?.project?.path_with_namespace ?? String(projectId ?? ''),
      authorUsername: event?.user?.username ?? null,
    }
  }
  return { repoId: '', repoName: '', authorUsername: null }
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
