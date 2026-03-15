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
  const data = (await res.json()) as { data: ActivityPoint[] }
  return data.data
}
