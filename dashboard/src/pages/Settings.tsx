import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useTheme } from '@/context/ThemeContext'

export function Settings() {
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
        <ErrorBoundary
          sectionLabel="Settings profile card"
          message="This section failed to load."
        >
          <Card>
            <CardHeader
              title="Profile"
              subtitle="Manage your account and security"
              action={
                <Link
                  to="/profile"
                  className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                >
                  Manage your profile
                </Link>
              }
            />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Update your profile information, password, and view account
              activity.
            </p>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary
          sectionLabel="Settings appearance"
          message="This section failed to load."
        >
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
        </ErrorBoundary>
      </div>
    </div>
  )
}
