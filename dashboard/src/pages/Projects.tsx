import { useQuery } from '@tanstack/react-query'
import { fetchProjects } from '@/api/analytics'
import { Card, CardHeader } from '@/components/ui/Card'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { FolderKanban } from 'lucide-react'

export function Projects() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
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

      <Card padding="none">
        <CardHeader
          title="Repositories"
          subtitle={data ? `${data.length} projects` : undefined}
        />
        {isLoading && (
          <div className="px-5 pb-5">
            <SkeletonTable rows={8} cols={4} />
          </div>
        )}
        {!isLoading && data && (
          <>
            {data.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="size-6" />}
                title="No projects yet"
                description="Connect a repository to see review activity here."
              />
            ) : (
              <div className="overflow-x-auto">
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
                        MR count
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr
                        key={`${row.provider}-${row.repoId}-${i}`}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]/50 transition-colors"
                      >
                        <td className="px-5 py-3 text-[var(--color-text)]">
                          {row.provider}
                        </td>
                        <td className="px-5 py-3 text-[var(--color-text)]">
                          {row.repoName}
                        </td>
                        <td className="px-5 py-3 text-[var(--color-text)]">
                          {row.mrCount}
                        </td>
                        <td className="px-5 py-3 text-[var(--color-text)]">
                          {row.commentCount}
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
