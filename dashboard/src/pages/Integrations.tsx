import { Plug, Github, GitBranch } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function Integrations() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Connect your Git providers and tools
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader
            title="GitHub"
            subtitle="Review pull requests from GitHub repositories"
            action={
              <Button variant="secondary" size="sm" disabled>
                Coming soon
              </Button>
            }
          />
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--color-surface-hover)]">
              <Github className="size-5" />
            </div>
            <p className="text-sm">
              Connect your GitHub account to enable PR reviews.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="GitLab"
            subtitle="Review merge requests from GitLab"
            action={
              <Button variant="secondary" size="sm" disabled>
                Coming soon
              </Button>
            }
          />
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--color-surface-hover)]">
              <GitBranch className="size-5" />
            </div>
            <p className="text-sm">
              GitLab integration will be available in a future release.
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-8">
        <EmptyState
          icon={<Plug className="size-6" />}
          title="More integrations coming"
          description="We're working on Bitbucket, Azure DevOps, and webhook-based custom integrations."
        />
      </Card>
    </div>
  )
}
