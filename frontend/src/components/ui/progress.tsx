import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number // 0-100
  className?: string
  colorClass?: string
}

export function Progress({ value, className, colorClass }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, value))
  const color =
    colorClass ??
    (pct >= 100 ? 'bg-alert-red' : pct >= 80 ? 'bg-golden-flow' : 'bg-prosperity-green')

  return (
    <div className={cn('w-full h-2 bg-border rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
