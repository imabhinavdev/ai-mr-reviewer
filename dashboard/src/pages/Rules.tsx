import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { FileText } from 'lucide-react'

export function Rules() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Rules
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Project-specific review rules for AI code reviews
        </p>
      </div>

      <ErrorBoundary
        sectionLabel="Rules"
        message="This section failed to load."
      >
        <Card>
          <CardHeader
            title=".nirik/rules.md"
            subtitle="How rules are applied"
          />
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="size-12 text-[var(--color-text-muted)] mb-4" />
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              Rules are read from{' '}
              <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-[var(--color-text)]">
                .nirik/rules.md
              </code>{' '}
              in each repository when a review runs. Add this file to your repo
              to customize what the AI checks for (e.g. prefer async functions,
              use zod validation, no console.log in production).
            </p>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              A rules viewer for configured repositories may be added in a
              future update.
            </p>
          </div>
        </Card>
      </ErrorBoundary>
    </div>
  )
}
