import { type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plug, Github, GitBranch, Check, X, RefreshCw } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { fetchIntegrations } from '@/api/integrations'

const iconByType: Record<string, ReactNode> = {
  github: <Github className="size-5" />,
  gitlab: <GitBranch className="size-5" />,
}

export function Integrations() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations,
  })

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error-muted)] px-4 py-4 text-sm text-[var(--color-error)]">
        Error:{' '}
        {error instanceof Error ? error.message : 'Failed to load integrations'}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            Integrations
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Git providers synced from environment. Configure tokens in your .env
            to enable.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="size-4" />}
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-[var(--radius-lg)]" />
          <Skeleton className="h-32 rounded-[var(--radius-lg)]" />
        </div>
      ) : !Array.isArray(data) || data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Plug className="size-6" />}
            title="No integrations"
            description="Integrations are synced from your server environment. Ensure DATABASE_URL is set and run migrations."
          />
        </Card>
      ) : (
        <ErrorBoundary
          sectionLabel="Integrations grid"
          message="This section failed to load."
          resetKeys={[data]}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((integration, index) => (
              <Card key={integration?.id ?? index} className="flex flex-col">
                <CardHeader
                  title={integration?.name ?? 'Integration'}
                  subtitle={
                    integration?.configured
                      ? 'Configured (token set in env)'
                      : 'Not configured'
                  }
                  action={
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        integration?.configured
                          ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {integration?.configured ? (
                        <Check className="size-3.5" />
                      ) : (
                        <X className="size-3.5" />
                      )}
                      {integration?.configured ? 'Active' : 'Inactive'}
                    </span>
                  }
                />
                <div className="mt-2 flex items-center gap-3 text-[var(--color-text-secondary)]">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text)]">
                    {iconByType[integration?.type ?? ''] ?? (
                      <Plug className="size-5" />
                    )}
                  </div>
                  <p className="text-sm">
                    {integration?.type === 'github'
                      ? 'Set GITHUB_TOKEN in .env to enable PR reviews.'
                      : integration?.type === 'gitlab'
                        ? 'Set GITLAB_TOKEN or GITLAB_PRIVATE_TOKEN in .env to enable MR reviews.'
                        : 'Configure in environment to enable.'}
                  </p>
                </div>
                {integration?.reposReviewed != null && (
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    Repos reviewed: {integration.reposReviewed}
                  </p>
                )}
                {integration?.lastActivityAt && (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Last activity:{' '}
                    {new Date(integration.lastActivityAt).toLocaleString()}
                  </p>
                )}
                {integration?.syncedAt && (
                  <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                    Synced {new Date(integration.syncedAt).toLocaleString()}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </ErrorBoundary>
      )}
    </div>
  )
}
