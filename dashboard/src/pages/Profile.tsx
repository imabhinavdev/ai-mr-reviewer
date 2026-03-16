import { useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  changePassword,
  updateProfile,
  type UpdateProfilePayload,
} from '@/api/auth'
import { Camera, Lock, Shield } from 'lucide-react'

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return d.toLocaleDateString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

export function Profile() {
  const { user, setUserFromLogin } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const passwordSectionRef = useRef<HTMLDivElement>(null)

  const handleSaveProfile = async () => {
    if (!user) return
    setProfileError(null)
    setProfileSaving(true)
    try {
      const payload: UpdateProfilePayload = {}
      if (fullName !== (user.fullName ?? ''))
        payload.fullName = fullName || undefined
      if (email !== (user.email ?? '')) payload.email = email || undefined
      if (username !== user.username) payload.username = username || undefined
      if (Object.keys(payload).length === 0) {
        setEditing(false)
        setProfileSaving(false)
        return
      }
      const updated = await updateProfile(payload)
      setUserFromLogin(updated)
      setEditing(false)
    } catch (e) {
      setProfileError(
        e instanceof Error ? e.message : 'Failed to update profile',
      )
    } finally {
      setProfileSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setFullName(user?.fullName ?? '')
    setEmail(user?.email ?? '')
    setUsername(user?.username ?? '')
    setProfileError(null)
    setEditing(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    setPasswordLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(true)
    } catch (e) {
      setPasswordError(
        e instanceof Error ? e.message : 'Failed to change password',
      )
    } finally {
      setPasswordLoading(false)
    }
  }

  const scrollToPassword = () => {
    passwordSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initials = (user?.username ?? 'A').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Profile
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage your account and security
        </p>
      </div>

      {/* Account Information */}
      <ErrorBoundary
        sectionLabel="Profile form"
        message="This section failed to load."
      >
        <Card>
          <CardHeader
            title="Account Information"
            subtitle="Your basic account details"
            action={
              !editing ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  Edit profile
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={profileSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    loading={profileSaving}
                  >
                    Save
                  </Button>
                </div>
              )
            }
          />
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="size-20 rounded-full object-cover border-2 border-[var(--color-border)]"
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-semibold text-xl border-2 border-[var(--color-border)]">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  aria-label="Change photo"
                  title="Change photo (not yet supported)"
                >
                  <Camera className="size-4" />
                </button>
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                <p className="font-medium text-[var(--color-text)]">
                  Profile photo
                </p>
                <p className="mt-0.5">
                  Avatar can be updated when supported by your administrator.
                </p>
              </div>
            </div>

            {profileError && (
              <p className="text-sm text-[var(--color-error)] rounded-lg bg-[var(--color-error-muted)] px-3 py-2">
                {profileError}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!editing}
                readOnly={!editing}
              />
              <Input
                label="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Not set"
                disabled={!editing}
                readOnly={!editing}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Not set"
                disabled={!editing}
                readOnly={!editing}
                className="sm:col-span-2"
              />
            </div>
          </div>
        </Card>
      </ErrorBoundary>

      {/* Security Settings */}
      <ErrorBoundary
        sectionLabel="Security settings"
        message="This section failed to load."
      >
        <Card>
          <CardHeader
            title="Security Settings"
            subtitle="Keep your account secure"
          />
          <div className="flex items-center gap-3 text-sm">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-text)]">Password</p>
              <p className="text-[var(--color-text-secondary)] mt-0.5">
                Use a strong password and change it periodically.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={scrollToPassword}
              >
                <Lock className="size-4" /> Change password
              </Button>
            </div>
          </div>
        </Card>
      </ErrorBoundary>

      {/* Password Change */}
      <ErrorBoundary
        sectionLabel="Password section"
        message="This section failed to load."
      >
        <Card ref={passwordSectionRef}>
          <CardHeader
            title="Change Password"
            subtitle="Update your password to keep your account secure"
          />
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              hint="At least 8 characters"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {passwordError && (
              <p className="text-sm text-[var(--color-error)] rounded-lg bg-[var(--color-error-muted)] px-3 py-2">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-[var(--color-success)]">
                Password updated successfully.
              </p>
            )}
            <Button type="submit" loading={passwordLoading}>
              Update password
            </Button>
          </form>
        </Card>
      </ErrorBoundary>

      {/* Activity Information */}
      <ErrorBoundary
        sectionLabel="Activity information"
        message="This section failed to load."
      >
        <Card>
          <CardHeader
            title="Activity Information"
            subtitle="Recent account activity"
          />
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">
                Last login
              </dt>
              <dd className="mt-0.5 text-[var(--color-text)]">
                {formatDate(user?.lastLoginAt)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">
                Account created
              </dt>
              <dd className="mt-0.5 text-[var(--color-text)]">
                {formatDate(user?.createdAt)}
              </dd>
            </div>
          </dl>
        </Card>
      </ErrorBoundary>
    </div>
  )
}
