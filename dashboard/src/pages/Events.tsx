import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/api/analytics'
import { Card, CardHeader } from '@/components/ui/Card'
import {
  tableClass,
  tableHeaderCellClass,
  tableHeaderRowClass,
  tableBodyRowClass,
  tableCellClass,
} from '@/components/ui/Table'

const statusColor: Record<string, string> = {
  completed: 'text-[var(--color-success)]',
  failed: 'text-[var(--color-error)]',
  queued: 'text-[var(--color-text-muted)]',
}

export function Events() {
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['events', page, limit],
    queryFn: () => fetchEvents({ limit, offset: page * limit }),
  })

  if (isLoading) {
    return (
      <p className="text-[var(--color-text-secondary)]">Loading events...</p>
    )
  }
  if (error) {
    return (
      <p className="text-[var(--color-error)]">
        Error: {error instanceof Error ? error.message : 'Unknown error'}
      </p>
    )
  }
  if (!data) return null

  const { events, total } = data
  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Review events
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Paginated list of review events
        </p>
      </div>

      <Card padding="none">
        <div className="p-4 sm:p-5">
          <CardHeader
            title="Events"
            subtitle={`${total} total events`}
          />
          <div className="overflow-x-auto -mx-4 -mb-4 sm:-mx-5 sm:-mb-5">
            <table className={tableClass}>
              <thead>
                <tr className={tableHeaderRowClass}>
                  <th className={tableHeaderCellClass}>Provider</th>
                  <th className={tableHeaderCellClass}>Repo</th>
                  <th className={tableHeaderCellClass}>MR #</th>
                  <th className={tableHeaderCellClass}>Author</th>
                  <th className={tableHeaderCellClass}>Status</th>
                  <th className={tableHeaderCellClass}>Comments</th>
                  <th className={tableHeaderCellClass}>Created</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr className={tableBodyRowClass}>
                    <td
                      colSpan={7}
                      className={`${tableCellClass} text-[var(--color-text-secondary)]`}
                    >
                      No events yet
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className={tableBodyRowClass}>
                      <td className={tableCellClass}>{ev.provider}</td>
                      <td className={tableCellClass}>{ev.repoName}</td>
                      <td className={tableCellClass}>{ev.mrNumber}</td>
                      <td className={tableCellClass}>
                        {ev.authorUsername ?? '—'}
                      </td>
                      <td className={tableCellClass}>
                        <span
                          className={
                            statusColor[ev.status] ??
                            'text-[var(--color-text-secondary)]'
                          }
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className={tableCellClass}>{ev.commentsPostedCount}</td>
                      <td
                        className={`${tableCellClass} text-[var(--color-text-secondary)]`}
                      >
                        {new Date(ev.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-surface)]"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--color-text-secondary)]">
              Page {page + 1} of {totalPages} ({total} total)
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-surface)]"
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
