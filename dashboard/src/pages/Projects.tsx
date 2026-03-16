import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchProjects, fetchReposHealthList, repoPath } from '@/api/analytics'
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
import { FolderKanban } from 'lucide-react'
import type { ProjectRow } from '@/api/analytics'

export function Projects() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })
  const { data: healthList } = useQuery({
    queryKey: ['repos-health'],
    queryFn: fetchReposHealthList,
  })

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error-muted)] px-4 py-4 text-sm text-[var(--color-error)]">
        Error:{' '}
        {error instanceof Error ? error.message : 'Failed to load projects'}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Projects
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Repositories with review activity
        </p>
      </div>

      {Array.isArray(healthList) && healthList.length > 0 && (
        <ErrorBoundary
          sectionLabel="Repository health"
          message="This section failed to load."
          resetKeys={[healthList]}
        >
          <Card>
            <CardHeader
              title="Repository Health"
              subtitle="Score out of 10 (issues per PR, success rate, contributor activity)"
            />
            <ul className="p-4 sm:p-5 pt-0 space-y-2">
              {healthList.map((h, index) => (
                <li
                  key={`${h?.provider}-${h?.repoId}-${index}`}
                  className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)] last:border-0"
                >
                  <Link
                    to={`/projects/${encodeURIComponent(h?.provider ?? '')}/${encodeURIComponent(h?.repoId ?? '')}`}
                    className="font-medium text-[var(--color-primary)] hover:underline truncate"
                  >
                    {h?.repoName ?? '—'}
                  </Link>
                  <span className="shrink-0 text-lg font-semibold text-[var(--color-text)]">
                    {typeof h?.score === 'number' ? h.score.toFixed(1) : '—'} /
                    10
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </ErrorBoundary>
      )}

      <ErrorBoundary
        sectionLabel="Repositories table"
        message="This section failed to load."
        resetKeys={[data]}
      >
        <Card padding="none">
          <div className="p-4 sm:p-5">
            <CardHeader
              title="Repositories"
              subtitle={
                Array.isArray(data) ? `${data.length} projects` : undefined
              }
            />
            {isLoading && (
              <div className="overflow-x-auto">
                <SkeletonTable rows={8} cols={4} />
              </div>
            )}
            {!isLoading && Array.isArray(data) && (
              <>
                {data.length === 0 ? (
                  <EmptyState
                    icon={<FolderKanban className="size-6" />}
                    title="No projects yet"
                    description="Connect a repository to see review activity here."
                  />
                ) : (
                  <>
                    {/* Desktop: table */}
                    <div className="hidden sm:block">
                      <TableContainer>
                        <table className={tableClass}>
                          <thead>
                            <tr className={tableHeaderRowClass}>
                              <th className={tableHeaderCellClass}>Provider</th>
                              <th className={tableHeaderCellClass}>Repo</th>
                              <th className={tableHeaderCellClass}>MR count</th>
                              <th className={tableHeaderCellClass}>Comments</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((row, i) => (
                              <tr
                                key={`${row?.provider}-${row?.repoId}-${i}`}
                                className={tableBodyRowClass}
                              >
                                <td
                                  className={tableCellClass}
                                  data-label="Provider"
                                >
                                  {row?.provider ?? '—'}
                                </td>
                                <td
                                  className={tableCellClass}
                                  data-label="Repo"
                                >
                                  <Link
                                    to={`/projects/${repoPath(row?.provider ?? '', row?.repoId ?? '')}`}
                                    className="font-medium text-[var(--color-primary)] hover:underline"
                                  >
                                    {row?.repoName ?? '—'}
                                  </Link>
                                </td>
                                <td
                                  className={tableCellClass}
                                  data-label="MR count"
                                >
                                  {row?.mrCount ?? 0}
                                </td>
                                <td
                                  className={tableCellClass}
                                  data-label="Comments"
                                >
                                  {row?.commentCount ?? 0}
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
                        <Link
                          key={`${row?.provider}-${row?.repoId}-${i}`}
                          to={`/projects/${repoPath(row?.provider ?? '', row?.repoId ?? '')}`}
                          className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)]/30 p-4 hover:bg-[var(--color-surface-hover)]/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[var(--color-primary)] truncate">
                              {row?.repoName ?? '—'}
                            </span>
                            <span className="shrink-0 rounded bg-[var(--color-primary-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                              {row?.provider ?? '—'}
                            </span>
                          </div>
                          <div className="mt-2 flex gap-4 text-sm text-[var(--color-text-secondary)]">
                            <span>MRs: {row?.mrCount ?? 0}</span>
                            <span>Comments: {row?.commentCount ?? 0}</span>
                          </div>
                        </Link>
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
