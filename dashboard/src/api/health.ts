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

export interface SystemHealthData {
  redis: string
  workers: string
  aiApi: string
  webhookService: string
}

export async function fetchSystemHealth(): Promise<SystemHealthData> {
  const res = await fetch(`${API_BASE}/api/v1/system/health`, {
    headers: headers(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch system health')
  const json = (await res.json()) as { data: SystemHealthData }
  return json.data
}
