import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'bg-finza-blue text-white hover:bg-finza-blue-dark active:scale-[.98] focus:ring-finza-blue/30',
        default:
          'bg-finza-blue text-white hover:bg-finza-blue-dark active:scale-[.98] focus:ring-finza-blue/30',
        secondary:
          'bg-surface border border-border text-[var(--text-primary)] hover:bg-surface-raised focus:ring-border',
        ghost:
          'text-[var(--text-muted)] hover:bg-surface-raised hover:text-[var(--text-primary)]',
        destructive:
          'bg-alert-red text-white hover:bg-red-600 focus:ring-alert-red/30',
        danger:
          'bg-alert-red text-white hover:bg-red-600 focus:ring-alert-red/30',
        outline:
          'border border-finza-blue text-finza-blue hover:bg-finza-blue/10 focus:ring-finza-blue/30',
        success:
          'bg-prosperity-green text-white hover:opacity-90 active:scale-[0.98]',
        link:
          'text-finza-blue underline-offset-4 hover:underline',
      },
      size: {
        sm: 'text-xs px-3 py-1.5 h-8',
        md: 'text-sm px-4 py-2 h-10',
        default: 'text-sm px-6 py-3 min-h-[44px]',
        lg: 'text-base px-6 py-3 h-12',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
export { buttonVariants }
