import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyTrendItem } from '@/types/dashboard'
import { formatMoney } from '@/lib/utils'

interface MonthlyChartProps {
  data: MonthlyTrendItem[]
  isLoading: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps): JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white border border-border rounded-lg p-3 shadow-card text-sm">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function MonthlyChart({ data, isLoading }: MonthlyChartProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="w-full h-64 bg-flow-light rounded-lg animate-pulse" />
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-sm">Sin datos de tendencia disponibles.</p>
      </div>
    )
  }

  const tickFormatter = (value: number): string => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
    return String(value)
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradientIngresos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00B050" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#00B050" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientEgresos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF0000" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={tickFormatter}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs text-gray-600">{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="total_ingresos"
          name="Ingresos"
          stroke="#00B050"
          strokeWidth={2}
          fill="url(#gradientIngresos)"
          dot={{ r: 3, fill: '#00B050' }}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="total_egresos"
          name="Egresos"
          stroke="#FF0000"
          strokeWidth={2}
          fill="url(#gradientEgresos)"
          dot={{ r: 3, fill: '#FF0000' }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
