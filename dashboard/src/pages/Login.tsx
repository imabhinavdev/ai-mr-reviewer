import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setUserFromLogin } = useAuth()

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, from, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      setUserFromLogin(data.user)
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: branding / gradient */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] flex-col justify-between bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0B0F19] p-10 xl:p-14">
        <div>
          <span className="text-xl font-semibold text-white tracking-tight">
            Nirik
          </span>
        </div>
        <div>
          <h1 className="text-3xl xl:text-4xl font-semibold text-white leading-tight max-w-md">
            Code review, automated.
          </h1>
          <p className="mt-4 text-[var(--color-text-secondary)] text-lg max-w-sm">
            Connect your repos, get AI-powered review comments on every pull
            request.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-[var(--color-text-muted)]">
          <span>© Nirik</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 bg-[var(--color-bg)]">
        <div className="w-full max-w-[400px] mx-auto">
          <div className="lg:hidden mb-8">
            <span className="text-xl font-semibold text-[var(--color-text)]">
              Nirik
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-[var(--color-text)]">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Sign in to your dashboard
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg bg-[var(--color-error-muted)] border border-[var(--color-error)]/30 px-4 py-3 text-sm text-[var(--color-error)]">
                {error}
              </div>
            )}

            <Input
              label="Username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
