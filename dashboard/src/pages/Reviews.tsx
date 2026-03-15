import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/api/analytics'
import { Card, CardHeader } from '@/components/ui/Card'
import {
  TableContainer,
  tableClass,
  tableHeaderCellClass,
  tableHeaderRowClass,
  tableBodyRowClickableClass,
  tableCellClass,
} from '@/components/ui/Table'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ListChecks } from 'lucide-react'
import type { ReviewEvent } from '@/api/analytics'

const statusColor: Record<string, string> = {
  completed: 'text-[var(--color-success)]',
  failed: 'text-[var(--color-error)]',
  queued: 'text-[var(--color-text-muted)]',
}

export function Reviews() {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['events', 20, 0],
    queryFn: () => fetchEvents({ limit: 20, offset: 0 }),
  })

  const events = Array.isArray(data?.events) ? data.events : []
  const total = typeof data?.total === 'number' ? data.total : 0

  if (error) {
    console.error('[Reviews] Failed to load reviews:', error)
    return (
      <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error-muted)] px-4 py-4 text-sm text-[var(--color-error)]">
        Unable to load data at the moment.{' '}
        {error instanceof Error ? error.message : 'Failed to load reviews.'}
        <button
          type="button"
          onClick={() => refetch()}
          className="ml-2 underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Reviews</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Recent review activity. Click a row to view details.
        </p>
      </div>

      <ErrorBoundary
        sectionLabel="Reviews table"
        message="This section failed to load."
        resetKeys={[data]}
      >
        <Card padding="none">
          <div className="p-4 sm:p-5">
            <CardHeader
              title="Recent reviews"
              subtitle={total > 0 ? `Last 20 of ${total} reviews` : undefined}
            />
            {isLoading && (
              <div className="overflow-x-auto">
                <SkeletonTable rows={10} cols={6} />
              </div>
            )}
            {!isLoading && events.length === 0 && (
              <EmptyState
                icon={<ListChecks className="size-6" />}
                title="No reviews yet"
                description="Review events will appear here when pull requests or merge requests are processed."
              />
            )}
            {!isLoading && events.length > 0 && (
              <TableContainer>
                <table className={tableClass}>
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Repo</th>
                      <th className={tableHeaderCellClass}>PR / MR</th>
                      <th className={tableHeaderCellClass}>Status</th>
                      <th className={tableHeaderCellClass}>AI</th>
                      <th className={tableHeaderCellClass}>Duration</th>
                      <th className={tableHeaderCellClass}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev: ReviewEvent, index: number) => (
                      <tr
                        key={ev?.id ?? index}
                        onClick={() => ev?.id != null && navigate(`/reviews/${ev.id}`)}
                        className={tableBodyRowClickableClass}
                      >
                        <td className={tableCellClass}>{ev?.repoName ?? '—'}</td>
                        <td className={tableCellClass}>
                          {ev?.provider === 'github' ? '#' : '!'}
                          {ev?.mrNumber ?? '—'}
                        </td>
                        <td className={tableCellClass}>
                          <span className={statusColor[ev?.status ?? ''] ?? 'text-[var(--color-text-secondary)]'}>
                            {ev?.status ?? '—'}
                          </span>
                        </td>
                        <td className={`${tableCellClass} text-[var(--color-text-secondary)]`}>
                          {ev?.aiProvider ?? '—'}
                        </td>
                        <td className={`${tableCellClass} text-[var(--color-text-secondary)]`}>
                          {ev?.durationSeconds != null ? `${ev.durationSeconds}s` : '—'}
                        </td>
                        <td className={`${tableCellClass} text-[var(--color-text-secondary)]`}>
                          {ev?.createdAt
                            ? new Date(ev.createdAt).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableContainer>
            )}
          </div>
        </Card>
      </ErrorBoundary>
    </div>
  )
}
