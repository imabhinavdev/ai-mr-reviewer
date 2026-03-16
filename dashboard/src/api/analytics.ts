const API_BASE = import.meta.env.VITE_API_BASE ?? ''

function getToken(): string | null {
  return localStorage.getItem('dashboard_token')
}

function headers(): Record<string, string> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export interface OverviewData {
  total: number
  byStatus: { queued: number; completed: number; failed: number }
  totalComments: number
  last7Days: number
  last30Days: number
  reviewsToday?: number
  avgReviewTimeSeconds?: number | null
  activeProjects?: number
}

export async function fetchOverview(): Promise<OverviewData> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/overview`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch overview')
  const data = (await res.json()) as { data: OverviewData }
  return data.data
}

export interface ReviewEvent {
  id: number
  provider: string
  repoId: string
  repoName: string
  mrNumber: number
  authorUsername: string | null
  status: string
  commentsPostedCount: number
  createdAt: string
  updatedAt?: string
  aiProvider?: string
  durationSeconds?: number
  failureReason?: string
  filesChanged?: number
  linesAdded?: number
  linesRemoved?: number
  queuedAt?: string
  diffFetchedAt?: string
  aiStartedAt?: string
  commentsPostedAt?: string
}

export interface EventsResponse {
  events: ReviewEvent[]
  total: number
  limit: number
  offset: number
}

export interface EventsParams {
  limit?: number
  offset?: number
  page?: number
  provider?: string
  repo?: string
  status?: string
  from?: string
  to?: string
}

export async function fetchEvents(params: EventsParams = {}): Promise<EventsResponse> {
  const search: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search[k] = String(v)
  }
  const q = new URLSearchParams(search).toString()
  const res = await fetch(`${API_BASE}/api/v1/analytics/events?${q}`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch events')
  const data = (await res.json()) as { data: EventsResponse }
  return data.data
}

export interface ReviewEventDetail extends ReviewEvent {
  updatedAt?: string
  aiProvider?: string
  durationSeconds?: number
  failureReason?: string
}

export async function fetchReviewEvent(id: number): Promise<ReviewEventDetail> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/events/${id}`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch review')
  const json = (await res.json()) as { data: ReviewEventDetail }
  return json.data
}

export interface ProjectRow {
  repoId: string
  repoName: string
  provider: string
  mrCount: number
  commentCount: number
}

export async function fetchProjects(): Promise<ProjectRow[]> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/projects`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch projects')
  const data = (await res.json()) as { data: ProjectRow[] }
  return data.data
}

export interface UserRow {
  authorUsername: string | null
  provider: string
  mrCount: number
  commentCount: number
  repositories: string[]
  lastActivity: string | null
}

export async function fetchUsers(): Promise<UserRow[]> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/users`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  const data = (await res.json()) as { data: UserRow[] }
  return data.data
}

export interface ActivityPoint {
  date: string
  count: number
}

export interface ActivityParams {
  from?: string
  to?: string
  bucket?: 'day' | 'week'
}

export interface UserProfileRepo {
  repoName: string
  repoId: string
  mrCount: number
  commentCount: number
  lastContribution: string | null
}

export interface UserProfileData {
  username: string
  provider: string
  repoCount: number
  totalPRs: number
  totalComments: number
  firstSeen: string | null
  lastActivity: string | null
  prsWithIssues: number
  avgIssuesPerPR: number
  fullName?: string | null
  totalErrors?: number
  totalWarnings?: number
  repos: UserProfileRepo[]
  recentReviews: ReviewEvent[]
  activity: ActivityPoint[]
  issuesActivity?: ActivityPoint[]
}

