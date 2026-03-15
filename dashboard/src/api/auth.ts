const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export interface LoginResponse {
  success: boolean
  token?: string
  user: { username: string }
  expiresIn?: string
}

function getToken(): string | null {
  return localStorage.getItem('dashboard_token')
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem('dashboard_token', token)
  else localStorage.removeItem('dashboard_token')
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  })
  const data = (await res.json()) as LoginResponse & { message?: string }
  if (!res.ok) throw new Error(data.message ?? 'Login failed')
  if (data.token) setToken(data.token)
  return data
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  setToken(null)
}

export interface User {
  username: string
}

export async function me(): Promise<User | null> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })
  if (res.status === 401) return null
  if (!res.ok) throw new Error('Failed to fetch user')
  const data = (await res.json()) as { user: User }
  return data.user
}
