import * as React from 'react'
import { cn } from '@/lib/utils'

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string           // 'yyyy-MM-dd' format
  onChange?: (value: string) => void
  label?: string
  error?: string
}

/**
 * Reusable date picker component wrapping native <input type="date">.
 * Provides consistent finza-input styling and label/error patterns.
 */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, label, error, id, className, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </label>
        )}
        <input
          type="date"
          id={inputId}
          ref={ref}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'finza-input w-full',
            error && 'border-alert-red focus:ring-alert-red/30 focus:border-alert-red',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-alert-red">{error}</p>}
      </div>
    )
  }
)
DatePicker.displayName = 'DatePicker'

export { DatePicker }
