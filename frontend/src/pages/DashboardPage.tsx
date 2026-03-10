import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  AlertCircle,
  CreditCard,
  CalendarClock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardV2 } from '@/hooks/useDashboardV2'
import { KpiCard } from '@/features/dashboard/components/v2/KpiCard'
import { TransaccionItem } from '@/features/dashboard/components/v2/TransaccionItem'
import { EgresoCategoriaBar } from '@/features/dashboard/components/v2/EgresoCategoriaBar'
import { MetaProgressItem } from '@/features/dashboard/components/v2/MetaProgressItem'
import { BudgetProgressBar } from '@/features/presupuestos/components/BudgetProgressBar'
import { formatDate, formatMoney } from '@/lib/utils'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function getInitialPeriod(): { mes: number; year: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, year: now.getFullYear() }
}

function buildYearOptions(currentYear: number): number[] {
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
}

export function DashboardPage(): JSX.Element {
  const now = new Date()
  const currentYear = now.getFullYear()

  const [mes, setMes] = useState<number>(getInitialPeriod().mes)
  const [year, setYear] = useState<number>(getInitialPeriod().year)

  const { data, isLoading, isError, error } = useDashboardV2({ mes, year })

  const yearOptions = buildYearOptions(currentYear)

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen financiero del mes</p>
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
              className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-finza-blue focus:outline-none focus:ring-1 focus:ring-finza-blue"
            >
              {MONTH_NAMES.map((name, idx) => (
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
              className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-finza-blue focus:outline-none focus:ring-1 focus:ring-finza-blue"
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
          className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700"
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
            <KpiCard.Skeleton />
            <KpiCard.Skeleton />
            <KpiCard.Skeleton />
            <KpiCard.Skeleton />
          </>
        ) : (
          <>
            <KpiCard
              title="Ingresos del mes"
              value={formatMoney(data?.resumen_financiero.ingresos_mes ?? 0)}
              variationPct={data?.resumen_financiero.variacion_ingresos_pct ?? 0}
              icon={<TrendingUp size={18} style={{ color: '#00B050' }} />}
              iconBg="#00B05020"
              valueColorClass="text-prosperity-green"
              subtitle="vs. mes anterior"
            />
            <KpiCard
              title="Egresos del mes"
              value={formatMoney(data?.resumen_financiero.egresos_mes ?? 0)}
              variationPct={data?.resumen_financiero.variacion_egresos_pct ?? 0}
              icon={<TrendingDown size={18} style={{ color: '#FF0000' }} />}
              iconBg="#FF000020"
              valueColorClass="text-alert-red"
              subtitle="vs. mes anterior"
            />
            <KpiCard
              title="Balance del mes"
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
              title="Tasa de ahorro"
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
            <CardTitle>Ultimas transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div aria-label="Cargando transacciones">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="py-3 border-b border-border last:border-0">
                    <div className="h-4 w-48 bg-flow-light rounded animate-pulse mb-1" />
                    <div className="h-3 w-32 bg-flow-light rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (data?.ultimas_transacciones ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No hay datos para este periodo
              </p>
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
            <CardTitle>Egresos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-4 w-32 bg-flow-light rounded animate-pulse" />
                    <div className="h-2 w-full bg-flow-light rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (data?.egresos_por_categoria ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No hay datos para este periodo
              </p>
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
            <CardTitle>Presupuestos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-4 w-28 bg-flow-light rounded animate-pulse" />
                    <div className="h-2.5 w-full bg-flow-light rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (data?.presupuestos_estado ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No hay datos para este periodo
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
                            : 'font-medium text-gray-700'
                        }
                      >
                        {pres.categoria}
                      </span>
                      <span className="text-xs text-gray-400">
                        {pres.porcentaje_usado.toFixed(0)}%
                      </span>
                    </div>
                    <BudgetProgressBar
                      porcentaje={pres.porcentaje_usado}
                      aria-label={`Presupuesto ${pres.categoria}: ${pres.porcentaje_usado.toFixed(0)}% usado`}
                    />
                    <p className="text-xs text-gray-400">
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
            <CardTitle>Metas activas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-4 w-28 bg-flow-light rounded animate-pulse" />
                    <div className="h-1.5 w-full bg-flow-light rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (data?.metas_activas ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No hay datos para este periodo
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
            <CardTitle>Prestamos activos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-8 w-40 bg-flow-light rounded animate-pulse" />
                <div className="h-4 w-24 bg-flow-light rounded animate-pulse" />
                <div className="h-4 w-32 bg-flow-light rounded animate-pulse" />
              </div>
            ) : (data?.prestamos_activos.count ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CreditCard size={32} className="text-gray-300 mb-2" aria-hidden="true" />
                <p className="text-sm text-gray-400">Sin prestamos activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Deuda total</p>
                  <p className="text-2xl font-bold font-mono text-alert-red">
                    {formatMoney(data?.prestamos_activos.total_deuda ?? 0)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard size={14} className="text-finza-blue" aria-hidden="true" />
                  <span>
                    {data?.prestamos_activos.count ?? 0}{' '}
                    {(data?.prestamos_activos.count ?? 0) === 1 ? 'prestamo' : 'prestamos'} activo
                    {(data?.prestamos_activos.count ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                {data?.prestamos_activos.proximo_vencimiento && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
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
