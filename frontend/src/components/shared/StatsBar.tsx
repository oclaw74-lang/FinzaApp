import { useNavigate } from 'react-router-dom'
import { useDashboardV2 } from '@/hooks/useDashboardV2'
import { useScore } from '@/hooks/useScore'
import { useFondoEmergencia } from '@/hooks/useFondoEmergencia'
import { NotificacionBadge } from '@/components/shared/NotificacionBadge'
import { cn } from '@/lib/utils'

interface StatItemProps {
  label: string
  value: string
  badge?: string
  badgeVariant?: 'positive' | 'negative' | 'warning' | 'neutral'
}

function StatItem({ label, value, badge, badgeVariant = 'neutral' }: StatItemProps): JSX.Element {
  const badgeClass = {
    positive: 'text-emerald-400 bg-emerald-400/10 dark:text-[#00dfa2] dark:bg-[#00dfa2]/10',
    negative: 'text-red-400 bg-red-400/10 dark:text-[#ff4060] dark:bg-[#ff4060]/10',
    warning: 'text-amber-400 bg-amber-400/10 dark:text-[#ffb340] dark:bg-[#ffb340]/10',
    neutral: 'text-[var(--text-muted)] bg-[var(--surface-raised)]',
  }[badgeVariant]

  return (
    <div className="flex items-center gap-2 px-3 shrink-0 border-r border-[var(--border)] dark:border-white/[0.06] last:border-r-0">
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-[var(--text-subtle)] dark:text-[#657a9e] uppercase tracking-wider leading-none mb-0.5">
          {label}
        </span>
        <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)] dark:text-[#e8f0ff] leading-none">
          {value}
        </span>
      </div>
      {badge && (
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-semibold', badgeClass)}>
          {badge}
        </span>
      )}
    </div>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPct(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

function getBadgeVariant(value: number, invert = false): 'positive' | 'negative' | 'warning' {
  if (Math.abs(value) < 3) return 'warning'
  const isPositive = value > 0
  return (invert ? !isPositive : isPositive) ? 'positive' : 'negative'
}

function scoreEstadoToVariant(estado?: string): 'positive' | 'warning' | 'negative' {
  if (!estado) return 'warning'
  if (estado === 'excelente' || estado === 'bueno') return 'positive'
  if (estado === 'en_riesgo') return 'warning'
  return 'negative'
}

function scoreEstadoLabel(estado?: string): string {
  if (!estado) return ''
  const map: Record<string, string> = {
    excelente: 'Excelente',
    bueno: 'Bueno',
    en_riesgo: 'En riesgo',
    critico: 'Critico',
  }
  return map[estado] ?? estado
}

export function StatsBar(): JSX.Element {
  const now = new Date()
  const { data, isLoading } = useDashboardV2({ mes: now.getMonth() + 1, year: now.getFullYear() })
  const { data: scoreData } = useScore()
  const { data: fondoData } = useFondoEmergencia()
  const navigate = useNavigate()

  const barClass = cn(
    'statsbar-glass hidden md:flex items-center h-11 px-4 sticky top-0 z-40',
    'border-b border-[var(--border)]',
    'dark:border-white/[0.06]',
    'bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(4,8,15,0.85)]'
  )

  if (isLoading || !data) {
    return (
      <div
        className={barClass}
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {[80, 100, 90, 70, 95].map((w, i) => (
          <div key={i} className="h-3 rounded shimmer" style={{ width: `${w}px` }} />
        ))}
      </div>
    )
  }

  const { resumen_financiero: rf, prestamos_activos: pa } = data
  const balance = rf.ingresos_mes - rf.egresos_mes

  const proximoVencimiento = pa.proximo_vencimiento
    ? new Date(pa.proximo_vencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    : '—'

  return (
    <div
      className={barClass}
      style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="flex items-center gap-1 flex-1 overflow-x-auto min-w-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <StatItem
          label="Balance"
          value={formatCurrency(balance)}
          badge={formatPct(rf.tasa_ahorro)}
          badgeVariant={rf.tasa_ahorro > 0 ? 'positive' : rf.tasa_ahorro < -5 ? 'negative' : 'warning'}
        />
        <StatItem
          label="Ingresos"
          value={formatCurrency(rf.ingresos_mes)}
          badge={formatPct(rf.variacion_ingresos_pct)}
          badgeVariant={getBadgeVariant(rf.variacion_ingresos_pct)}
        />
        <StatItem
          label="Egresos"
          value={formatCurrency(rf.egresos_mes)}
          badge={formatPct(rf.variacion_egresos_pct)}
          badgeVariant={getBadgeVariant(rf.variacion_egresos_pct, true)}
        />
        <StatItem
          label="Score"
          value={scoreData?.score?.toString() ?? '—'}
          badge={scoreData?.estado ? scoreEstadoLabel(scoreData.estado) : undefined}
          badgeVariant={scoreEstadoToVariant(scoreData?.estado)}
        />
        <StatItem
          label="Fondo"
          value={formatCurrency(fondoData?.monto_actual ?? 0)}
          badge={fondoData?.porcentaje != null ? `${Math.round(fondoData.porcentaje)}%` : undefined}
          badgeVariant={
            (fondoData?.porcentaje ?? 0) >= 100
              ? 'positive'
              : (fondoData?.porcentaje ?? 0) >= 50
                ? 'warning'
                : 'negative'
          }
        />
        <button
          onClick={() => navigate('/prestamos')}
          className="flex items-center px-3 hover:opacity-80 transition-opacity border-r border-[var(--border)] dark:border-white/[0.06]"
          aria-label="Ver préstamos"
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-[var(--text-subtle)] dark:text-[#657a9e] uppercase tracking-wider leading-none mb-0.5">
              Prox. Venc.
            </span>
            <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)] dark:text-[#e8f0ff] leading-none">
              {proximoVencimiento}
            </span>
          </div>
        </button>
      </div>

      {/* Notifications bell */}
      <div className="ml-4 shrink-0 flex items-center">
        <NotificacionBadge />
      </div>
    </div>
  )
}
