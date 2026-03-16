import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchQueueStatus, fetchRetries } from '@/api/queue'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Layers, RefreshCw } from 'lucide-react'

export function Queue() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['queue'],
    queryFn: fetchQueueStatus,
    refetchInterval: 5000,
  })
  const {
    data: retriesData,
    error: retriesError,
    isLoading: retriesLoading,
    refetch: refetchRetries,
  } = useQuery({
    queryKey: ['queue', 'retries'],
    queryFn: fetchRetries,
    refetchInterval: 10000,
  })

  const safeData = data ?? {}

  useEffect(() => {
    if (retriesError) {
      console.error('[Queue] Failed to load retries:', retriesError)
    }
  }, [retriesError])

  if (error) {
    console.error('[Queue] Failed to load queue status:', error)
    const message = error instanceof Error ? error.message : 'Failed to load queue status.'
    const isQueueUnavailable =
      message.toLowerCase().includes('queue unavailable') ||
      message.toLowerCase().includes('redis')
    return (
      <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error-muted)] px-4 py-4 text-sm text-[var(--color-error)]">
        <p>
          Unable to load data at the moment.{' '}
          {message}
        </p>
        {isQueueUnavailable && (
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Ensure Redis is running and the server has started the worker.
          </p>
        )}
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          Retry
        </button>
      </div>
    )
  }

  const handlePageReset = () => {
    refetch()
    refetchRetries()
  }

  return (
    <ErrorBoundary
      sectionLabel="Queue page"
      message="Something went wrong on this page."
      onReset={handlePageReset}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Queue status</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            BullMQ review queue and worker health. Refreshes every 5 seconds.
          </p>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-[var(--radius-lg)]" />
            ))}
          </div>
        )}

        {!isLoading && data != null && (
          <>
            <ErrorBoundary sectionLabel="Queue stats" message="Something went wrong while loading this section.">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <Card padding="md">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">Pending</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                    {safeData.waiting ?? safeData.pending ?? 0}
                  </p>
                </Card>
                <Card padding="md">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">Active</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                    {safeData.active ?? 0}
                  </p>
                </Card>
                <Card padding="md">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">Completed</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                    {safeData.completed ?? 0}
                  </p>
                </Card>
                <Card padding="md">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">Failed</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--color-error)]">
                    {safeData.failed ?? 0}
                  </p>
                </Card>
                <Card padding="md">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">Workers</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                    {safeData.workers ?? '—'}
                  </p>
                </Card>
              </div>
            </ErrorBoundary>

          <ErrorBoundary
            sectionLabel="Retry Monitor"
            message="Unable to load retry data at the moment."
          >
            <Card>
              <CardHeader
                title="Retry Monitor"
                subtitle="Helps debugging production when AI fails (e.g. API timeouts)"
              />
              <div className="p-4 sm:p-5 space-y-2">
                {retriesError ? (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Unable to load retry data at the moment.
                    <button
                      type="button"
                      onClick={() => refetchRetries()}
                      className="ml-2 underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      Retry
                    </button>
                  </p>
                ) : retriesLoading ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="size-4 text-[var(--color-text-secondary)]" />
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Retries today:
                      </span>
                      <span className="text-lg font-semibold text-[var(--color-text)]">
                        {retriesData?.retriesToday ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Last failure:
                      </span>
                      <span className="ml-2 text-sm text-[var(--color-text)]">
                        {retriesData?.lastFailure?.reason ?? '—'}
                      </span>
                      {retriesData?.lastFailure?.at && (
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          {new Date(retriesData.lastFailure.at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </ErrorBoundary>
        </>
      )}

      {!isLoading && !data && !error && (
        <Card>
          <EmptyState
            icon={<Layers className="size-6" />}
            title="Queue unavailable"
            description="Redis or the review queue may not be configured. Ensure Redis is running and the server has started the worker."
          />
        </Card>
      )}
      </div>
    </ErrorBoundary>
  )
}
