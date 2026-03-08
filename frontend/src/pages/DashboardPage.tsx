import type { LucideProps } from 'lucide-react'
import { BarChart3, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'

interface KpiCard {
  title: string
  amount: number
  currency: string
  type: 'neutral' | 'ingreso' | 'egreso'
  icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>
  description: string
}

const kpiCards: KpiCard[] = [
  {
    title: 'Balance del Mes',
    amount: 0,
    currency: 'DOP',
    type: 'neutral',
    icon: Wallet,
    description: 'Ingresos - Egresos',
  },
  {
    title: 'Total Ingresos',
    amount: 0,
    currency: 'DOP',
    type: 'ingreso',
    icon: TrendingUp,
    description: 'Este mes',
  },
  {
    title: 'Total Egresos',
    amount: 0,
    currency: 'DOP',
    type: 'egreso',
    icon: TrendingDown,
    description: 'Este mes',
  },
  {
    title: 'Transacciones',
    amount: 0,
    currency: 'DOP',
    type: 'neutral',
    icon: BarChart3,
    description: 'Este mes',
  },
]

export function DashboardPage(): JSX.Element {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen financiero del mes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {kpiCards.map(({ title, amount, currency, type, icon: Icon, description }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
                <div className="w-9 h-9 rounded-lg bg-flow-light flex items-center justify-center">
                  <Icon size={18} className="text-finza-blue" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {type === 'neutral' && title === 'Transacciones' ? (
                <p className="text-3xl font-bold text-gray-900 font-mono">{amount}</p>
              ) : (
                <MoneyDisplay amount={amount} currency={currency} type={type} size="xl" />
              )}
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen por categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 text-center py-8">
            Los datos del dashboard estaran disponibles en Issue #9.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
