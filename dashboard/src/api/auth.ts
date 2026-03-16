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
  fullName?: string
  email?: string
  avatarUrl?: string
  lastLoginAt?: string
  createdAt?: string
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

export interface UpdateProfilePayload {
  fullName?: string
  email?: string
  username?: string
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/v1/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (res.status === 404 || res.status === 501) {
    throw new Error('Profile editing is not available. Contact your administrator.')
  }
  if (!res.ok) {
    const err = (await res.json()) as { message?: string }
    throw new Error(err.message ?? 'Failed to update profile')
  }
  const data = (await res.json()) as { user: User }
  return data.user
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/v1/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (res.status === 404 || res.status === 501) {
    throw new Error('Password change is not available. Contact your administrator.')
  }
  if (!res.ok) {
    const err = (await res.json()) as { message?: string }
    throw new Error(err.message ?? 'Failed to change password')
  }
}
