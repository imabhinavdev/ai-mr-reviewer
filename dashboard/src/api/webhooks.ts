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

export interface WebhookEventRow {
  id: number
  provider: string
  eventType: string
  repoName: string
  action: string | null
  accepted: boolean
  queued: boolean
  receivedAt: string
}

export async function fetchWebhookEvents(params?: {
  limit?: number
}): Promise<WebhookEventRow[]> {
  const url = apiUrl('/api/v1/webhooks/events')
  if (params?.limit) url.searchParams.set('limit', String(params.limit))
  const res = await fetch(url.toString(), {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) {
    if (res.status === 401) {
      handleUnauthorized()
    }
    let message = 'Failed to fetch webhook events'
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
  const json = (await res.json()) as { data: { events: WebhookEventRow[] } }
  return json.data?.events ?? []
}
