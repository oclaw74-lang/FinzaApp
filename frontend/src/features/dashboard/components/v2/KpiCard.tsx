import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  variationPct?: number
  icon: React.ReactNode
  iconBg: string
  valueColorClass?: string
  subtitle?: string
}

function VariationBadge({ pct }: { pct: number }): JSX.Element {
  if (pct === 0) {
    return <span className="text-xs text-gray-400 font-medium">—</span>
  }

  const isPositive = pct > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isPositive ? 'text-prosperity-green' : 'text-alert-red'
      )}
      aria-label={`${isPositive ? 'Incremento' : 'Reduccion'} de ${Math.abs(pct).toFixed(1)}%`}
    >
      {isPositive ? (
        <TrendingUp size={12} aria-hidden="true" />
      ) : (
        <TrendingDown size={12} aria-hidden="true" />
      )}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function KpiCardSkeleton(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-flow-light rounded animate-pulse" />
          <div className="w-9 h-9 bg-flow-light rounded-lg animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-8 w-36 bg-flow-light rounded animate-pulse" />
        <div className="h-3 w-24 bg-flow-light rounded animate-pulse mt-2" />
      </CardContent>
    </Card>
  )
}

export function KpiCard({
  title,
  value,
  variationPct,
  icon,
  iconBg,
  valueColorClass = 'text-gray-900',
  subtitle,
}: KpiCardProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">
            {title}
          </CardTitle>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBg }}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className={cn('text-2xl font-bold font-mono', valueColorClass)}>
          {value}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {variationPct !== undefined && (
            <VariationBadge pct={variationPct} />
          )}
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

KpiCard.Skeleton = KpiCardSkeleton
