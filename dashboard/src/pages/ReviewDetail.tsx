import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchReviewEvent, fetchReviewCompare, fetchEvents } from '@/api/analytics'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ArrowLeft, ExternalLink } from 'lucide-react'

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
    const encoded = encodeURIComponent(repoName.replace('/', '%2F'))
    return `https://gitlab.com/${repoName}/-/merge_requests/${mrNumber}`
  }
  return null
}

function formatTs(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export function ReviewDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentId = id != null && !Number.isNaN(Number(id)) ? Number(id) : null
  const [compareId, setCompareId] = useState<number | ''>('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['review', id],
    queryFn: () => fetchReviewEvent(Number(id)),
    enabled: currentId != null,
  })

  const { data: compareData, isLoading: compareLoading } = useQuery({
    queryKey: ['review-compare', currentId, compareId],
    queryFn: () => fetchReviewCompare(currentId!, compareId as number),
    enabled: currentId != null && typeof compareId === 'number' && compareId !== currentId,
  })

  const { data: eventsList } = useQuery({
    queryKey: ['events-list-for-compare'],
    queryFn: () => fetchEvents({ limit: 100, offset: 0 }),
    enabled: !!compareId,
  })
  const eventsArray = Array.isArray(eventsList?.events) ? eventsList.events : []
  const otherReviews = eventsArray.filter((e) => e?.id !== currentId)

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="size-4" />} onClick={() => navigate('/reviews')}>
          Back to reviews
        </Button>
        <div className="rounded-lg border border-[var(--color-error)]/50 bg-[var(--color-error-muted)] px-4 py-4 text-sm text-[var(--color-error)]">
          {error instanceof Error ? error.message : 'Failed to load review'}
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const prUrl = buildPrUrl(data.provider, data.repoName, data.mrNumber)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="size-4" />}
          onClick={() => navigate('/reviews')}
        >
          Back to reviews
        </Button>
        {prUrl && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ExternalLink className="size-4" />}
            onClick={() => window.open(prUrl, '_blank')}
          >
            View on {data.provider === 'github' ? 'GitHub' : 'GitLab'}
          </Button>
        )}
      </div>

      <ErrorBoundary
        sectionLabel="Review metadata and timeline"
        message="This section failed to load."
        resetKeys={[data]}
      >
        <Card>
          <CardHeader title="Review metadata" subtitle={`${data?.repoName ?? '—'} · ${data?.provider === 'github' ? 'PR' : 'MR'} ${data?.provider === 'github' ? '#' : '!'}${data?.mrNumber ?? '—'}`} />
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Repository</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">{data?.repoName ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">PR / MR</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">
                {data?.provider === 'github' ? '#' : '!'}{data?.mrNumber ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Provider</dt>
              <dd className="mt-0.5 text-[var(--color-text)] capitalize">{data?.provider ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">AI</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">
                {data?.aiProvider ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Duration</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">
                {data?.durationSeconds != null ? `${data.durationSeconds}s` : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Status</dt>
              <dd className="mt-0.5">
                <span className={statusColor[data?.status ?? ''] ?? 'text-[var(--color-text)]'}>
                  {data?.status ?? '—'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Comments posted</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">{data?.commentsPostedCount ?? 0}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Created</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">
                {data?.createdAt ? new Date(data.createdAt).toLocaleString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Updated</dt>
              <dd className="mt-0.5 text-[var(--color-text)]">
                {data?.updatedAt ? new Date(data.updatedAt).toLocaleString() : '—'}
              </dd>
            </div>
            {data?.failureReason && (
              <div className="sm:col-span-2">
                <dt className="font-medium text-[var(--color-text-secondary)]">Failure reason</dt>
                <dd className="mt-0.5 text-[var(--color-error)]">{data.failureReason}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Review Timeline */}
        <Card>
          <CardHeader
            title="Review Timeline"
            subtitle="Lifecycle of this review"
          />
          <div className="p-4 sm:p-5 space-y-0">
            {[
              { label: 'Webhook Received', ts: data?.createdAt },
              { label: 'Job Queued', ts: data?.queuedAt ?? data?.createdAt },
              { label: 'Diff Fetched', ts: data?.diffFetchedAt },
              { label: 'AI Review', ts: data?.aiStartedAt },
              { label: 'Comments Posted', ts: data?.commentsPostedAt },
            ].map((step, i) => (
              <div key={step.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-2.5 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
                  {i < 4 && (
                    <div className="w-px flex-1 min-h-[12px] bg-[var(--color-border)] my-0.5" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-[var(--color-text)]">{step.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatTs(step.ts)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </ErrorBoundary>

      {/* Review Comparison */}
      <ErrorBoundary
        sectionLabel="Compare reviews"
        message="This section failed to load."
        resetKeys={[compareId, compareData]}
      >
        <Card>
          <CardHeader
            title="Compare reviews"
            subtitle="Compare two reviews (e.g. before vs after fix)"
          />
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-[var(--color-text-secondary)]">Compare with:</span>
              <select
                value={compareId === '' ? '' : compareId}
                onChange={(e) => setCompareId(e.target.value === '' ? '' : Number(e.target.value))}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              >
                <option value="">Select a review…</option>
                {otherReviews.map((ev) => (
                  <option key={ev?.id} value={ev?.id}>
                    {ev?.repoName ?? '—'} {ev?.provider === 'github' ? '#' : '!'}{ev?.mrNumber ?? '—'} (id: {ev?.id})
                  </option>
                ))}
              </select>
            </div>
            {compareLoading && (
              <p className="text-sm text-[var(--color-text-muted)]">Loading comparison…</p>
            )}
            {compareData != null && !compareLoading && (
              <div className="grid gap-4 sm:grid-cols-2 border-t border-[var(--color-border)] pt-4">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Review A (this)
                  </p>
                  <p className="font-medium text-[var(--color-text)]">
                    {compareData?.event1?.repoName ?? '—'} {data?.provider === 'github' ? '#' : '!'}
                    {compareData?.event1?.mrNumber ?? '—'}
                  </p>
                  <p className="text-2xl font-semibold text-[var(--color-text)] mt-1">
                    Issues: {compareData?.event1?.commentsPostedCount ?? 0}
                  </p>
                  {Array.isArray(compareData?.event1?.findings) && compareData.event1.findings.length > 0 && (
                    <ul className="mt-2 text-xs text-[var(--color-text-muted)] space-y-0.5">
                      {compareData.event1.findings.map((f, i) => (
                        <li key={i}>
                          {f?.category ?? '—'}: {f?.count ?? 0}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Review B (other)
                  </p>
                  <p className="font-medium text-[var(--color-text)]">
                    {compareData?.event2?.repoName ?? '—'} {data?.provider === 'github' ? '#' : '!'}
                    {compareData?.event2?.mrNumber ?? '—'}
                  </p>
                  <p className="text-2xl font-semibold text-[var(--color-text)] mt-1">
                    Issues: {compareData?.event2?.commentsPostedCount ?? 0}
                  </p>
                  {Array.isArray(compareData?.event2?.findings) && compareData.event2.findings.length > 0 && (
                    <ul className="mt-2 text-xs text-[var(--color-text-muted)] space-y-0.5">
                      {compareData.event2.findings.map((f, i) => (
                        <li key={i}>
                          {f?.category ?? '—'}: {f?.count ?? 0}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </ErrorBoundary>
    </div>
  )
}
