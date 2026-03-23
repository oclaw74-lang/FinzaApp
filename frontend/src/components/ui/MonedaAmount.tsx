import { useCurrencyConvert } from '@/hooks/useCurrencyConvert'
import { cn } from '@/lib/utils'

interface MonedaAmountProps {
  amount: number
  moneda: string
  /** Show equivalent in main currency when moneda != monedaPrincipal */
  showConverted?: boolean
  /** Text size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  convertedClassName?: string
}

const SIZE_MAP = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
}

/**
 * Displays a monetary amount in its original currency.
 * Optionally shows the converted equivalent in the user's main currency.
 *
 * Example:
 *   <MonedaAmount amount={500} moneda="USD" showConverted />
 *   → "US$ 500.00"
 *      "≈ RD$ 29,000.00"  (below, in muted text)
 */
export function MonedaAmount({
  amount,
  moneda,
  showConverted = false,
  size = 'sm',
  className,
  convertedClassName,
}: MonedaAmountProps) {
  const { showDual } = useCurrencyConvert()
  const { original, converted } = showDual(amount, moneda)

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className={cn('font-bold money', SIZE_MAP[size])}>
        {original}
      </span>
      {showConverted && converted && (
        <span className={cn('text-[11px] text-[var(--text-muted)]', convertedClassName)}>
          {converted}
        </span>
      )}
    </span>
  )
}
