import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/utils'

interface MoneyDisplayProps {
  amount: number
  currency?: string
  type?: 'ingreso' | 'egreso' | 'neutral'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
}

const typeClasses = {
  ingreso: 'text-prosperity-green',
  egreso: 'text-alert-red',
  neutral: 'text-gray-900',
}

export function MoneyDisplay({
  amount,
  currency = 'DOP',
  type = 'neutral',
  size = 'md',
  className,
}: MoneyDisplayProps): JSX.Element {
  return (
    <span className={cn('money font-semibold', sizeClasses[size], typeClasses[type], className)}>
      {type === 'ingreso' && '+'}
      {type === 'egreso' && '-'}
      {formatMoney(Math.abs(amount), currency)}
    </span>
  )
}
