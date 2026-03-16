import React, { type ReactNode } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback UI. If not provided, uses default message. */
  fallback?: ReactNode
  /** Message shown in default fallback (e.g. "This section failed to load.") */
  message?: string
  /** Label for console.error (e.g. "Queue page", "Webhook events table") */
  sectionLabel?: string
  /** When these keys change, error state is cleared so the boundary can recover. */
  resetKeys?: unknown[]
  /** Called when user clicks "Try again"; use to refetch or remount. */
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary for pages and sections. Catches render errors, logs them,
 * and shows a friendly fallback so one failing component doesn't break the app.
 * Supports reset via resetKeys or onReset / "Try again" button.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error): void {
    const label = this.props.sectionLabel ? `[${this.props.sectionLabel}] ` : ''
    console.error(
      `${label}Render error:`,
      error?.message ?? String(error),
      error?.stack ?? '',
    )
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKeys !== this.props.resetKeys) {
      const keysPrev = prevProps.resetKeys ?? []
      const keysNext = this.props.resetKeys ?? []
      if (
        keysPrev.length !== keysNext.length ||
        keysNext.some((k, i) => k !== keysPrev[i])
      ) {
        this.setState({ hasError: false, error: null })
      }
    }
  }

  handleRetry = (): void => {
    this.props.onReset?.()
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      const message = this.props.message ?? 'This section failed to load.'
      return (
        <ErrorFallback
          message={message}
          errorMessage={this.state.error?.message ?? undefined}
          onRetry={this.props.onReset != null ? this.handleRetry : undefined}
        />
      )
    }
    return this.props.children
  }
}
