import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'finza-input w-full',
            error && 'border-alert-red focus:border-alert-red',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-alert-red">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
