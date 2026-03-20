import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ToggleGroupOption {
  value: string
  label: string
  icon?: React.ReactNode
  title?: string
}

export interface ToggleGroupProps {
  /** Valor actualmente seleccionado */
  value: string
  /** Callback cuando el usuario selecciona una opción */
  onValueChange: (value: string) => void
  options: ToggleGroupOption[]
  className?: string
  /** 'sm' = compact (sidebar), 'md' = normal (settings page) */
  size?: 'sm' | 'md'
}

/**
 * ToggleGroup — grupo de botones de selección exclusiva.
 * Reemplaza los botones individuales de tema e idioma.
 *
 * Sin dependencia de @radix-ui, implementado desde cero con Tailwind.
 */
export function ToggleGroup({
  value,
  onValueChange,
  options,
  className,
  size = 'sm',
}: ToggleGroupProps): JSX.Element {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex rounded-lg border border-[var(--border)] overflow-hidden',
        'bg-[var(--surface-raised)] dark:bg-white/[0.04]',
        className
      )}
    >
      {options.map((opt, i) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.title ?? opt.label}
            onClick={() => onValueChange(opt.value)}
            aria-pressed={isActive}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 transition-all duration-150 font-medium',
              i < options.length - 1 &&
                'border-r border-[var(--border)] dark:border-white/[0.08]',
              size === 'sm' ? 'px-2.5 py-1.5 text-[11px]' : 'px-4 py-2 text-sm',
              isActive
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : [
                    'text-slate-500 dark:text-white/50',
                    'hover:text-slate-800 dark:hover:text-white/80',
                    'hover:bg-slate-100 dark:hover:bg-white/[0.06]',
                  ].join(' ')
            )}
          >
            {opt.icon && (
              <span className="shrink-0" aria-hidden="true">
                {opt.icon}
              </span>
            )}
            <span>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
