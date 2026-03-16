import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import {
  fetchRepoOverview,
  fetchRepoActivity,
  fetchRepoContributors,
  fetchRepoIssueSummary,
  fetchRepoHealthScore,
  fetchRepoRules,
  fetchEvents,
  type RepoContributor,
  type ReviewEvent,
} from '@/api/analytics'
import { fetchQueueStatus } from '@/api/queue'
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
  tableBodyRowClickableClass,
  tableCellClass,
} from '@/components/ui/Table'
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { normalizeActivityData } from '@/lib/chartData'
import { ArrowLeft, BarChart3, Users, ListChecks, Heart } from 'lucide-react'

function getDateRange(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

const statusColor: Record<string, string> = {
  completed: 'text-[var(--color-success)]',
  failed: 'text-[var(--color-error)]',
  queued: 'text-[var(--color-text-muted)]',
}

const PIE_COLORS = ['var(--color-success)', 'var(--color-warning)', 'var(--color-primary)', 'var(--color-text-muted)']

function formatTimeAgo(date: string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  const now = new Date()
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (sec < 60) return 'just now'
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`
  return d.toLocaleDateString()
}

export function RepositoryDetail() {
  const { provider, repoId } = useParams<{ provider: string; repoId: string }>()
  const navigate = useNavigate()
  const decodedProvider = provider ? decodeURIComponent(provider) : ''
  const decodedRepoId = repoId ? decodeURIComponent(repoId) : ''

  const [days, setDays] = useState(30)
  const range = getDateRange(days)

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['repo-overview', decodedProvider, decodedRepoId],
    queryFn: () => fetchRepoOverview(decodedProvider, decodedRepoId),
    enabled: !!decodedProvider && !!decodedRepoId,
  })

  const repoName = overview?.repoName ?? decodedRepoId

  const { data: activityData, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ['repo-activity', decodedProvider, decodedRepoId, range.from, range.to],
    queryFn: () =>
      fetchRepoActivity(decodedProvider, decodedRepoId, {
        from: range.from,
        to: range.to,
        bucket: days > 14 ? 'week' : 'day',
      }),
    enabled: !!decodedProvider && !!decodedRepoId,
  })

  const { data: contributorsData } = useQuery({
    queryKey: ['repo-contributors', decodedProvider, decodedRepoId],
    queryFn: () => fetchRepoContributors(decodedProvider, decodedRepoId),
    enabled: !!decodedProvider && !!decodedRepoId,
  })

  const { data: issueSummary, isLoading: issuesLoading, error: issuesError } = useQuery({
    queryKey: ['repo-issues', decodedProvider, decodedRepoId],
    queryFn: () => fetchRepoIssueSummary(decodedProvider, decodedRepoId),
    enabled: !!decodedProvider && !!decodedRepoId,
  })

  const { data: healthScore } = useQuery({
    queryKey: ['repo-health', decodedProvider, decodedRepoId],
    queryFn: () => fetchRepoHealthScore(decodedProvider, decodedRepoId),
    enabled: !!decodedProvider && !!decodedRepoId,
  })

  const { data: rulesData } = useQuery({
    queryKey: ['repo-rules', decodedProvider, decodedRepoId],
    queryFn: () => fetchRepoRules(decodedProvider, decodedRepoId),
    enabled: !!decodedProvider && !!decodedRepoId,
    retry: false,
  })

  const { data: queueData } = useQuery({
    queryKey: ['queue', repoName],
    queryFn: () => fetchQueueStatus(repoName ? { repo: repoName } : undefined),
    enabled: !!repoName,
    refetchInterval: 10000,
  })

  const { data: eventsData } = useQuery({
    queryKey: ['repo-events', repoName],
    queryFn: () => fetchEvents({ repo: repoName, limit: 10 }),
    enabled: !!repoName,
  })

  const contributors = Array.isArray(contributorsData) ? contributorsData : []
  const events = Array.isArray(eventsData?.events) ? eventsData.events : []
  const chartData = normalizeActivityData(activityData)

  const issueChartData =
    issueSummary != null
      ? [
          { name: 'Clean PRs', value: issueSummary.reviewsWithNoIssues ?? 0, fill: PIE_COLORS[0] },
          { name: 'PRs with issues', value: issueSummary.reviewsWithIssues ?? 0, fill: PIE_COLORS[1] },
        ].filter((d) => d.value > 0)
      : []

  if (!decodedProvider || !decodedRepoId) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate('/projects')}>
          Back to repositories
        </Button>
        <p className="text-[var(--color-text-secondary)]">Missing provider or repo.</p>
      </div>
    )
  }

  if (overviewError) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate('/projects')}>
          Back to repositories
        </Button>
        <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error-muted)] px-4 py-4 text-sm text-[var(--color-error)]">
          {overviewError instanceof Error ? overviewError.message : 'Failed to load repository'}
        </div>
      </div>
    )
  }

  const displayName = overview?.repoName ?? decodedRepoId

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="size-4" />}
          onClick={() => navigate('/projects')}
        >
          Back to repositories
        </Button>
      </div>

      {/* 1. Repository overview — metrics cards */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{displayName}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {decodedProvider === 'github' ? 'GitHub' : 'GitLab'} · Repository health
        </p>
      </div>

      {overviewLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      )}
      {!overviewLoading && overview != null && (
        <ErrorBoundary
          sectionLabel="Repository overview metrics"
          message="This section failed to load."
          resetKeys={[overview]}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card padding="md">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total PRs reviewed</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{overview?.total ?? '—'}</p>
            </Card>
            <Card padding="md">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Reviews this week</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{overview?.reviewsThisWeek ?? '—'}</p>
            </Card>
            <Card padding="md">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Avg review time</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                {overview?.avgReviewTimeSeconds != null ? `${Math.round(overview.avgReviewTimeSeconds)}s` : '—'}
              </p>
            </Card>
            <Card padding="md">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">AI comments generated</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{overview?.totalComments ?? '—'}</p>
            </Card>
            <Card padding="md">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Failed reviews</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-error)]">{overview?.failedCount ?? '—'}</p>
            </Card>
          </div>
        </ErrorBoundary>
      )}

      {/* 2. Review activity chart */}
      <Card>
        <CardHeader
          title="Review activity"
          subtitle="Reviews per day"
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
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} stroke="var(--color-border)" />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} stroke="var(--color-border)" />
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
              </ChartContainer>
            )}
          </ChartErrorBoundary>
        )}
      </Card>

      {/* 3. Issue distribution */}
      <Card>
        <CardHeader title="Issue distribution" subtitle="PRs with no issues vs PRs with AI feedback" />
        {issuesLoading && (
          <Skeleton className="h-[200px] w-full max-w-[200px]" />
        )}
        {issuesError && (
          <p className="py-6 text-center text-sm text-[var(--color-error)]">
            {issuesError instanceof Error ? issuesError.message : 'Failed to load issue summary'}
          </p>
        )}
        {!issuesLoading && !issuesError && (
          <ChartErrorBoundary chartName="Issue distribution">
            {issueChartData.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
                No data available yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ChartContainer height={200} minHeight={200}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={issueChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {issueChartData.map((_, i) => (
                          <Cell key={i} fill={issueChartData[i].fill} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  <p>Total AI comments: {issueSummary?.totalComments ?? 0}</p>
                </div>
              </div>
            )}
          </ChartErrorBoundary>
        )}
      </Card>

      {/* 4. Contributors */}
      <ErrorBoundary
        sectionLabel="Contributors table"
        message="This section failed to load."
        resetKeys={[contributors]}
      >
        <Card padding="none">
          <div className="p-4 sm:p-5">
            <CardHeader title="Contributors" subtitle="Developers in this repository" />
            {contributors.length === 0 && (
              <EmptyState icon={<Users className="size-6" />} title="No contributors" description="No review activity by author yet." />
            )}
            {contributors.length > 0 && (
              <TableContainer>
                <table className={tableClass}>
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Username</th>
                      <th className={tableHeaderCellClass}>PRs</th>
                      <th className={tableHeaderCellClass}>AI issues</th>
                      <th className={tableHeaderCellClass}>Last activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributors.map((c: RepoContributor, i: number) => (
                      <tr key={i} className={tableBodyRowClass}>
                        <td className={tableCellClass}>{c?.authorUsername ?? '—'}</td>
                        <td className={tableCellClass}>{c?.mrCount ?? 0}</td>
                        <td className={tableCellClass}>{c?.commentCount ?? 0}</td>
                        <td className={`${tableCellClass} text-[var(--color-text-secondary)]`}>{formatTimeAgo(c?.lastActivity ?? null)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableContainer>
            )}
          </div>
        </Card>
      </ErrorBoundary>

      {/* 5. Recent reviews */}
      <ErrorBoundary
        sectionLabel="Recent reviews table"
        message="This section failed to load."
        resetKeys={[eventsData]}
      >
        <Card padding="none">
          <div className="p-4 sm:p-5">
            <CardHeader title="Recent reviews" subtitle="Click a row to open review details" />
            {events.length === 0 && (
              <EmptyState icon={<ListChecks className="size-6" />} title="No recent reviews" description="Reviews will appear here when PRs are processed." />
            )}
            {events.length > 0 && (
              <TableContainer>
                <table className={tableClass}>
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>PR / MR</th>
                      <th className={tableHeaderCellClass}>Author</th>
                      <th className={tableHeaderCellClass}>Issues</th>
                      <th className={tableHeaderCellClass}>AI</th>
                      <th className={tableHeaderCellClass}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev: ReviewEvent, index: number) => (
                      <tr
                        key={ev?.id ?? index}
                        onClick={() => ev?.id != null && navigate(`/reviews/${ev.id}`)}
                        className={tableBodyRowClickableClass}
                      >
                        <td className={tableCellClass}>
                          {ev?.provider === 'github' ? '#' : '!'}
                          {ev?.mrNumber ?? '—'}
                        </td>
                        <td className={tableCellClass}>{ev?.authorUsername ?? '—'}</td>
                        <td className={tableCellClass}>{ev?.commentsPostedCount ?? 0}</td>
                        <td className={`${tableCellClass} text-[var(--color-text-secondary)]`}>{(ev as { aiProvider?: string })?.aiProvider ?? '—'}</td>
                        <td className={`${tableCellClass} text-[var(--color-text-secondary)]`}>
                          {(ev as { durationSeconds?: number })?.durationSeconds != null
                            ? `${(ev as { durationSeconds: number }).durationSeconds}s`
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

      {/* 6. AI performance */}
      {overview != null && (
        <ErrorBoundary
          sectionLabel="AI performance"
          message="This section failed to load."
          resetKeys={[overview]}
        >
          <Card>
            <CardHeader title="AI performance" subtitle="How well the AI review system is working" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total reviews</p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{overview?.total ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Success rate</p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                  {overview?.successRate != null ? `${overview.successRate.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Avg review time</p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                  {overview?.avgReviewTimeSeconds != null ? `${Math.round(overview.avgReviewTimeSeconds)}s` : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Avg tokens used</p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">—</p>
              </div>
            </div>
          </Card>
        </ErrorBoundary>
      )}

      {/* 7. Queue insights */}
      <ErrorBoundary
        sectionLabel="Queue activity"
        message="This section failed to load."
        resetKeys={[queueData]}
      >
        <Card>
          <CardHeader title="Queue activity" subtitle={repoName ? `Jobs for this repo (refreshes every 10s)` : 'Repository-specific queue stats'} />
          {queueData != null && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Pending</p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{queueData?.waiting ?? queueData?.pending ?? 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Active</p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{queueData?.active ?? 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Failed</p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-error)]">{queueData?.failed ?? 0}</p>
              </div>
            </div>
          )}
          {queueData == null && repoName && <p className="text-sm text-[var(--color-text-muted)]">Queue unavailable or no jobs for this repo.</p>}
        </Card>
      </ErrorBoundary>

      {/* 8. Rules */}
      <Card>
        <CardHeader title="Repository rules" subtitle=".nirik/rules.md" />
        {rulesData?.content != null ? (
          <pre className="whitespace-pre-wrap rounded-lg bg-[var(--color-surface-hover)] p-4 text-sm text-[var(--color-text)] overflow-x-auto">
            {rulesData.content}
          </pre>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            No <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-[var(--color-text)]">.nirik/rules.md</code> found, or repo not accessible. Rules are read when each review runs.
          </p>
        )}
      </Card>

      {/* 9. Repository settings — placeholder */}
      <Card>
        <CardHeader title="Repository settings" subtitle="Per-repo configuration" />
        <p className="text-sm text-[var(--color-text-muted)]">Using global defaults. Per-repo settings (AI provider, review mode, ignore files, max diff size) can be added in a future update.</p>
      </Card>

      {/* 10. Health score */}
      {healthScore != null && (
        <Card>
          <CardHeader title="Repository health" subtitle="Score and reasons" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="size-8 text-[var(--color-primary)]" />
              <span className="text-3xl font-bold text-[var(--color-text)]">
                {typeof healthScore?.score === 'number' ? healthScore.score.toFixed(1) : '—'}
              </span>
              <span className="text-[var(--color-text-secondary)]">/ 10</span>
            </div>
            <ul className="list-disc list-inside text-sm text-[var(--color-text-secondary)] space-y-1">
              {(Array.isArray(healthScore?.reasons) ? healthScore.reasons : []).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  )
}
