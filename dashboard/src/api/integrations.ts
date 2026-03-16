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

export interface IntegrationRow {
  id: number
  name: string
  type: string
  configured: boolean
  syncedAt: string
  reposReviewed?: number
  lastActivityAt?: string | null
}

export async function fetchIntegrations(): Promise<IntegrationRow[]> {
  const res = await fetch(`${API_BASE}/api/v1/integrations`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch integrations')
  const json = (await res.json()) as { data: IntegrationRow[] }
  return Array.isArray(json.data) ? json.data : []
}
