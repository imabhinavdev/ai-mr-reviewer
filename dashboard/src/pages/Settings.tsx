import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export function Settings() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader title="Profile" subtitle="Your account information" />
          <div className="space-y-4">
            <Input
              label="Username"
              value={user?.username ?? ''}
              disabled
              readOnly
            />
            <p className="text-sm text-[var(--color-text-muted)]">
              Contact your administrator to change your username or password.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Appearance"
            subtitle="Customize how the dashboard looks"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="theme"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
                className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)]">Dark</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="theme"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
                className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)]">Light</span>
            </label>
          </div>
        </Card>
      </div>
    </div>
  )
}
