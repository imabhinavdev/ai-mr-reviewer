import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchUserProfile, fetchUserInsights } from '@/api/analytics'
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
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { normalizeActivityData } from '@/lib/chartData'
import { ArrowLeft, ExternalLink, BarChart3, FolderKanban, ListChecks } from 'lucide-react'


const statusColor: Record<string, string> = {
  completed: 'text-[var(--color-success)]',
  failed: 'text-[var(--color-error)]',
  queued: 'text-[var(--color-text-muted)]',
}

function buildPrUrl(provider: string, repoName: string, mrNumber: number): string | null {
  if (provider === 'github') {
    return `https://github.com/${repoName}/pull/${mrNumber}`
  }
  if (provider === 'gitlab') {
    return `https://gitlab.com/${repoName}/-/merge_requests/${mrNumber}`
  }
  return null
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString()
}

export function UserProfile() {
  const params = useParams<{ provider: string; username: string }>()
  const navigate = useNavigate()
  const provider = params.provider ? decodeURIComponent(params.provider) : ''
  const username = params.username ? decodeURIComponent(params.username) : ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', provider, username],
    queryFn: () => fetchUserProfile(provider, username),
    enabled: Boolean(provider && username),
  })
  const { data: insights } = useQuery({
    queryKey: ['userInsights', provider, username],
    queryFn: () => fetchUserInsights(provider, username),
    enabled: Boolean(provider && username),
  })

  const categoryLabels: Record<string, string> = {
    error_handling: 'Missing error handling',
    unused_variables: 'Unused variables',
    security: 'Security warnings',
    performance: 'Performance suggestions',
    other: 'Other',
  }
  const insightsCategories =
    insights != null && typeof insights === 'object' && !Array.isArray(insights) && insights.categories != null && typeof insights.categories === 'object'
      ? insights.categories
      : {}
  const categoryEntries = Object.entries(insightsCategories).sort((a, b) => Number(b[1]) - Number(a[1]))

  if (error) {
    return (
      <div className="space-y-4">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="size-4" />}
          onClick={() => navigate('/users')}
        >
          Back to users
        </Button>
        <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error-muted)] px-4 py-4 text-sm text-[var(--color-error)]">
          {error instanceof Error ? error.message : 'Failed to load user profile'}
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const activityChartData = normalizeActivityData(data?.activity)
  const issuesChartData = normalizeActivityData(data?.issuesActivity)
  const reposList = Array.isArray(data?.repos) ? data.repos : []
  const reposChartData = reposList.map((r) => ({
    name: (r?.repoName?.length ?? 0) > 25 ? (r?.repoName ?? '').slice(0, 22) + '...' : (r?.repoName ?? '—'),
    fullName: r?.repoName ?? '',
    count: r?.mrCount ?? 0,
  }))
  const recentReviews = Array.isArray(data?.recentReviews) ? data.recentReviews : []

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="size-4" />}
          onClick={() => navigate('/users')}
        >
          Back to users
        </Button>
      </div>

      {/* Basic info */}
      <ErrorBoundary sectionLabel="User profile" message="This section failed to load." resetKeys={[data]}>
        <Card>
          <CardHeader title="User profile" />
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Username</dt>
              <dd className="mt-0.5 text-[var(--color-text)] font-medium">{data?.username ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Full name</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">{data?.fullName ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Provider</dt>
              <dd className="mt-0.5 text-[var(--color-text)] capitalize">{data?.provider ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">First seen</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">
                {data?.firstSeen ? new Date(data.firstSeen).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Last activity</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">{formatRelative(data?.lastActivity ?? null)}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Repositories contributed</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">{data?.repoCount ?? '—'}</dd>
            </div>
          </dl>
        </Card>
      </ErrorBoundary>

      {/* Code quality insights */}
      {categoryEntries.length > 0 && (
        <ErrorBoundary sectionLabel="Code quality insights" message="This section failed to load." resetKeys={[insights]}>
          <Card>
            <CardHeader
              title="Code quality insights"
              subtitle="Common issues detected in this user's PRs"
            />
            <ul className="p-4 sm:p-5 pt-0 space-y-2">
              {categoryEntries.map(([key, count]) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)] last:border-0"
                >
                  <span className="text-sm text-[var(--color-text)]">
                    {categoryLabels[key] ?? key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">{count}</span>
                </li>
              ))}
            </ul>
          </Card>
        </ErrorBoundary>
      )}

      {/* User review statistics */}
      <ErrorBoundary sectionLabel="Review statistics" message="This section failed to load." resetKeys={[data]}>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Review statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total PRs / MRs created</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{data?.totalPRs ?? '—'}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total AI reviews triggered</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{data?.totalPRs ?? '—'}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total AI comments</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{data?.totalComments ?? '—'}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Avg issues per PR</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{data?.avgIssuesPerPR ?? '—'}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total errors detected</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]" title="Breakdown by severity coming soon">
                {data?.totalErrors ?? '—'}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total warnings detected</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]" title="Breakdown by severity coming soon">
                {data?.totalWarnings ?? '—'}
              </p>
            </div>
          </Card>
        </div>
      </div>
      </ErrorBoundary>

      {/* Activity: PRs over time */}
      <Card>
        <CardHeader
          title="PRs created over time"
          subtitle="Last 30 days"
        />
        <ChartErrorBoundary chartName="PRs over time">
          {activityChartData.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="size-6" />}
              title="No data available yet."
              description="PR activity will appear here once reviews are processed."
            />
          ) : (
            <ChartContainer height={280}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={activityChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                    tickFormatter={(v) => (typeof v === 'string' ? v.slice(5) : v)}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                    labelFormatter={(v) => (typeof v === 'string' ? v : String(v))}
                    formatter={(value: number) => [value, 'PRs']}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" name="PRs" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </ChartErrorBoundary>
      </Card>

      {/* AI issues detected over time */}
      <Card>
        <CardHeader
          title="AI issues detected over time"
          subtitle="Last 30 days"
        />
        <ChartErrorBoundary chartName="AI issues over time">
          {issuesChartData.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="size-6" />}
              title="No data available yet."
              description="AI comment counts will appear here once reviews complete."
            />
          ) : (
            <ChartContainer height={280}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={issuesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                    tickFormatter={(v) => (typeof v === 'string' ? v.slice(5) : v)}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                    labelFormatter={(v) => (typeof v === 'string' ? v : String(v))}
                    formatter={(value: number) => [value, 'Issues']}
                  />
                  <Bar dataKey="count" fill="var(--color-warning)" name="Issues" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </ChartErrorBoundary>
      </Card>

      {/* Reviews triggered per repository */}
      <Card>
        <CardHeader
          title="Reviews triggered per repository"
          subtitle="PR/MR count by repo"
        />
        <ChartErrorBoundary chartName="Reviews per repository">
          {reposChartData.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="size-6" />}
              title="No data available yet."
              description="Repository activity will appear here once PRs are reviewed."
            />
          ) : (
            <div className="w-full" style={{ height: Math.max(200, reposChartData.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reposChartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                    formatter={(value: number) => [value, 'Reviews']}
                    labelFormatter={(_, payload) => (payload?.[0]?.payload?.fullName ?? '')}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" name="Reviews" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartErrorBoundary>
      </Card>

      {/* Repositories contributed */}
      <ErrorBoundary sectionLabel="Repositories contributed" message="This section failed to load." resetKeys={[data?.repos]}>
        <Card padding="none">
          <div className="p-4 sm:p-5">
            <CardHeader
              title="Repositories contributed"
              subtitle={`${reposList.length} repositories`}
            />
            {reposList.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="size-6" />}
                title="No repositories"
                description="Repository activity will appear here once PRs are reviewed."
              />
            ) : (
              <TableContainer>
                <table className={tableClass}>
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Repository</th>
                      <th className={tableHeaderCellClass}>PRs / MRs created</th>
                      <th className={tableHeaderCellClass}>Reviews processed</th>
                      <th className={tableHeaderCellClass}>Issues detected</th>
                      <th className={tableHeaderCellClass}>Last contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reposList.map((r, index) => (
                      <tr key={r?.repoId ?? index} className={tableBodyRowClass}>
                        <td className={`${tableCellClass} font-medium`}>{r?.repoName ?? '—'}</td>
                        <td className={tableCellClass}>{r?.mrCount ?? 0}</td>
                        <td className={tableCellClass}>{r?.mrCount ?? 0}</td>
                        <td className={tableCellClass}>{r?.commentCount ?? 0}</td>
                        <td className={`${tableCellClass} text-[var(--color-text-secondary)]`}>
                          {r?.lastContribution ? formatRelative(r.lastContribution) : '—'}
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

      {/* Recent review activity */}
      <ErrorBoundary sectionLabel="Recent review activity" message="This section failed to load." resetKeys={[data?.recentReviews]}>
        <Card padding="none">
          <div className="p-4 sm:p-5">
            <CardHeader
              title="Recent review activity"
              subtitle={`Last ${recentReviews.length} PRs / MRs`}
            />
            {recentReviews.length === 0 ? (
              <EmptyState
                icon={<ListChecks className="size-6" />}
                title="No reviews yet"
                description="Recent PR reviews will appear here."
              />
            ) : (
              <TableContainer>
                <table className={tableClass}>
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Repository</th>
                      <th className={tableHeaderCellClass}>PR / MR</th>
                      <th className={tableHeaderCellClass}>Status</th>
                      <th className={tableHeaderCellClass}>AI issues</th>
                      <th className={tableHeaderCellClass}>Duration</th>
                      <th className={tableHeaderCellClass}>Timestamp</th>
                      <th className={tableHeaderCellClass}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReviews.map((ev, index) => {
                      const prUrl = buildPrUrl(ev?.provider ?? '', ev?.repoName ?? '', ev?.mrNumber ?? 0)
                      return (
                        <tr key={ev?.id ?? index} className={tableBodyRowClass}>
                          <td className={tableCellClass}>{ev?.repoName ?? '—'}</td>
                          <td className={tableCellClass}>
                            {ev?.provider === 'github' ? '#' : '!'}{ev?.mrNumber ?? '—'}
                          </td>
                          <td className={tableCellClass}>
                            <span className={statusColor[ev?.status ?? ''] ?? 'text-[var(--color-text)]'}>{ev?.status ?? '—'}</span>
                          </td>
                          <td className={tableCellClass}>{ev?.commentsPostedCount ?? 0}</td>
                          <td className={`${tableCellClass} text-[var(--color-text-secondary)]`}>
                            {ev?.durationSeconds != null ? `${ev.durationSeconds}s` : '—'}
                          </td>
                          <td className={`${tableCellClass} text-[var(--color-text-secondary)]`}>
                            {ev?.createdAt ? formatRelative(ev.createdAt) : '—'}
                          </td>
                          <td className={tableCellClass}>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => ev?.id != null && navigate(`/reviews/${ev.id}`)}
                              >
                                Details
                              </Button>
                              {prUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  leftIcon={<ExternalLink className="size-3.5" />}
                                  onClick={() => window.open(prUrl, '_blank')}
                                >
                                  Open
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </TableContainer>
            )}
          </div>
        </Card>
      </ErrorBoundary>

      {/* Code quality insights */}
      <ErrorBoundary sectionLabel="Code quality summary" message="This section failed to load." resetKeys={[data]}>
        <Card>
          <CardHeader
            title="Code quality insights"
            subtitle="Summary of AI findings for this user"
          />
          <div className="space-y-3 text-sm">
            <p className="text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text)]">Total issues found by AI:</strong> {data?.totalComments ?? '—'}
            </p>
            {(data?.totalErrors != null || data?.totalWarnings != null) && (
              <p className="text-[var(--color-text-secondary)]">
                Errors: {data?.totalErrors ?? 0} · Warnings: {data?.totalWarnings ?? 0}
              </p>
            )}
            <p className="text-[var(--color-text-secondary)] mt-2">
              Issue categories (e.g. error handling, security, unused variables) require storing detailed review feedback and will be available in a future release.
            </p>
          </div>
        </Card>
      </ErrorBoundary>
    </div>
  )
}
