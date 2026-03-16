import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchUsers, fetchCodeQualityInsights } from '@/api/analytics'
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
import { Users as UsersIcon } from 'lucide-react'
import type { UserRow } from '@/api/analytics'

function formatLastActivity(iso: string | null): string {
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

function userProfilePath(row: UserRow): string {
  const provider = encodeURIComponent(row.provider)
  const username = encodeURIComponent(row.authorUsername ?? '')
  return `/users/${provider}/${username}`
}

export function Users() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })
  const { data: codeQuality } = useQuery({
    queryKey: ['code-quality-insights'],
    queryFn: fetchCodeQualityInsights,
  })

  const categoryLabels: Record<string, string> = {
    error_handling: 'Missing error handling',
    unused_variables: 'Unused variables',
    security: 'Security warnings',
    performance: 'Performance suggestions',
    other: 'Other',
  }
  const categoriesObj =
    codeQuality != null &&
    typeof codeQuality === 'object' &&
    !Array.isArray(codeQuality) &&
    codeQuality.categories != null &&
    typeof codeQuality.categories === 'object'
      ? codeQuality.categories
      : {}
  const categoryEntries = Object.entries(categoriesObj).sort((a, b) => Number(b[1]) - Number(a[1]))

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error-muted)] px-4 py-4 text-sm text-[var(--color-error)]">
        Error: {error instanceof Error ? error.message : 'Failed to load users'}
      </div>
    )
  }

  const topContributors = data?.slice(0, 5) ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Users</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Contributors with review activity (MRs and comments). Click a row to view profile.
        </p>
      </div>

      {categoryEntries.length > 0 && (
        <ErrorBoundary
          sectionLabel="Code quality insights"
          message="This section failed to load."
          resetKeys={[codeQuality]}
        >
          <Card>
            <CardHeader
              title="Code quality insights"
              subtitle="Common issues detected across all users' PRs"
            />
            <ul className="p-4 sm:p-5 pt-0 space-y-2">
              {categoryEntries.slice(0, 8).map(([key, count]) => (
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

      {Array.isArray(data) && data.length > 0 && (
        <ErrorBoundary
          sectionLabel="Top contributors"
          message="This section failed to load."
          resetKeys={[data]}
        >
          <Card>
            <CardHeader
              title="Top contributors"
              subtitle="By PRs reviewed"
            />
            <ul className="space-y-2">
              {topContributors.map((row, i) => (
                <li key={`${row?.provider}-${row?.authorUsername ?? i}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-hover)]/50"
                    onClick={() => row != null && navigate(userProfilePath(row))}
                  >
                    <span className="font-medium text-[var(--color-text)]">
                      {i + 1}. {row?.authorUsername ?? '—'}
                    </span>
                    <span className="text-[var(--color-text-secondary)]">
                      {row?.mrCount ?? 0} PRs
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </ErrorBoundary>
      )}

      <ErrorBoundary
        sectionLabel="Contributors table"
        message="This section failed to load."
        resetKeys={[data]}
      >
        <Card padding="none">
          <div className="p-4 sm:p-5">
            <CardHeader
              title="Contributors"
              subtitle={Array.isArray(data) ? `${data.length} users` : undefined}
            />
            {isLoading && (
              <div className="overflow-x-auto">
                <SkeletonTable rows={6} cols={9} />
              </div>
            )}
            {!isLoading && Array.isArray(data) && (
              <>
                {data.length === 0 ? (
                  <EmptyState
                    icon={<UsersIcon className="size-6" />}
                    title="No users yet"
                    description="User activity will appear here once pull requests are reviewed."
                  />
                ) : (
                  <>
                    {/* Desktop: table */}
                    <div className="hidden sm:block">
                      <TableContainer>
                        <table className={tableClass}>
                          <thead>
                            <tr className={tableHeaderRowClass}>
                              <th className={tableHeaderCellClass}>Username</th>
                              <th className={tableHeaderCellClass}>Full Name</th>
                              <th className={tableHeaderCellClass}>Provider</th>
                              <th className={tableHeaderCellClass}>Total PRs / MRs</th>
                              <th className={tableHeaderCellClass}>Reviews processed</th>
                              <th className={tableHeaderCellClass}>AI comments</th>
                              <th className={tableHeaderCellClass}>Issues detected</th>
                              <th className={tableHeaderCellClass}>Last activity</th>
                              <th className={tableHeaderCellClass}>Repos contributed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((row, i) => (
                              <tr
                                key={`${row?.provider}-${row?.authorUsername ?? i}`}
                                className={tableBodyRowClickableClass}
                                onClick={() => row != null && navigate(userProfilePath(row))}
                              >
                                <td className={`${tableCellClass} font-medium`}>
                                  {row?.authorUsername ?? '—'}
                                </td>
                                <td className={tableCellClass}>—</td>
                                <td className={`${tableCellClass} capitalize`}>
                                  {row?.provider ?? '—'}
                                </td>
                                <td className={tableCellClass}>{row?.mrCount ?? 0}</td>
                                <td className={tableCellClass}>{row?.mrCount ?? 0}</td>
                                <td className={tableCellClass}>{row?.commentCount ?? 0}</td>
                                <td className={tableCellClass}>{row?.commentCount ?? 0}</td>
                                <td className={`${tableCellClass} text-[var(--color-text-secondary)]`}>
                                  {formatLastActivity(row?.lastActivity ?? null)}
                                </td>
                                <td className={tableCellClass}>
                                  {row?.repositories?.length ?? 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TableContainer>
                    </div>
                    {/* Mobile: cards */}
                    <div className="space-y-3 sm:hidden">
                      {data.map((row, i) => (
                        <div
                          key={`${row?.provider}-${row?.authorUsername ?? i}`}
                          role="button"
                          tabIndex={0}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)]/30 p-4 cursor-pointer hover:bg-[var(--color-surface-hover)]/50"
                          onClick={() => row != null && navigate(userProfilePath(row))}
                          onKeyDown={(e) => e.key === 'Enter' && row != null && navigate(userProfilePath(row))}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[var(--color-text)]">
                              {row?.authorUsername ?? 'Unknown'}
                            </span>
                            <span className="shrink-0 rounded bg-[var(--color-primary-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)] capitalize">
                              {row?.provider ?? '—'}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-text-secondary)]">
                            <span>PRs: {row?.mrCount ?? 0}</span>
                            <span>AI comments: {row?.commentCount ?? 0}</span>
                            <span>Issues: {row?.commentCount ?? 0}</span>
                            <span>{row?.repositories?.length ?? 0} repos</span>
                            <span>{formatLastActivity(row?.lastActivity ?? null)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </Card>
      </ErrorBoundary>
    </div>
  )
}
