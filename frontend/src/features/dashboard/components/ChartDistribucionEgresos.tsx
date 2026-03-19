import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { EgresoCategoria } from '@/types/dashboard'
import type { ContentType } from 'recharts/types/component/DefaultLegendContent'

const COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#06b6d4',
]

interface Props {
  data: EgresoCategoria[]
}

interface TooltipPayload {
  name: string
  value: number
  payload: EgresoCategoria & { color: string }
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}): JSX.Element | null {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-[#0d1520] border border-white/[0.08] rounded-xl px-3 py-2 shadow-2xl text-xs">
      <p className="text-white/50 mb-1">{item.name}</p>
      <p style={{ color: item.payload.color }}>
        ${item.value.toLocaleString('es-DO')} ({item.payload.porcentaje.toFixed(1)}%)
      </p>
    </div>
  )
}

const renderCustomLegend: ContentType = ({ payload }) => {
  if (!payload) return null
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2">
      {payload.map((entry, index) => {
        const item = entry.payload as EgresoCategoria & { color: string }
        return (
          <span key={index} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span>{entry.value} ({item.porcentaje.toFixed(0)}%)</span>
          </span>
        )
      })}
    </div>
  )
}

export function ChartDistribucionEgresos({ data }: Props): JSX.Element {
  const chartData = data.slice(0, 8).map((item, i) => ({
    ...item,
    name:
      item.categoria.length > 14
        ? item.categoria.slice(0, 14) + '\u2026'
        : item.categoria,
    color: COLORS[i % COLORS.length],
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-white/30">
        <span className="text-4xl mb-2" aria-hidden="true">🍩</span>
        <p className="text-sm">Sin egresos este mes</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="total"
          label={(props) => `${((props as { porcentaje?: number }).porcentaje ?? 0).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} fillOpacity={0.9} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderCustomLegend} />
      </PieChart>
    </ResponsiveContainer>
  )
}
