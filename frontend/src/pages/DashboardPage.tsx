import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import { KpiCards } from '@/features/dashboard/components/KpiCards'
import { CategoryPieChart } from '@/features/dashboard/components/CategoryPieChart'
import { MonthlyChart } from '@/features/dashboard/components/MonthlyChart'
import { RecentTransactions } from '@/features/dashboard/components/RecentTransactions'
import { MonthlySummary } from '@/features/dashboard/components/MonthlySummary'

function getInitialPeriod(): { mes: number; year: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, year: now.getFullYear() }
}

function prevMonth(mes: number, year: number): { mes: number; year: number } {
  if (mes === 1) return { mes: 12, year: year - 1 }
  return { mes: mes - 1, year }
}

function nextMonth(mes: number, year: number): { mes: number; year: number } {
  if (mes === 12) return { mes: 1, year: year + 1 }
  return { mes: mes + 1, year }
}

export function DashboardPage(): JSX.Element {
  const [period, setPeriod] = useState(getInitialPeriod)

  const { data, isLoading, isError, error } = useDashboard({
    mes: period.mes,
    year: period.year,
  })

  const handlePrev = (): void => {
    setPeriod((p) => prevMonth(p.mes, p.year))
  }

  const handleNext = (): void => {
    const now = new Date()
    const isCurrentMonth =
      period.mes === now.getMonth() + 1 && period.year === now.getFullYear()
    if (!isCurrentMonth) {
      setPeriod((p) => nextMonth(p.mes, p.year))
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen financiero del mes</p>
        </div>
        <MonthlySummary
          mes={period.mes}
          year={period.year}
          onPrev={handlePrev}
          onNext={handleNext}
        />
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
      <div className="mb-8">
        <KpiCards
          kpis={
            data?.kpis ?? {
              total_ingresos: 0,
              total_egresos: 0,
              balance: 0,
              ahorro_estimado: 0,
            }
          }
          isLoading={isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart
              data={data?.monthly_trend ?? []}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Egresos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart
              data={data?.categoria_breakdown ?? []}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Ultimas transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactions
            transactions={data?.recent_transactions ?? []}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
