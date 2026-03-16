import { type ReactNode } from 'react'

export interface ErrorFallbackProps {
  /** Primary message (e.g. "This section failed to load.") */
  message: string
  /** Optional error detail shown in smaller text */
  errorMessage?: string | null
  /** Called when user clicks "Try again" */
  onRetry?: () => void
  /** Optional icon above the message */
  icon?: ReactNode
  /** Extra class for the container */
  className?: string
}

/**
 * Shared fallback UI for error boundaries. Matches dark theme and SaaS dashboard styling.
 */
export function ErrorFallback({
  message,
  errorMessage,
  onRetry,
  icon,
  className = '',
}: ErrorFallbackProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center min-h-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`.trim()}
    >
      {icon != null && (
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">
        {message}
      </p>
      {errorMessage && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {errorMessage}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] rounded px-3 py-1.5"
        >
          Try again
        </button>
      )}
    </div>
  )
}
