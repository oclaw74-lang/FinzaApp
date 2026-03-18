import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  AlertCircle,
  CreditCard,
  CalendarClock,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardV2 } from '@/hooks/useDashboardV2'
import { useAuthStore } from '@/store/authStore'
import { KpiCard } from '@/features/dashboard/components/v2/KpiCard'
import { MetaProgressItem } from '@/features/dashboard/components/v2/MetaProgressItem'
import { BudgetProgressBar } from '@/features/presupuestos/components/BudgetProgressBar'
import { ChartFlujoMensual } from '@/features/dashboard/components/ChartFlujoMensual'
import { ChartDistribucionEgresos } from '@/features/dashboard/components/ChartDistribucionEgresos'
import { PrediccionMesCard } from '@/components/dashboard/PrediccionMesCard'
import { formatDate, formatMoney, cn } from '@/lib/utils'
import type { DashboardV2Response } from '@/types/dashboard'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos dias'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function getWeekContext(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  )
  return `Semana ${weekNum}`
}

function getFinancialContext(data: DashboardV2Response | undefined): string {
  if (!data) return 'Cargando datos...'
  const tasa = data.resumen_financiero?.tasa_ahorro ?? 0
  if (tasa > 20) return 'Excelente ritmo'
  if (tasa > 10) return 'Todo bajo control'
  if (tasa > 0) return 'Puedes mejorar'
  return 'Revisa tus gastos'
}

function getInitialPeriod(): { mes: number; year: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, year: now.getFullYear() }
}

function buildYearOptions(currentYear: number): number[] {
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
}

const MESES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function DashboardPage(): JSX.Element {
  const { t } = useTranslation()
  const now = new Date()
  const currentYear = now.getFullYear()
  const { user } = useAuthStore()

  const [mes, setMes] = useState<number>(getInitialPeriod().mes)
  const [year, setYear] = useState<number>(getInitialPeriod().year)

  const { data, isLoading, isError, error } = useDashboardV2({ mes, year })

  const yearOptions = buildYearOptions(currentYear)

  const ingresos = data?.resumen_financiero.ingresos_mes ?? 0
  const egresos = data?.resumen_financiero.egresos_mes ?? 0
  const tasaAhorro = data?.resumen_financiero.tasa_ahorro ?? 0

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Usuario'

  return (
    <div className="animate-fade-in p-6 md:p-8 space-y-6">
      {/* Error state */}
      {isError && (
        <div
          className="flex items-center gap-3 p-4 mb-6 bg-[var(--danger-muted)] border border-[var(--danger)] dark:border-finza-red/30 rounded-lg text-[var(--danger)]"
          role="alert"
        >
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm">
            {(error as Error)?.message ?? 'Error al cargar el dashboard. Intenta de nuevo.'}
          </p>
        </div>
      )}

      {/* Greeting header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1" data-testid="dashboard-greeting">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-white/50 text-sm">
            {getWeekContext()} · {getFinancialContext(data)}
          </p>
        </div>

        {/* Period selectors */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Month buttons */}
          <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 flex-wrap">
            {MESES_SHORT.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMes(i + 1)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  mes === i + 1
                    ? 'bg-white text-indigo-600 shadow'
                    : 'text-white/60 hover:text-white'
                )}
              >
                {m}
              </button>
            ))}
          </div>
          {/* Year selector */}
          <div>
            <label htmlFor="year-selector" className="sr-only">
              Ano
            </label>
            <select
              id="year-selector"
              aria-label="Ano"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y} className="text-gray-900">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          <>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        ) : (
          <>
            <KpiCard
              title={t('dashboard.income')}
              value={formatMoney(ingresos)}
              variationPct={data?.resumen_financiero.variacion_ingresos_pct ?? 0}
              icon={<TrendingUp size={18} style={{ color: 'var(--success)' }} className="dark:text-finza-green" />}
              iconBg="var(--success-muted)"
              valueColorClass="text-[var(--success)] dark:text-finza-green"
              subtitle={t('dashboard.vsLastMonth')}
              className="border-l-4 border-[#00B050] dark:bg-finza-blue/10 card-glass"
            />
            <KpiCard
              title={t('dashboard.expenses')}
              value={formatMoney(egresos)}
              variationPct={data?.resumen_financiero.variacion_egresos_pct ?? 0}
              icon={<TrendingDown size={18} style={{ color: 'var(--danger)' }} className="dark:text-finza-red" />}
              iconBg="var(--danger-muted)"
              valueColorClass="text-[var(--danger)] dark:text-finza-red"
              subtitle={t('dashboard.vsLastMonth')}
              className="border-l-4 border-[#FF0000] dark:bg-finza-red/10 card-glass"
            />
            <KpiCard
              title="Metas activas"
              value={String(data?.metas_activas.length ?? 0)}
              icon={<Target size={18} style={{ color: 'var(--accent)' }} className="dark:text-finza-purple" />}
              iconBg="var(--accent-muted)"
              valueColorClass="text-[var(--accent)] dark:text-finza-purple"
              subtitle="En progreso"
              className="card-glass"
            />
            <KpiCard
              title={t('dashboard.savingsRate')}
              value={`${tasaAhorro.toFixed(1)}%`}
              icon={<PiggyBank size={18} style={{ color: 'var(--warning)' }} className="dark:text-finza-yellow" />}
              iconBg="var(--warning-muted)"
              valueColorClass="text-[var(--warning)] dark:text-finza-yellow"
              subtitle="Del total de ingresos"
              className="dark:bg-finza-yellow/10 card-glass"
            />
          </>
        )}
      </div>

      {/* Prediccion */}
      <div className="mb-6">
        <PrediccionMesCard />
      </div>

      {/* Charts row: flujo mensual + distribucion egresos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card-glass dark:bg-white/[0.02] rounded-2xl p-5">
          <h3 className="text-xs uppercase tracking-widest text-white/40 mb-1">Flujo mensual</h3>
          <p className="text-white/50 text-xs mb-4">Ingresos vs egresos — ultimos 6 meses</p>
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
          <h3 className="text-xs uppercase tracking-widest text-white/40 mb-1">Distribucion egresos</h3>
          <p className="text-white/50 text-xs mb-4">Por categoria este mes</p>
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
              Ver todos
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
                <p className="text-sm text-[var(--text-muted)]">Sin prestamos activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Deuda total</p>
                  <p className="text-2xl font-bold font-mono text-[var(--danger)] dark:text-finza-red">
                    {formatMoney(data?.prestamos_activos.total_deuda ?? 0)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <CreditCard size={14} className="text-[var(--accent)]" aria-hidden="true" />
                  <span>
                    {data?.prestamos_activos.count ?? 0}{' '}
                    prestamo{(data?.prestamos_activos.count ?? 0) !== 1 ? 's' : ''} activo
                    {(data?.prestamos_activos.count ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                {data?.prestamos_activos.proximo_vencimiento && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <CalendarClock size={14} className="text-[var(--warning)]" aria-hidden="true" />
                    <span>
                      Proximo:{' '}
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
