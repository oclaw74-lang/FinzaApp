import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import type { DashboardKpis } from '@/types/dashboard'

interface KpiCardsProps {
  kpis: DashboardKpis
  isLoading: boolean
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
        <div className="h-3 w-20 bg-flow-light rounded animate-pulse mt-2" />
      </CardContent>
    </Card>
  )
}

export function KpiCards({ kpis, isLoading }: KpiCardsProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const balanceType: 'ingreso' | 'egreso' | 'neutral' =
    kpis.balance > 0 ? 'ingreso' : kpis.balance < 0 ? 'egreso' : 'neutral'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Ingresos
            </CardTitle>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#00B05020' }}
            >
              <TrendingUp size={18} style={{ color: '#00B050' }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MoneyDisplay
            amount={kpis.total_ingresos}
            currency="DOP"
            type="ingreso"
            size="xl"
          />
          <p className="text-xs text-gray-400 mt-1">Este mes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Egresos
            </CardTitle>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#FF000020' }}
            >
              <TrendingDown size={18} style={{ color: '#FF0000' }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MoneyDisplay
            amount={kpis.total_egresos}
            currency="DOP"
            type="egreso"
            size="xl"
          />
          <p className="text-xs text-gray-400 mt-1">Este mes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">
              Balance Disponible
            </CardTitle>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#36609220' }}
            >
              <Wallet size={18} style={{ color: '#366092' }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MoneyDisplay
            amount={Math.abs(kpis.balance)}
            currency="DOP"
            type={balanceType}
            size="xl"
          />
          <p className="text-xs text-gray-400 mt-1">Ingresos - Egresos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">
              Ahorro Estimado
            </CardTitle>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#FFC00020' }}
            >
              <PiggyBank size={18} style={{ color: '#FFC000' }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <span
            className="text-3xl font-bold font-mono"
            style={{ color: '#FFC000' }}
          >
            <MoneyDisplay
              amount={kpis.ahorro_estimado}
              currency="DOP"
              type="neutral"
              size="xl"
              className="!text-golden-flow"
            />
          </span>
          <p className="text-xs text-gray-400 mt-1">Proyeccion del mes</p>
        </CardContent>
      </Card>
    </div>
  )
}
