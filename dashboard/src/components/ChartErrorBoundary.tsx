import React, { type ReactNode } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'

interface ChartErrorBoundaryProps {
  children: ReactNode
  /** Optional label for console.error (e.g. "Activity chart") */
  chartName?: string
  fallback?: ReactNode
  /** When these keys change, error state is cleared so the boundary can recover. */
  resetKeys?: unknown[]
  /** Called when user clicks "Try again"; use to refetch or remount. */
  onReset?: () => void
}

interface ChartErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary for chart sections. Catches render errors, logs them,
 * and shows a friendly fallback so one bad chart doesn't break the page.
 * Supports reset via resetKeys or onReset / "Try again" button.
 */
export class ChartErrorBoundary extends React.Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error): void {
    const label = this.props.chartName ? `[${this.props.chartName}] ` : ''
    console.error(`${label}Chart failed to load:`, error)
  }

  componentDidUpdate(prevProps: ChartErrorBoundaryProps): void {
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
      return (
        <ErrorFallback
          message="Chart couldn't be loaded."
          errorMessage={this.state.error?.message ?? undefined}
          onRetry={this.props.onReset != null ? this.handleRetry : undefined}
        />
      )
    }
    return this.props.children
  }
}
