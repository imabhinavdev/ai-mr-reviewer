import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Placeholder: no forgot-password API yet
      await new Promise((r) => setTimeout(r, 800))
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] flex-col justify-between bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0B0F19] p-10 xl:p-14">
        <div>
          <span className="text-xl font-semibold text-white tracking-tight">Nirik</span>
        </div>
        <div>
          <h1 className="text-3xl xl:text-4xl font-semibold text-white leading-tight max-w-md">
            Reset your password.
          </h1>
          <p className="mt-4 text-[var(--color-text-secondary)] text-lg max-w-sm">
            We&apos;ll send you a link to create a new password.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-[var(--color-text-muted)]">
          <span>© Nirik</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 bg-[var(--color-bg)]">
        <div className="w-full max-w-[400px] mx-auto">
          <div className="lg:hidden mb-8">
            <span className="text-xl font-semibold text-[var(--color-text)]">Nirik</span>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-8"
          >
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>

          <h2 className="text-2xl font-semibold text-[var(--color-text)]">Forgot password?</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {sent ? (
            <div className="mt-8 rounded-lg bg-[var(--color-primary-muted)] border border-[var(--color-primary)]/30 px-4 py-4 text-sm text-[var(--color-text)]">
              <p className="font-medium">Check your email</p>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                Password reset is not configured yet. For now, contact your administrator to reset
                your password.
              </p>
              <Link to="/login" className="mt-4 inline-block text-[var(--color-primary)] font-medium hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <div className="rounded-lg bg-[var(--color-error-muted)] border border-[var(--color-error)]/30 px-4 py-3 text-sm text-[var(--color-error)]">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />

              <Button type="submit" loading={loading} className="w-full" size="lg">
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
            Remember your password?{' '}
            <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
