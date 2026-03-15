import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchActivity, fetchEvents } from '@/api/analytics'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
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

  const { data: activityData, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ['activity', range.from, range.to],
    queryFn: () =>
      fetchActivity({
        from: range.from,
        to: range.to,
        bucket: days > 14 ? 'week' : 'day',
      }),
  })

  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['events', 10, 0],
    queryFn: () => fetchEvents({ limit: 10, offset: 0 }),
  })

  const chartData = Array.isArray(activityData) ? activityData : []
  const events = eventsData?.events ?? []
  const totalEvents = eventsData?.total ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Analytics</h1>
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
        {activityLoading && (
          <Skeleton className="h-[300px] w-full" />
        )}
        {activityError && (
          <p className="py-8 text-center text-sm text-[var(--color-error)]">
            {activityError instanceof Error ? activityError.message : 'Failed to load activity'}
          </p>
        )}
        {!activityLoading && !activityError && (
          <div className="min-h-[300px]">
            {chartData.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="size-6" />}
                title="No activity in this range"
                description="Reviews will appear here once they are processed."
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  <Bar dataKey="count" fill="var(--color-primary)" name="Reviews" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </Card>

      {/* Recent events */}
      <Card>
        <CardHeader
          title="Recent events"
          subtitle={`${totalEvents} total review events`}
        />
        {eventsLoading && <SkeletonTable rows={5} cols={5} />}
        {eventsError && (
          <p className="py-6 text-center text-sm text-[var(--color-error)]">
            {eventsError instanceof Error ? eventsError.message : 'Failed to load events'}
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
              <div className="overflow-x-auto -mx-5 sm:mx-0 -mb-5">
                <table className="w-full min-w-[500px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="px-5 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                        Provider
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                        Repo
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                        MR #
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr
                        key={ev.id}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]/50 transition-colors"
                      >
                        <td className="px-5 py-3 text-[var(--color-text)]">{ev.provider}</td>
                        <td className="px-5 py-3 text-[var(--color-text)]">{ev.repoName}</td>
                        <td className="px-5 py-3 text-[var(--color-text)]">{ev.mrNumber}</td>
                        <td className="px-5 py-3">
                          <span className={statusColor[ev.status] ?? 'text-[var(--color-text-secondary)]'}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[var(--color-text-secondary)]">
                          {new Date(ev.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
