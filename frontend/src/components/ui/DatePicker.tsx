import * as React from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string           // 'yyyy-MM-dd' format
  onChange?: (value: string) => void
  label?: string
  error?: string
}

/**
 * DatePicker — input type="date" estilizado con las variables de tema de Finza.
 *
 * Usa color-scheme: light/dark para que el calendario nativo del browser
 * también respete el tema oscuro/claro. El icono y los colores de texto/fondo
 * se toman de --surface-raised, --text-primary y --accent.
 *
 * Compatible con react-hook-form via forwardRef.
 */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    { className, label, error, id, value, onChange, disabled, ...props },
    ref
  ) => {
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

        <div className="relative">
          <CalendarDays
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-[1]"
          />
          <input
            id={inputId}
            type="date"
            ref={ref}
            value={value ?? ''}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              'finza-input w-full pl-8',
              '[color-scheme:light] dark:[color-scheme:dark]',
              disabled && 'opacity-50 cursor-not-allowed',
              error && 'border-alert-red',
              className
            )}
            {...props}
          />
        </div>

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

