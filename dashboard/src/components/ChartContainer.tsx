import { type ReactNode } from 'react'

interface ChartContainerProps {
  children: ReactNode
  /** Height in pixels. Default 300. */
  height?: number
  /** Optional min-height (defaults to height). */
  minHeight?: number
  className?: string
}

/**
 * Wrapper that gives Recharts ResponsiveContainer explicit dimensions
 * so charts don't collapse on different screen sizes.
 */
export function ChartContainer({
  children,
  height = 300,
  minHeight,
  className = '',
}: ChartContainerProps) {
  const effectiveMin = minHeight ?? height
  return (
    <div
      className={`w-full ${className}`.trim()}
      style={{ minHeight: effectiveMin, height, width: '100%' }}
    >
      {children}
    </div>
  )
}
