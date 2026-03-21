import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  CreditCard,
  CalendarClock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardV2 } from '@/hooks/useDashboardV2'
import { useScore } from '@/hooks/useScore'
import { useAuthStore } from '@/store/authStore'
import { MetaProgressItem } from '@/features/dashboard/components/v2/MetaProgressItem'
import { BudgetProgressBar } from '@/features/presupuestos/components/BudgetProgressBar'
import { ChartFlujoMensual } from '@/features/dashboard/components/ChartFlujoMensual'
import { ChartDistribucionEgresos } from '@/features/dashboard/components/ChartDistribucionEgresos'
import { PrediccionMesCard } from '@/components/dashboard/PrediccionMesCard'
import { formatDate, formatMoney, cn } from '@/lib/utils'
import type { DashboardV2Response } from '@/types/dashboard'

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours()
  if (hour < 12) return t('dashboard.goodMorning')
  if (hour < 18) return t('dashboard.goodAfternoon')
  return t('dashboard.goodEvening')
}

function getWeekContext(t: (key: string) => string): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  )
  return `${t('dashboard.week')} ${weekNum}`
}

function getFinancialContext(data: DashboardV2Response | undefined, t: (key: string) => string): string {
  if (!data) return t('dashboard.loading')
  const tasa = data.resumen_financiero?.tasa_ahorro ?? 0
  if (tasa > 20) return t('dashboard.excellentPace')
  if (tasa > 10) return t('dashboard.underControl')
  if (tasa > 0) return t('dashboard.canImprove')
  return t('dashboard.reviewExpenses')
}

function getInitialPeriod(): { mes: number; year: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, year: now.getFullYear() }
}

function getScoreColor(score: number): string {
  if (score <= 40) return 'var(--danger)'
  if (score <= 65) return '#F5C542'
  if (score <= 80) return 'var(--success)'
  return '#00d060'
}

