import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  fetchActivity,
  fetchEvents,
  fetchDetectionCategories,
  fetchPrComplexity,
} from '@/api/analytics'
import { ChartContainer } from '@/components/ChartContainer'
import { ChartErrorBoundary } from '@/components/ChartErrorBoundary'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Card, CardHeader } from '@/components/ui/Card'
import {
  TableContainer,
  tableClass,
  tableHeaderCellClass,
  tableHeaderRowClass,
  tableBodyRowClass,
  tableCellClass,
} from '@/components/ui/Table'
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { normalizeActivityData } from '@/lib/chartData'
import { BarChart3 } from 'lucide-react'

function getDateRange(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

const statusColor: Record<string, string> = {
  completed: 'text-[var(--color-success)]',
  failed: 'text-[var(--color-error)]',
  queued: 'text-[var(--color-text-muted)]',
}

export function Analytics() {
  const [days, setDays] = useState(30)
  const range = getDateRange(days)

  const {
    data: activityData,
    isLoading: activityLoading,
    error: activityError,
  } = useQuery({
    queryKey: ['activity', range.from, range.to],
    queryFn: () =>
      fetchActivity({
        from: range.from,
        to: range.to,
        bucket: days > 14 ? 'week' : 'day',
      }),
  })

  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ['events', 10, 0],
    queryFn: () => fetchEvents({ limit: 10, offset: 0 }),
  })

  const chartData = normalizeActivityData(activityData)
  const events = eventsData?.events ?? []
  const totalEvents = eventsData?.total ?? 0

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['detection-categories'],
    queryFn: fetchDetectionCategories,
  })
  const {
    data: prComplexity,
    isLoading: prComplexityLoading,
    error: prComplexityError,
  } = useQuery({
    queryKey: ['pr-complexity'],
    queryFn: fetchPrComplexity,
  })

  const categoryLabels: Record<string, string> = {
    error_handling: 'Error handling',
    unused_variables: 'Unused variables',
    security: 'Security warnings',
    performance: 'Performance issues',
    other: 'Other',
  }
  const categoriesObj =
    categories != null &&
    typeof categories === 'object' &&
    !Array.isArray(categories)
      ? categories
      : {}
  const categoryEntries = Object.entries(categoriesObj).sort(
    (a, b) => b[1] - a[1],
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Review activity and recent events
        </p>
      </div>

      {/* Activity chart */}
      <Card>
        <CardHeader
          title="Review activity"
          subtitle="Number of reviews over time"
          action={
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          }
        />
        {activityLoading && <Skeleton className="h-[300px] w-full" />}
        {activityError && (
          <p className="py-8 text-center text-sm text-[var(--color-error)]">
            {activityError instanceof Error
              ? activityError.message
              : 'Failed to load activity'}
          </p>
        )}
        {!activityLoading && !activityError && (
          <ChartErrorBoundary chartName="Review activity">
            {chartData.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="size-6" />}
                title="No data available yet."
                description="Reviews will appear here once they are processed."
              />
            ) : (
              <ChartContainer height={300}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                      stroke="var(--color-border)"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                      stroke="var(--color-border)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                      }}
                      labelStyle={{ color: 'var(--color-text)' }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-primary)"
                      name="Reviews"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </ChartErrorBoundary>
        )}
      </Card>

      {/* Top Issue Categories */}
      <Card>
        <CardHeader
          title="Top Issue Categories"
          subtitle="Breakdown of detected problems across all reviews"
        />
        <ErrorBoundary
          sectionLabel="Top Issue Categories"
          message="This section failed to load."
          resetKeys={[categories]}
        >
          {categoriesLoading && <Skeleton className="h-32 w-full mx-4 mb-4" />}
          {categoriesError && (
            <p className="px-4 pb-4 text-sm text-[var(--color-error)]">
              {categoriesError instanceof Error
                ? categoriesError.message
                : 'Failed to load categories'}
            </p>
          )}
          {!categoriesLoading &&
            !categoriesError &&
            categoryEntries.length === 0 && (
              <p className="px-4 pb-4 text-sm text-[var(--color-text-secondary)]">
                No data available yet. Categories will appear after reviews with
                findings are processed.
              </p>
            )}
          {!categoriesLoading &&
            !categoriesError &&
            categoryEntries.length > 0 && (
              <ul className="p-4 sm:p-5 pt-0 space-y-2">
                {categoryEntries.map(([key, count]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)] last:border-0"
                  >
                    <span className="text-[var(--color-text)]">
                      {categoryLabels[key] ?? key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold text-[var(--color-text)]">
                      {Number(count)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
        </ErrorBoundary>
      </Card>

      {/* PR Complexity */}
      <Card>
        <CardHeader
          title="PR Complexity"
          subtitle="Average PR size metrics to help teams manage PR discipline"
        />
        <ErrorBoundary
          sectionLabel="PR Complexity"
          message="This section failed to load."
          resetKeys={[prComplexity]}
        >
          {prComplexityLoading && (
            <Skeleton className="h-20 w-full mx-4 mb-4" />
          )}
          {prComplexityError && (
            <p className="px-4 pb-4 text-sm text-[var(--color-error)]">
              {prComplexityError instanceof Error
                ? prComplexityError.message
                : 'Failed to load PR complexity'}
            </p>
          )}
          {!prComplexityLoading && !prComplexityError && (
            <>
              <dl className="p-4 sm:p-5 grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <dt className="text-[var(--color-text-muted)]">
                    Average files changed
                  </dt>
                  <dd className="mt-0.5 text-lg font-semibold text-[var(--color-text)]">
                    {prComplexity?.avgFilesChanged != null
                      ? prComplexity.avgFilesChanged.toFixed(1)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--color-text-muted)]">
                    Average lines added
                  </dt>
                  <dd className="mt-0.5 text-lg font-semibold text-[var(--color-text)]">
                    {prComplexity?.avgLinesAdded ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--color-text-muted)]">
                    Largest PR (lines)
                  </dt>
                  <dd className="mt-0.5 text-lg font-semibold text-[var(--color-text)]">
                    {prComplexity?.maxLinesAdded ?? '—'}
                  </dd>
                </div>
              </dl>
              {prComplexity?.sampleSize === 0 && (
                <p className="px-4 pb-4 text-xs text-[var(--color-text-muted)]">
                  No data available yet. Metrics appear after reviews complete
                  with diff stats.
                </p>
              )}
            </>
          )}
        </ErrorBoundary>
      </Card>

      {/* Recent events */}
      <Card>
        <CardHeader
          title="Recent events"
          subtitle={`${totalEvents} total review events`}
        />
        <ErrorBoundary
          sectionLabel="Recent events table"
          message="This section failed to load."
          resetKeys={[eventsData]}
        >
          {eventsLoading && (
            <div className="overflow-x-auto">
              <SkeletonTable rows={5} cols={5} />
            </div>
          )}
          {eventsError && (
            <p className="py-6 text-center text-sm text-[var(--color-error)]">
              {eventsError instanceof Error
                ? eventsError.message
                : 'Failed to load events'}
            </p>
          )}
          {!eventsLoading && !eventsError && (
            <>
              {events.length === 0 ? (
                <EmptyState
                  title="No events yet"
                  description="Review events will appear here when pull requests are processed."
                />
              ) : (
                <TableContainer inset={false}>
                  <table className={tableClass}>
                    <thead>
                      <tr className={tableHeaderRowClass}>
                        <th className={tableHeaderCellClass}>Provider</th>
                        <th className={tableHeaderCellClass}>Repo</th>
                        <th className={tableHeaderCellClass}>MR #</th>
                        <th className={tableHeaderCellClass}>Status</th>
                        <th className={tableHeaderCellClass}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev, index) => (
                        <tr key={ev?.id ?? index} className={tableBodyRowClass}>
                          <td className={tableCellClass}>
                            {ev?.provider ?? '—'}
                          </td>
                          <td className={tableCellClass}>
                            {ev?.repoName ?? '—'}
                          </td>
                          <td className={tableCellClass}>
                            {ev?.mrNumber ?? '—'}
                          </td>
                          <td className={tableCellClass}>
                            <span
                              className={
                                statusColor[ev?.status ?? ''] ??
                                'text-[var(--color-text-secondary)]'
                              }
                            >
                              {ev?.status ?? '—'}
                            </span>
                          </td>
                          <td
                            className={`${tableCellClass} text-[var(--color-text-secondary)]`}
                          >
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
            </>
          )}
        </ErrorBoundary>
      </Card>
    </div>
  )
}
