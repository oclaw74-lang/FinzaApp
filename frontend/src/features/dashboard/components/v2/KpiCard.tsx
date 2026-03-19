import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  variationPct?: number
  icon: React.ReactNode
  iconBg: string
  iconColor?: string
  valueColorClass?: string
  subtitle?: string
  className?: string
}

function VariationBadge({ pct }: { pct: number }): JSX.Element {
  if (pct === 0) {
    return <span className="text-xs text-[var(--text-muted)] font-medium">—</span>
  }

  const isPositive = pct > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full border',
        isPositive
          ? 'text-prosperity-green bg-prosperity-green/10 border-prosperity-green/20'
          : 'text-alert-red bg-alert-red/10 border-alert-red/20'
      )}
      aria-label={`${isPositive ? 'Incremento' : 'Reduccion'} de ${Math.abs(pct).toFixed(1)}%`}
    >
      {isPositive ? (
        <TrendingUp size={11} aria-hidden="true" />
      ) : (
        <TrendingDown size={11} aria-hidden="true" />
      )}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function KpiCardSkeleton(): JSX.Element {
  return (
    <div className="rounded-xl border border-[var(--border)] p-5 animate-pulse min-h-[120px]">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-28 bg-[var(--border-strong)] rounded" />
        <div className="w-9 h-9 bg-[var(--border-strong)] rounded-lg" />
      </div>
      <div className="h-7 w-36 bg-[var(--border-strong)] rounded mb-2" />
      <div className="h-3 w-20 bg-[var(--border-strong)] rounded" />
    </div>
  )
}

export function KpiCard({
  title,
  value,
  variationPct,
  icon,
  iconBg,
  iconColor,
  valueColorClass = 'text-[var(--text-primary)]',
  subtitle,
  className,
}: KpiCardProps): JSX.Element {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // IntersectionObserver may not exist in test environments (jsdom)
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'finza-card group cursor-default select-none',
        visible ? 'animate-fade-in' : 'opacity-0',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide leading-tight">
          {title}
        </p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: iconBg, color: iconColor ?? 'white' }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      <p
        className={cn(
          'text-2xl font-bold font-mono tabular-nums transition-all duration-300',
          visible ? 'animate-counter' : 'opacity-0',
          valueColorClass
        )}
      >
        {value}
      </p>

      <div className="flex items-center gap-2 mt-2">
        {variationPct !== undefined && (
          <VariationBadge pct={variationPct} />
        )}
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

KpiCard.Skeleton = KpiCardSkeleton