export async function fetchUserProfile(provider: string, username: string): Promise<UserProfileData> {
  const encoded = `${encodeURIComponent(provider)}/${encodeURIComponent(username)}`
  const res = await fetch(`${API_BASE}/api/v1/analytics/users/${encoded}`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch user profile')
  const json = (await res.json()) as { data: UserProfileData }
  return json.data
}

export async function fetchActivity(params: ActivityParams = {}): Promise<ActivityPoint[]> {
  const search: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search[k] = String(v)
  }
  const q = new URLSearchParams(search).toString()
  const res = await fetch(`${API_BASE}/api/v1/analytics/activity?${q}`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch activity')
  const json = (await res.json()) as { data?: ActivityPoint[] }
  const data = json.data
  if (!Array.isArray(data)) {
    if (import.meta.env.DEV) console.warn('[analytics] Activity response data is not an array:', typeof data)
    return []
  }
  return data
}

// --- Repository-scoped (repo health page) ---

export interface RepoOverviewData {
  total: number
  reviewsThisWeek: number
  avgReviewTimeSeconds: number | null
  totalComments: number
  failedCount: number
  successRate: number | null
  repoName: string | null
}

export function repoPath(provider: string, repoId: string): string {
  return `${encodeURIComponent(provider)}/${encodeURIComponent(repoId)}`
}

export async function fetchRepoOverview(provider: string, repoId: string): Promise<RepoOverviewData> {
  const path = repoPath(provider, repoId)
  const res = await fetch(`${API_BASE}/api/v1/analytics/repositories/${path}/overview`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch repo overview')
  const json = (await res.json()) as { data: RepoOverviewData }
  return json.data
}

export async function fetchRepoActivity(
  provider: string,
  repoId: string,
  params: ActivityParams = {}
): Promise<ActivityPoint[]> {
  const path = repoPath(provider, repoId)
  const search: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search[k] = String(v)
  }
  const q = new URLSearchParams(search).toString()
  const res = await fetch(`${API_BASE}/api/v1/analytics/repositories/${path}/activity?${q}`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch repo activity')
  const json = (await res.json()) as { data?: ActivityPoint[] }
  const data = json.data
  if (!Array.isArray(data)) {
    if (import.meta.env.DEV) console.warn('[analytics] Repo activity response data is not an array:', typeof data)
    return []
  }
  return data
}

export interface RepoContributor {
  authorUsername: string | null
  mrCount: number
  commentCount: number
  lastActivity: string | null
}

export async function fetchRepoContributors(
  provider: string,
  repoId: string
): Promise<RepoContributor[]> {
  const path = repoPath(provider, repoId)
  const res = await fetch(`${API_BASE}/api/v1/analytics/repositories/${path}/contributors`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch repo contributors')
  const json = (await res.json()) as { data: RepoContributor[] }
  return json.data
}

export interface RepoIssueSummary {
  reviewsWithNoIssues: number
  reviewsWithIssues: number
  totalComments: number
}

export async function fetchRepoIssueSummary(
  provider: string,
  repoId: string
): Promise<RepoIssueSummary> {
  const path = repoPath(provider, repoId)
  const res = await fetch(`${API_BASE}/api/v1/analytics/repositories/${path}/issues`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch repo issue summary')
  const json = (await res.json()) as { data: RepoIssueSummary }
  return json.data
}

export interface RepoHealthScore {
  score: number
  reasons: string[]
}

export async function fetchRepoHealthScore(
  provider: string,
  repoId: string
): Promise<RepoHealthScore> {
  const path = repoPath(provider, repoId)
  const res = await fetch(`${API_BASE}/api/v1/analytics/repositories/${path}/health`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch repo health score')
  const json = (await res.json()) as { data: RepoHealthScore }
  return json.data
}

export interface RepoRulesData {
  content: string
}

export async function fetchRepoRules(
  provider: string,
  repoId: string
): Promise<RepoRulesData | null> {
  const path = repoPath(provider, repoId)
  const res = await fetch(`${API_BASE}/api/v1/analytics/repositories/${path}/rules`, {
    headers: headers(),
    credentials: 'include',
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const msg = (await res.json()).catch(() => ({})) as { message?: string }
    throw new Error(msg.message ?? 'Failed to fetch repo rules')
  }
  const json = (await res.json()) as { data: RepoRulesData }
  return json.data
}

export interface AlertItem {
  id: string
  message: string
  severity: string
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/alerts`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) return []
  const json = (await res.json()) as { data: { alerts: AlertItem[] } }
  return json.data?.alerts ?? []
}

export interface RepoHealthItem {
  provider: string
  repoId: string
  repoName: string
  score: number
  reasons: string[]
}

export async function fetchReposHealthList(): Promise<RepoHealthItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/repositories/health`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch repositories health')
  const json = (await res.json()) as { data: RepoHealthItem[] }
  return json.data
}

export async function fetchDetectionCategories(): Promise<Record<string, number>> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/insights/detection-categories`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) return {}
  const json = (await res.json()) as { data: Record<string, number> }
  return json.data ?? {}
}

export async function fetchCodeQualityInsights(): Promise<{ categories: Record<string, number> }> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/insights/code-quality`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) return { categories: {} }
  const json = (await res.json()) as { data: { categories: Record<string, number> } }
  return json.data ?? { categories: {} }
}

export interface PrComplexityData {
  avgFilesChanged: number
  avgLinesAdded: number
  maxLinesAdded: number
  sampleSize: number
}

export async function fetchPrComplexity(params?: {
  provider?: string
  repoId?: string
}): Promise<PrComplexityData> {
  const url = new URL(`${API_BASE}/api/v1/analytics/pr-complexity`)
  if (params?.provider) url.searchParams.set('provider', params.provider)
  if (params?.repoId) url.searchParams.set('repoId', params.repoId)
  const res = await fetch(url.toString(), { headers: headers(), credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch PR complexity')
  const json = (await res.json()) as { data: PrComplexityData }
  return json.data
}

export interface ReviewCompareEvent {
  id: number
  provider: string
  repoName: string
  mrNumber: number
  status: string
  commentsPostedCount: number
  findings: Array<{ category: string; severity: string; count: number }>
}

export async function fetchReviewCompare(
  id1: number,
  id2: number
): Promise<{ event1: ReviewCompareEvent; event2: ReviewCompareEvent }> {
  const url = new URL(`${API_BASE}/api/v1/analytics/reviews/compare`)
  url.searchParams.set('id1', String(id1))
  url.searchParams.set('id2', String(id2))
  const res = await fetch(url.toString(), { headers: headers(), credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch review comparison')
  const json = (await res.json()) as { data: { event1: ReviewCompareEvent; event2: ReviewCompareEvent } }
  return json.data
}

export async function fetchUserInsights(
  provider: string,
  username: string
): Promise<{ categories: Record<string, number> }> {
  const encoded = `${encodeURIComponent(provider)}/${encodeURIComponent(username)}`
  const res = await fetch(`${API_BASE}/api/v1/analytics/users/${encoded}/insights`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) return { categories: {} }
  const json = (await res.json()) as { data: { categories: Record<string, number> } }
  return json.data ?? { categories: {} }
}
