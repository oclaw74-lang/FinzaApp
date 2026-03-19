import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CategoriaBreakdown } from '@/types/dashboard'
import { formatMoney } from '@/lib/utils'

interface CategoryPieChartProps {
  data: CategoriaBreakdown[]
  isLoading: boolean
}

const CHART_COLORS = [
  '#366092',
  '#5B9BD5',
  '#00B050',
  '#FFC000',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
]

interface TooltipPayloadEntry {
  name: string
  value: number
  payload: CategoriaBreakdown
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps): JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-border rounded-lg p-3 shadow-card text-sm">
      <p className="font-semibold text-gray-900">{item.name}</p>
      <p className="text-gray-600">{formatMoney(item.value)}</p>
      <p className="text-gray-400">{item.payload.porcentaje.toFixed(1)}% del total</p>
    </div>
  )
}

export function CategoryPieChart({ data, isLoading }: CategoryPieChartProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-48 h-48 rounded-full bg-flow-light animate-pulse" />
      </div>
    )
  }

  const egresos = data.filter((d) => d.tipo === 'egreso')

  if (egresos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-sm">Sin egresos registrados este mes.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={egresos}
          dataKey="monto"
          nameKey="nombre"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={45}
          paddingAngle={2}
        >
          {egresos.map((entry, index) => (
            <Cell
              key={entry.categoria_id}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs text-gray-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
