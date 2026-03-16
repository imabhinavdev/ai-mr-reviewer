import { type ReactNode } from 'react'

/** Shared table class names for consistent spacing and responsiveness. */

/** Wrapper when card body has p-4 sm:p-5 (padding="none" cards). Table scrolls edge-to-edge. */
export const tableWrapperClass = 'overflow-x-auto -mx-4 -mb-4 sm:-mx-5 sm:-mb-5'

/** Wrapper when card has default padding (e.g. Analytics). Table full-bleed within card. */
export const tableWrapperPaddedCardClass = 'overflow-x-auto -mx-5 -mb-5'

export const tableClass = 'w-full min-w-[560px] border-collapse text-sm'

export const tableHeaderCellClass =
  'px-4 py-3 sm:px-5 text-left font-medium text-[var(--color-text-secondary)]'

export const tableCellClass = 'px-4 py-3 sm:px-5 text-[var(--color-text)]'

export const tableHeaderRowClass = 'border-b border-[var(--color-border)]'

export const tableBodyRowClass =
  'border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]/50 transition-colors'

export const tableBodyRowClickableClass =
  'border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]/50 transition-colors cursor-pointer'

interface TableContainerProps {
  children: ReactNode
  /** Use when parent card has padding="none" and content wrapper has p-4 sm:p-5. Default true. */
  inset?: boolean
  className?: string
}

export function TableContainer({
  children,
  inset = true,
  className = '',
}: TableContainerProps) {
  const wrapperClass = inset ? tableWrapperClass : tableWrapperPaddedCardClass
  return <div className={`${wrapperClass} ${className}`.trim()}>{children}</div>
}