export function DashboardPage(): JSX.Element {
  const { t } = useTranslation()
  const MESES_SHORT = t('months.short', { returnObjects: true }) as string[]
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [mes, setMes] = useState<number>(getInitialPeriod().mes)
  const [year, setYear] = useState<number>(getInitialPeriod().year)

  const { data, isLoading, isError, error } = useDashboardV2({ mes, year })
  const { data: scoreData, isLoading: scoreLoading } = useScore()

  const ingresos = data?.resumen_financiero.ingresos_mes ?? 0
  const egresos = data?.resumen_financiero.egresos_mes ?? 0
  const tasaAhorro = data?.resumen_financiero.tasa_ahorro ?? 0

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Usuario'

  return (
    <div className="animate-fade-in p-4 md:p-6 space-y-6">
      {/* Error state */}
      {isError && (
        <div
          className="flex items-center gap-3 p-4 mb-6 bg-[var(--danger-muted)] border border-[var(--danger)] dark:border-finza-red/30 rounded-lg text-[var(--danger)]"
          role="alert"
        >
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm">
            {(error as Error)?.message ?? t('dashboard.errorLoading')}
          </p>
        </div>
      )}

      {/* Greeting header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] dark:text-white mb-1 leading-tight" data-testid="dashboard-greeting">
            {getGreeting(t)}, {firstName}
          </h1>
          <p className="text-[var(--text-muted)] dark:text-white/50 text-sm">
            {getWeekContext(t)} · {getFinancialContext(data, t)}
          </p>
        </div>

        {/* Month + Year selector — inline on mobile, pills on desktop */}
        <div className="sm:hidden flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="finza-input flex-1 text-sm font-medium py-1.5"
            aria-label="Seleccionar mes"
          >
            {MESES_SHORT.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <div className="flex items-center gap-0.5 card-glass rounded-xl px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-bold"
              aria-label="Ano anterior"
            >
              ←
            </button>
            <span className="text-sm font-semibold text-[var(--text-primary)] min-w-[40px] text-center tabular-nums">{year}</span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-bold"
              aria-label="Ano siguiente"
            >
              →
            </button>
          </div>
        </div>

        {/* Desktop: pills + year */}
        <div className="hidden sm:flex sm:items-center sm:gap-3">
          <div className="flex items-center gap-1 bg-[var(--surface-raised)] dark:bg-white/[0.05] rounded-xl p-1 flex-wrap flex-1">
            {MESES_SHORT.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMes(i + 1)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  mes === i + 1
                    ? 'bg-[#3d8ef8] text-white shadow'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 card-glass rounded-xl px-2 py-1">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] dark:hover:bg-white/[0.06] transition-all text-sm font-bold"
              aria-label="Ano anterior"
            >
              ←
            </button>
            <span className="text-sm font-semibold text-[var(--text-primary)] min-w-[40px] text-center tabular-nums">{year}</span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] dark:hover:bg-white/[0.06] transition-all text-sm font-bold"
              aria-label="Ano siguiente"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px] rounded-[20px]" />
            <Skeleton className="h-[120px] rounded-[20px]" />
            <Skeleton className="h-[120px] rounded-[20px]" />
            <Skeleton className="h-[120px] rounded-[20px]" />
          </>
        ) : (
          <>
            {/* Ingresos */}
            <div className="card-glass rounded-[20px] p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
              <div className="w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-[10px] flex items-center justify-center text-base sm:text-lg"
                style={{ background: 'rgba(0,223,162,0.10)' }}>
                📥
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#657a9e]">{t('dashboard.income')}</p>
              <p className="text-lg sm:text-[26px] font-bold text-[#00dfa2] leading-none tabular-nums truncate"
                style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                {formatMoney(ingresos)}
              </p>
              {(() => {
                const pct = data?.resumen_financiero.variacion_ingresos_pct ?? 0
                const isPos = pct >= 0
                return (
                  <p className={cn('text-[10px] sm:text-xs font-medium', isPos ? 'text-[#00dfa2]' : 'text-[#ff4060]')}>
                    {isPos ? '+' : ''}{pct.toFixed(1)}% {t('dashboard.vsLastMonth')}
                  </p>
                )
              })()}
            </div>

            {/* Egresos */}
            <div className="card-glass rounded-[20px] p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
              <div className="w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-[10px] flex items-center justify-center text-base sm:text-lg"
                style={{ background: 'rgba(255,64,96,0.10)' }}>
                📤
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#657a9e]">{t('dashboard.expenses')}</p>
              <p className="text-lg sm:text-[26px] font-bold text-[#ff4060] leading-none tabular-nums truncate"
                style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                {formatMoney(egresos)}
              </p>
              {(() => {
                const pct = data?.resumen_financiero.variacion_egresos_pct ?? 0
                const isNeg = pct >= 0
                return (
                  <p className={cn('text-[10px] sm:text-xs font-medium', isNeg ? 'text-[#ff4060]' : 'text-[#00dfa2]')}>
                    {pct >= 0 ? '+' : ''}{pct.toFixed(1)}% {t('dashboard.vsLastMonth')}
                  </p>
                )
              })()}
            </div>

            {/* Metas activas */}
            <div className="card-glass rounded-[20px] p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
              <div className="w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-[10px] flex items-center justify-center text-base sm:text-lg"
                style={{ background: 'rgba(151,104,255,0.10)' }}>
                🎯
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#657a9e]">{t('dashboard.activeGoalsLabel')}</p>
              <p className="text-lg sm:text-[26px] font-bold text-[#9768ff] leading-none tabular-nums"
                style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                {String(data?.metas_activas.length ?? 0)}
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-[#657a9e]">{t('common.inProgress')}</p>
            </div>

            {/* Tasa de ahorro */}
            <div className="card-glass rounded-[20px] p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
              <div className="w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-[10px] flex items-center justify-center text-base sm:text-lg"
                style={{ background: 'rgba(255,179,64,0.10)' }}>
                💼
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#657a9e]">{t('dashboard.savingsRate')}</p>
              <p className={cn(
                'text-lg sm:text-[26px] font-bold leading-none tabular-nums',
                tasaAhorro > 0 ? 'text-[#00dfa2]' : 'text-[#ff4060]'
              )}
                style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                {tasaAhorro.toFixed(1)}%
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-[#657a9e]">{t('dashboard.ofTotalIncome')}</p>
            </div>
          </>
        )}
      </div>

      {/* Conversion note — shown when secondary currency is active */}
      {data?.moneda_conversion_info?.moneda_secundaria && data.moneda_conversion_info.tasa_cambio != null && (
        <p className="text-xs text-[var(--text-muted)] -mt-4 mb-2">
          {t('dashboard.conversionNota', {
            monedaSecundaria: data.moneda_conversion_info.moneda_secundaria,
            monedaPrincipal: data.moneda_conversion_info.moneda_principal,
            tasa: data.moneda_conversion_info.tasa_cambio,
          })}
        </p>
      )}

      {/* Prediccion + Score row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <PrediccionMesCard />

        {/* Score card */}
        {scoreLoading ? (
          <Skeleton className="h-[140px] rounded-2xl" />
        ) : scoreData ? (
          <div
            className="card-glass rounded-2xl p-5 cursor-pointer hover:ring-1 hover:ring-[var(--accent)]/30 transition-all"
            onClick={() => navigate('/score')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/score') }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-[var(--text-muted)]" />
                <h3 className="text-xs uppercase tracking-widest text-[var(--text-muted)] dark:text-white/40">
                  {t('score.title')}
                </h3>
              </div>
              <ChevronRight size={14} className="text-[var(--text-muted)]" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold tabular-nums" style={{ color: getScoreColor(scoreData.score) }}>
                {scoreData.score}
              </span>
              <div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: getScoreColor(scoreData.score),
                    backgroundColor: `${getScoreColor(scoreData.score)}22`,
                  }}
                >
                  {t(`score.${scoreData.estado}`)}
                </span>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">/100 {t('dashboard.scorePoints')}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(scoreData.breakdown).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="w-full h-1.5 rounded-full bg-[var(--border)] dark:bg-white/10 mb-1">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(val / 25) * 100}%`, backgroundColor: getScoreColor(val * 4) }}
                    />
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)] capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Charts row: flujo mensual + distribucion egresos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card-glass dark:bg-white/[0.02] rounded-2xl p-5">
          <h3 className="text-xs uppercase tracking-widest text-[var(--text-muted)] dark:text-white/40 mb-1">{t('dashboard.flowChart')}</h3>
          <p className="text-[var(--text-muted)] dark:text-white/50 text-xs mb-4">{t('dashboard.flowChartDesc')}</p>
          {isLoading ? (
            <Skeleton className="h-52 rounded-xl" />
          ) : (
            <ChartFlujoMensual
              resumen={data?.resumen_financiero ?? {
                ingresos_mes: 0,
                egresos_mes: 0,
                balance_mes: 0,
                tasa_ahorro: 0,
                ingresos_mes_anterior: 0,
                egresos_mes_anterior: 0,
                variacion_ingresos_pct: 0,
                variacion_egresos_pct: 0,
              }}
              mes={mes}
              year={year}
            />
          )}
        </div>
        <div className="card-glass dark:bg-white/[0.02] rounded-2xl p-5">
          <h3 className="text-xs uppercase tracking-widest text-[var(--text-muted)] dark:text-white/40 mb-1">{t('dashboard.expenseDistribution')}</h3>
          <p className="text-[var(--text-muted)] dark:text-white/50 text-xs mb-4">{t('dashboard.expenseDistributionDesc')}</p>
          {isLoading ? (
            <Skeleton className="h-52 rounded-xl" />
          ) : (
            <ChartDistribucionEgresos
              data={data?.egresos_por_categoria ?? []}
            />
          )}
        </div>
      </div>

      {/* Bottom section: recent transactions + loans + goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent transactions (2 cols) */}
        <div className="lg:col-span-2 finza-card dark:bg-[rgba(8,15,30,0.6)] dark:backdrop-blur-xl dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {t('dashboard.recentTransactions')}
            </p>
            <a href="/ingresos" className="text-xs text-[var(--accent)] hover:underline">
              {t('common.viewAll')}
            </a>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (data?.ultimas_transacciones ?? []).length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <p className="text-sm">{t('dashboard.noTransactions')}</p>
            </div>
          ) : (
            <div>
              {(data?.ultimas_transacciones ?? []).slice(0, 6).map((tx, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0 dark:hover:bg-white/[0.03] transition-colors rounded-xl px-2"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                      tx.tipo === 'ingreso'
                        ? 'bg-[var(--success-muted)] text-[var(--success)]'
                        : 'bg-[var(--danger-muted)] text-[var(--danger)]'
                    )}
                    aria-hidden="true"
                  >
                    {tx.tipo === 'ingreso' ? '+' : '\u2212'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {tx.descripcion || tx.categoria || (tx.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(tx.fecha).toLocaleDateString('es-DO', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-bold flex-shrink-0',
                      tx.tipo === 'ingreso' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                    )}
                  >
                    {tx.tipo === 'ingreso' ? '+' : '\u2212'}
                    {formatMoney(Number(tx.monto ?? 0))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: loans + goals */}
        <div className="space-y-4">
          {/* Prestamos activos */}
          <div className="finza-card dark:bg-[rgba(8,15,30,0.6)] dark:backdrop-blur-xl dark:border-white/[0.06]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              {t('dashboard.activeLoans')}
            </p>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (data?.prestamos_activos.count ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <CreditCard
                  size={28}
                  className="text-[var(--text-muted)] opacity-40 mb-2"
                  aria-hidden="true"
                />
                <p className="text-sm text-[var(--text-muted)]">{t('dashboard.noLoans')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">{t('dashboard.totalDebt')}</p>
                  <p className="text-2xl font-bold font-mono text-[var(--danger)] dark:text-finza-red">
                    {formatMoney(data?.prestamos_activos.total_deuda ?? 0)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <CreditCard size={14} className="text-[var(--accent)]" aria-hidden="true" />
                  <span>
                    {data?.prestamos_activos.count ?? 0}{' '}
                    {(data?.prestamos_activos.count ?? 0) !== 1 ? t('dashboard.loans') : t('dashboard.loan')}{' '}
                    {(data?.prestamos_activos.count ?? 0) !== 1 ? t('dashboard.actives') : t('dashboard.active')}
                  </span>
                </div>
                {data?.prestamos_activos.proximo_vencimiento && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <CalendarClock size={14} className="text-[var(--warning)]" aria-hidden="true" />
                    <span>
                      {t('dashboard.nextPayment')}:{' '}
                      <span className="font-medium text-[var(--warning)]">
                        {formatDate(data.prestamos_activos.proximo_vencimiento)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metas activas */}
          <div className="finza-card dark:bg-[rgba(8,15,30,0.6)] dark:backdrop-blur-xl dark:border-white/[0.06]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              {t('dashboard.activeGoals')}
            </p>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                ))}
              </div>
            ) : (data?.metas_activas ?? []).length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">
                {t('common.noData')}
              </p>
            ) : (
              <div className="space-y-4">
                {(data?.metas_activas ?? []).slice(0, 3).map((meta) => (
                  <MetaProgressItem key={meta.nombre} meta={meta} />
                ))}
              </div>
            )}
          </div>

          {/* Presupuestos */}
          <div className="finza-card dark:bg-[rgba(8,15,30,0.6)] dark:backdrop-blur-xl dark:border-white/[0.06]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              {t('dashboard.activeBudgets')}
            </p>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (data?.presupuestos_estado ?? []).length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">
                {t('common.noData')}
              </p>
            ) : (
              <div className="space-y-4">
                {(data?.presupuestos_estado ?? []).map((pres) => (
                  <div key={pres.categoria} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={
                          pres.alerta
                            ? 'font-semibold text-[var(--danger)]'
                            : 'font-medium text-[var(--text-primary)]'
                        }
                      >
                        {pres.categoria}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {pres.porcentaje_usado.toFixed(0)}%
                      </span>
                    </div>
                    <BudgetProgressBar
                      porcentaje={pres.porcentaje_usado}
                      aria-label={`Presupuesto ${pres.categoria}: ${pres.porcentaje_usado.toFixed(0)}% usado`}
                    />
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatMoney(pres.gasto_actual)} / {formatMoney(pres.monto_presupuestado)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
