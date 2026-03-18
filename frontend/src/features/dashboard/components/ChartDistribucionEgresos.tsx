import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { EgresoCategoria } from '@/types/dashboard'

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

export function ChartDistribucionEgresos({ data }: Props): JSX.Element {
  const chartData = data.slice(0, 8).map((item, i) => ({
    ...item,
    name:
      item.categoria.length > 12
        ? item.categoria.slice(0, 12) + '\u2026'
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
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="total"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} fillOpacity={0.9} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
