import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const inputBase =
  'w-full px-3 py-2.5 text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg placeholder-[var(--color-text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent'

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${inputBase} ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={props.id ? `${props.id}-error` : undefined} className="mt-1.5 text-sm text-[var(--color-error)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={props.id ? `${props.id}-hint` : undefined} className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
