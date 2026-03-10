import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  AlertCircle,
  CreditCard,
  CalendarClock,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardV2 } from '@/hooks/useDashboardV2'
import { KpiCard } from '@/features/dashboard/components/v2/KpiCard'
import { TransaccionItem } from '@/features/dashboard/components/v2/TransaccionItem'
import { EgresoCategoriaBar } from '@/features/dashboard/components/v2/EgresoCategoriaBar'
import { MetaProgressItem } from '@/features/dashboard/components/v2/MetaProgressItem'
import { BudgetProgressBar } from '@/features/presupuestos/components/BudgetProgressBar'
import { formatDate, formatMoney, MESES } from '@/lib/utils'

function getInitialPeriod(): { mes: number; year: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, year: now.getFullYear() }
}

function buildYearOptions(currentYear: number): number[] {
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
}

export function DashboardPage(): JSX.Element {
  const { t } = useTranslation()
  const now = new Date()
  const currentYear = now.getFullYear()

  const [mes, setMes] = useState<number>(getInitialPeriod().mes)
  const [year, setYear] = useState<number>(getInitialPeriod().year)

  const { data, isLoading, isError, error } = useDashboardV2({ mes, year })

  const yearOptions = buildYearOptions(currentYear)
  const monthName = MESES[mes - 1]

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {t('dashboard.title')}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {t('dashboard.thisMonth')}: {monthName} {year}
          </p>
        </div>

        {/* Month / Year selector */}
        <div className="flex items-center gap-2">
          <div>
            <label htmlFor="mes-selector" className="sr-only">Mes</label>
            <select
              id="mes-selector"
              aria-label="Mes"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="finza-input text-sm"
            >
              {MESES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="year-selector" className="sr-only">Ano</label>
            <select
              id="year-selector"
              aria-label="Ano"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="finza-input text-sm"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div
          className="flex items-center gap-3 p-4 mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400"
          role="alert"
        >
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm">
            {(error as Error)?.message ?? 'Error al cargar el dashboard. Intenta de nuevo.'}
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          <>
            <Skeleton className="h-32 rounded-card" />
            <Skeleton className="h-32 rounded-card" />
            <Skeleton className="h-32 rounded-card" />
            <Skeleton className="h-32 rounded-card" />
          </>
        ) : (
          <>
            <KpiCard
              title={t('dashboard.income')}
              value={formatMoney(data?.resumen_financiero.ingresos_mes ?? 0)}
              variationPct={data?.resumen_financiero.variacion_ingresos_pct ?? 0}
              icon={<TrendingUp size={18} style={{ color: '#00B050' }} />}
              iconBg="#00B05020"
              valueColorClass="text-prosperity-green"
              subtitle={t('dashboard.vsLastMonth')}
            />
            <KpiCard
              title={t('dashboard.expenses')}
              value={formatMoney(data?.resumen_financiero.egresos_mes ?? 0)}
              variationPct={data?.resumen_financiero.variacion_egresos_pct ?? 0}
              icon={<TrendingDown size={18} style={{ color: '#FF0000' }} />}
              iconBg="#FF000020"
              valueColorClass="text-alert-red"
              subtitle={t('dashboard.vsLastMonth')}
            />
            <KpiCard
              title={t('dashboard.balance')}
              value={formatMoney(Math.abs(data?.resumen_financiero.balance_mes ?? 0))}
              icon={<Wallet size={18} style={{ color: '#366092' }} />}
              iconBg="#36609220"
              valueColorClass={
                (data?.resumen_financiero.balance_mes ?? 0) >= 0
                  ? 'text-prosperity-green'
                  : 'text-alert-red'
              }
              subtitle="Ingresos - Egresos"
            />
            <KpiCard
              title={t('dashboard.savingsRate')}
              value={`${(data?.resumen_financiero.tasa_ahorro ?? 0).toFixed(1)}%`}
              icon={<Target size={18} style={{ color: '#FFC000' }} />}
              iconBg="#FFC00020"
              valueColorClass="text-golden-flow"
              subtitle="Del total de ingresos"
            />
          </>
        )}
      </div>

      {/* Central section: transactions + category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div aria-label="Cargando transacciones" className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (data?.ultimas_transacciones ?? []).length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <BarChart3 size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t('dashboard.noTransactions')}</p>
              </div>
            ) : (
              <div>
                {(data?.ultimas_transacciones ?? []).slice(0, 5).map((tx, idx) => (
                  <TransaccionItem key={idx} transaccion={tx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Egresos por categoria */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.expensesByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (data?.egresos_por_categoria ?? []).length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <BarChart3 size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t('dashboard.noTransactions')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(data?.egresos_por_categoria ?? []).map((item) => (
                  <EgresoCategoriaBar key={item.categoria} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom section: budgets + goals + loans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Presupuestos */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.activeBudgets')}</CardTitle>
          </CardHeader>
          <CardContent>
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
              <p className="text-sm text-[var(--text-muted)] text-center py-6">
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
                            ? 'font-semibold text-alert-red'
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
          </CardContent>
        </Card>

        {/* Metas activas */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.activeGoals')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                ))}
              </div>
            ) : (data?.metas_activas ?? []).length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-6">
                {t('common.noData')}
              </p>
            ) : (
              <div className="space-y-4">
                {(data?.metas_activas ?? []).map((meta) => (
                  <MetaProgressItem key={meta.nombre} meta={meta} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prestamos activos */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.activeLoans')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (data?.prestamos_activos.count ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CreditCard size={32} className="text-[var(--text-muted)] opacity-40 mb-2" aria-hidden="true" />
                <p className="text-sm text-[var(--text-muted)]">Sin prestamos activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Deuda total</p>
                  <p className="text-2xl font-bold font-mono text-alert-red">
                    {formatMoney(data?.prestamos_activos.total_deuda ?? 0)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <CreditCard size={14} className="text-finza-blue" aria-hidden="true" />
                  <span>
                    {data?.prestamos_activos.count ?? 0}{' '}
                    {(data?.prestamos_activos.count ?? 0) === 1 ? 'prestamo' : 'prestamos'} activo
                    {(data?.prestamos_activos.count ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                {data?.prestamos_activos.proximo_vencimiento && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <CalendarClock size={14} className="text-golden-flow" aria-hidden="true" />
                    <span>
                      Proximo vencimiento:{' '}
                      <span className="font-medium text-golden-flow">
                        {formatDate(data.prestamos_activos.proximo_vencimiento)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
