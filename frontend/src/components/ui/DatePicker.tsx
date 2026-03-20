import * as React from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string           // 'yyyy-MM-dd' format
  onChange?: (value: string) => void
  label?: string
  error?: string
}

/** Formatea yyyy-MM-dd -> dd/MM/yyyy para mostrar en el trigger */
function formatDisplayDate(value: string): string {
  if (!value) return ''
  const parts = value.split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/**
 * DatePicker — reemplaza <Input type="date"> en todos los formularios.
 *
 * Estrategia: una div estilizada muestra la fecha formateada (dd/MM/yyyy)
 * mientras un <input type="date"> invisible con `absolute inset-0 opacity-0`
 * captura los clicks y abre el selector nativo del sistema (consistente en mobile).
 *
 * Compatible con react-hook-form: acepta los mismos props que un <input>
 * y usa forwardRef para pasar la ref de register().
 */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    { className, label, error, id, value, onChange, placeholder = 'dd/MM/yyyy', disabled, ...props },
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
          {/* Display trigger */}
          <div
            className={cn(
              'finza-input w-full flex items-center gap-2 pointer-events-none select-none',
              disabled && 'opacity-50',
              error && 'border-alert-red',
              className
            )}
            aria-hidden="true"
          >
            <CalendarDays
              size={15}
              className="text-[var(--text-muted)] shrink-0"
            />
            <span
              className={cn(
                'flex-1 text-sm',
                !value && 'text-[var(--text-muted)]'
              )}
            >
              {value ? formatDisplayDate(String(value)) : placeholder}
            </span>
          </div>

          {/* Input nativo invisible */}
          <input
            id={inputId}
            type="date"
            value={value ?? ''}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
            className="absolute inset-0 opacity-0 w-full cursor-pointer disabled:cursor-not-allowed"
            ref={ref}
            aria-label={label || String(placeholder)}
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
