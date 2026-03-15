import { useQuery } from '@tanstack/react-query'
import { fetchOverview } from '@/api/analytics'
import { Card } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'

const statCards: { key: string; label: string }[] = [
  { key: 'total', label: 'Total reviews' },
  { key: 'completed', label: 'Completed' },
  { key: 'failed', label: 'Failed' },
  { key: 'queued', label: 'Queued' },
  { key: 'totalComments', label: 'Total comments posted' },
  { key: 'last7Days', label: 'Last 7 days' },
  { key: 'last30Days', label: 'Last 30 days' },
]

function getValue(
  data: import('@/api/analytics').OverviewData,
  key: string,
): number {
  if (key === 'completed' || key === 'failed' || key === 'queued') {
    return data.byStatus?.[key] ?? 0
  }
  return (data as unknown as Record<string, number>)[key] ?? 0
}

export function Overview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: fetchOverview,
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
          Overview of review activity and metrics
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map(({ key, label }) => (
              <Card
                key={key}
                padding="md"
                className="transition-shadow hover:shadow-[var(--shadow-lg)]"
              >
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  {label}
                </p>
                <p className="text-2xl font-semibold text-[var(--color-text)]">
                  {data ? getValue(data, key) : '—'}
                </p>
              </Card>
            ))}
      </div>
    </div>
  )
}
