import { useNavigate } from 'react-router-dom'
import { useDashboardV2 } from '@/hooks/useDashboardV2'
import { cn } from '@/lib/utils'

interface StatItemProps {
  label: string
  value: string
  badge?: string
  badgeVariant?: 'positive' | 'negative' | 'warning' | 'neutral'
}

function StatItem({ label, value, badge, badgeVariant = 'neutral' }: StatItemProps): JSX.Element {
  const badgeClass = {
    positive: 'text-emerald-400 bg-emerald-400/10',
    negative: 'text-red-400 bg-red-400/10',
    warning: 'text-amber-400 bg-amber-400/10',
    neutral: 'text-[var(--text-muted)] bg-[var(--surface-raised)]',
  }[badgeVariant]

  return (
    <div className="flex items-center gap-2 px-3 shrink-0">
      <div className="flex flex-col">
        <span className="text-[10px] font-medium text-[var(--text-subtle)] uppercase tracking-wide leading-none mb-0.5">
          {label}
        </span>
        <span className="text-sm font-bold tabular-nums text-[var(--text-primary)] leading-none">
          {value}
        </span>
      </div>
      {badge && (
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', badgeClass)}>
          {badge}
        </span>
      )}
    </div>
  )
}

function StatDivider(): JSX.Element {
  return <div className="w-px h-6 bg-[var(--border)] shrink-0" aria-hidden="true" />
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

interface StatsBarProps {
  onCommandPaletteOpen: () => void
}

export function StatsBar({ onCommandPaletteOpen }: StatsBarProps): JSX.Element {
  const now = new Date()
  const { data, isLoading } = useDashboardV2({ mes: now.getMonth() + 1, year: now.getFullYear() })
  const navigate = useNavigate()

  if (isLoading || !data) {
    return (
      <div
        className="statsbar-glass hidden md:flex items-center gap-6 h-11 px-4 sticky top-16 z-40 border-b border-[var(--border)]"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'rgba(255,255,255,0.85)',
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
      className="statsbar-glass hidden md:flex items-center h-11 px-4 sticky top-16 z-40 border-b border-[var(--border)]"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(255,255,255,0.85)',
      }}
    >
      <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
        <StatItem
          label="Balance"
          value={formatCurrency(balance)}
          badge={formatPct(rf.tasa_ahorro)}
          badgeVariant={rf.tasa_ahorro > 0 ? 'positive' : rf.tasa_ahorro < -5 ? 'negative' : 'warning'}
        />
        <StatDivider />
        <StatItem
          label="Ingresos"
          value={formatCurrency(rf.ingresos_mes)}
          badge={formatPct(rf.variacion_ingresos_pct)}
          badgeVariant={getBadgeVariant(rf.variacion_ingresos_pct)}
        />
        <StatDivider />
        <StatItem
          label="Egresos"
          value={formatCurrency(rf.egresos_mes)}
          badge={formatPct(rf.variacion_egresos_pct)}
          badgeVariant={getBadgeVariant(rf.variacion_egresos_pct, true)}
        />
        <StatDivider />
        <button
          onClick={() => navigate('/prestamos')}
          className="flex items-center px-3 hover:opacity-80 transition-opacity"
          aria-label="Ver préstamos"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-[var(--text-subtle)] uppercase tracking-wide leading-none mb-0.5">
              Prox. Venc.
            </span>
            <span className="text-sm font-bold tabular-nums text-[var(--text-primary)] leading-none">
              {proximoVencimiento}
            </span>
          </div>
        </button>
      </div>

      {/* Command palette trigger */}
      <button
        onClick={onCommandPaletteOpen}
        className={cn(
          'ml-4 shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
          'text-[var(--text-muted)] bg-[var(--surface-raised)] border border-[var(--border)]',
          'hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all duration-150'
        )}
        aria-label="Abrir command palette"
        title="Ctrl+K"
      >
        <span>Buscar</span>
        <kbd className="text-[10px] font-mono bg-[var(--surface)] border border-[var(--border)] px-1 rounded">
          Ctrl K
        </kbd>
      </button>
    </div>
  )
}
