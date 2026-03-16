import { setToken } from './auth'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''
const LOGIN_PATH = '/login'

/** Build absolute URL for API; works when API_BASE is empty (same-origin). */
function apiUrl(path: string): URL {
  const base = API_BASE ? API_BASE.replace(/\/$/, '') : window.location.origin
  return new URL(path.startsWith('/') ? path : `/${path}`, base)
}

function getToken(): string | null {
  return localStorage.getItem('dashboard_token')
}

function handleUnauthorized(): void {
  setToken(null)
  window.location.assign(LOGIN_PATH)
}

function headers(): Record<string, string> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export interface QueueStatus {
  waiting?: number
  pending?: number
  active?: number
  completed?: number
  failed?: number
  delayed?: number
  workers?: number
  repo?: string
}

export async function fetchQueueStatus(params?: {
  repo?: string
}): Promise<QueueStatus> {
  const url = apiUrl('/api/v1/queue/status')
  if (params?.repo) url.searchParams.set('repo', params.repo)
  const res = await fetch(url.toString(), {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) {
    if (res.status === 401) {
      handleUnauthorized()
    }
    let message = 'Failed to fetch queue status'
    try {
      const body = (await res.json()) as { message?: string }
      if (typeof body?.message === 'string' && body.message.trim()) {
        message = body.message
      }
    } catch {
      /* ignore parse error */
    }
    throw new Error(message)
  }
  const json = (await res.json()) as { data: QueueStatus }
  return json.data
}

export interface RetriesData {
  retriesToday: number
  lastFailure: { reason: string; at: string } | null
}

export async function fetchRetries(): Promise<RetriesData> {
  const res = await fetch(apiUrl('/api/v1/queue/retries').toString(), {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) {
    if (res.status === 401) {
      handleUnauthorized()
    }
    let message = 'Failed to fetch retries'
    try {
      const body = (await res.json()) as { message?: string }
      if (typeof body?.message === 'string' && body.message.trim()) {
        message = body.message
      }
    } catch {
      /* ignore parse error */
    }
    throw new Error(message)
  }
  const json = (await res.json()) as { data: RetriesData }
  return json.data
}
