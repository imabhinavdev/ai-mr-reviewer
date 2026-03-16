import { useQuery } from '@tanstack/react-query'
import { fetchWebhookEvents } from '@/api/webhooks'
import { Card, CardHeader } from '@/components/ui/Card'
import {
  TableContainer,
  tableClass,
  tableHeaderCellClass,
  tableHeaderRowClass,
  tableBodyRowClass,
  tableCellClass,
} from '@/components/ui/Table'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Webhook } from 'lucide-react'

function formatTime(iso: string | null | undefined): string {
  if (iso == null || typeof iso !== 'string') return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const now = new Date()
  const sameDay =
    d.getUTCDate() === now.getUTCDate() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCFullYear() === now.getUTCFullYear()
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleString()
}

export function WebhookEvents() {
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: () => fetchWebhookEvents({ limit: 50 }),
    refetchInterval: 15000,
  })

  const list = Array.isArray(events) ? events : []

  if (error) {
    console.error('[WebhookEvents] Failed to load events:', error)
    return (
      <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error-muted)] px-4 py-4 text-sm text-[var(--color-error)]">
        Unable to load data at the moment.{' '}
        {error instanceof Error
          ? error.message
          : 'Failed to load webhook events.'}
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
    <ErrorBoundary
      sectionLabel="Webhook events page"
      message="Something went wrong on this page."
      onReset={() => refetch()}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            Webhook Events
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Recent incoming webhook events. Useful for troubleshooting.
          </p>
        </div>

        <ErrorBoundary
          sectionLabel="Webhook events table"
          message="Something went wrong while loading this section."
        >
          <Card padding="none">
            <div className="p-4 sm:p-5">
              <CardHeader
                title="Recent events"
                subtitle={list.length > 0 ? `${list.length} events` : undefined}
              />
              {isLoading && (
                <div className="overflow-x-auto">
                  <SkeletonTable rows={5} cols={7} />
                </div>
              )}
              {!isLoading && list.length === 0 && (
                <EmptyState
                  icon={<Webhook className="size-6" />}
                  title="No webhook events yet"
                  description="Incoming webhooks will appear here once they are received."
                />
              )}
              {!isLoading && list.length > 0 && (
                <TableContainer>
                  <table className={tableClass}>
                    <thead>
                      <tr className={tableHeaderRowClass}>
                        <th className={tableHeaderCellClass}>Provider</th>
                        <th className={tableHeaderCellClass}>Event</th>
                        <th className={tableHeaderCellClass}>Repository</th>
                        <th className={tableHeaderCellClass}>Action</th>
                        <th className={tableHeaderCellClass}>Accepted</th>
                        <th className={tableHeaderCellClass}>Queued</th>
                        <th className={tableHeaderCellClass}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((e, index) => (
                        <tr key={e?.id ?? index} className={tableBodyRowClass}>
                          <td className={`${tableCellClass} capitalize`}>
                            {e?.provider ?? '—'}
                          </td>
                          <td className={tableCellClass}>
                            {e?.eventType ?? '—'}
                          </td>
                          <td className={`${tableCellClass} font-medium`}>
                            {e?.repoName ?? '—'}
                          </td>
                          <td className={tableCellClass}>{e?.action ?? '—'}</td>
                          <td className={tableCellClass}>
                            {e?.accepted ? (
                              <span className="text-[var(--color-success)]">
                                Yes
                              </span>
                            ) : (
                              <span className="text-[var(--color-text-muted)]">
                                No
                              </span>
                            )}
                          </td>
                          <td className={tableCellClass}>
                            {e?.queued ? (
                              <span className="text-[var(--color-success)]">
                                Yes
                              </span>
                            ) : (
                              <span className="text-[var(--color-text-muted)]">
                                No
                              </span>
                            )}
                          </td>
                          <td
                            className={`${tableCellClass} text-[var(--color-text-secondary)]`}
                          >
                            {formatTime(e?.receivedAt)}
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
    </ErrorBoundary>
  )
}
