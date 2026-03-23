import * as React from 'react'
import { cn } from '@/lib/utils'

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

/**
 * DatePicker — thin wrapper around <input type="date"> with Finza theme styles.
 * All native input props (including react-hook-form register() spread) flow through unchanged.
 */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, id, disabled, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || 'datepicker'

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}

        <input
          id={inputId}
          type="date"
          ref={ref}
          disabled={disabled}
          className={cn(
            'finza-input w-full',
            '[color-scheme:light] dark:[color-scheme:dark]',
            'dark:[&::-webkit-calendar-picker-indicator]:invert',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-alert-red',
            className
          )}
          {...props}
        />

        {error && (
          <p className="text-xs text-alert-red" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'

export { DatePicker }

