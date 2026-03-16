import { useQuery } from '@tanstack/react-query'
import { fetchOverview, fetchAlerts } from '@/api/analytics'
import { fetchSystemHealth } from '@/api/health'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Card } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'

const row1Cards: { key: string; label: string }[] = [
  { key: 'total', label: 'Total Reviews' },
  { key: 'reviewsToday', label: 'Reviews Today' },
  { key: 'pending', label: 'Pending Reviews' },
  { key: 'failed', label: 'Failed Reviews' },
]

const row2Cards: { key: string; label: string }[] = [
  { key: 'avgReviewTime', label: 'Avg Review Time' },
  { key: 'activeProjects', label: 'Active Projects' },
]

function getValue(
  data: import('@/api/analytics').OverviewData,
  key: string,
): number | string {
  if (key === 'pending') return data.byStatus?.queued ?? 0
  if (key === 'failed') return data.byStatus?.failed ?? 0
  if (key === 'reviewsToday') return data.reviewsToday ?? 0
  if (key === 'activeProjects') return data.activeProjects ?? 0
  if (key === 'avgReviewTime') {
    const sec = data.avgReviewTimeSeconds
    if (sec == null) return '—'
    if (sec < 60) return `${Math.round(sec)}s`
    return `${(sec / 60).toFixed(1)}m`
  }
  if (key === 'total') return data.total ?? 0
  return (data as unknown as Record<string, number>)[key] ?? 0
}

export function Overview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: fetchOverview,
  })
  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: fetchSystemHealth,
    refetchInterval: 30000,
  })
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 60000,
  })

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error-muted)] px-4 py-4 text-sm text-[var(--color-error)]">
        Error:{' '}
        {error instanceof Error ? error.message : 'Failed to load overview'}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          What is happening right now — key metrics at a glance
        </p>
      </div>

      {Array.isArray(alerts) && alerts.length > 0 && (
        <ErrorBoundary
          sectionLabel="Alerts"
          message="This section failed to load."
        >
          <div className="rounded-lg border border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10 px-4 py-3">
            <p className="text-sm font-medium text-[var(--color-warning)] mb-1">
              Alerts
            </p>
            <ul className="list-disc list-inside text-sm text-[var(--color-text)] space-y-0.5">
              {alerts.map((a) => (
                <li key={a?.id ?? String(a?.message)}>{a?.message ?? '—'}</li>
              ))}
            </ul>
          </div>
        </ErrorBoundary>
      )}

      <div className="space-y-4">
        <ErrorBoundary
          sectionLabel="Overview metrics row 1"
          message="This section failed to load."
          resetKeys={[data]}
        >
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : row1Cards.map(({ key, label }) => (
                  <Card
                    key={key}
                    padding="md"
                    className="transition-shadow hover:shadow-[var(--shadow-lg)]"
                  >
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      {label}
                    </p>
                    <p className="text-2xl font-semibold text-[var(--color-text)]">
                      {data != null ? getValue(data, key) : '—'}
                    </p>
                  </Card>
                ))}
          </div>
        </ErrorBoundary>
        <ErrorBoundary
          sectionLabel="Overview metrics row 2"
          message="This section failed to load."
          resetKeys={[data]}
        >
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : row2Cards.map(({ key, label }) => (
                  <Card
                    key={key}
                    padding="md"
                    className="transition-shadow hover:shadow-[var(--shadow-lg)]"
                  >
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      {label}
                    </p>
                    <p className="text-2xl font-semibold text-[var(--color-text)]">
                      {data != null ? getValue(data, key) : '—'}
                    </p>
                  </Card>
                ))}
          </div>
        </ErrorBoundary>

        {health != null && (
          <ErrorBoundary
            sectionLabel="System health"
            message="This section failed to load."
            resetKeys={[health]}
          >
            <Card>
              <p className="p-4 pb-2 text-sm font-medium text-[var(--color-text-secondary)]">
                System Health
              </p>
              <dl className="px-4 pb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <dt className="text-[var(--color-text-muted)]">Redis</dt>
                  <dd className="font-medium text-[var(--color-text)]">
                    {health?.redis ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--color-text-muted)]">Workers</dt>
                  <dd className="font-medium text-[var(--color-text)]">
                    {health?.workers ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--color-text-muted)]">AI API</dt>
                  <dd className="font-medium text-[var(--color-text)]">
                    {health?.aiApi ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--color-text-muted)]">
                    Webhook service
                  </dt>
                  <dd className="font-medium text-[var(--color-text)]">
                    {health?.webhookService ?? '—'}
                  </dd>
                </div>
              </dl>
            </Card>
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}
