import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ResumenFinanciero } from '@/types/dashboard'

const MESES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface Props {
  resumen: ResumenFinanciero
  mes: number
  year: number
}

interface DataPoint {
  mes: string
  ingresos: number
  egresos: number
}

function buildChartData(resumen: ResumenFinanciero, mes: number): DataPoint[] {
  return Array.from({ length: 6 }, (_, i) => {
    const monthIdx = ((mes - 1 - (5 - i) + 12) % 12)
    const isCurrentMonth = i === 5
    const isPrevMonth = i === 4
    return {
      mes: MESES_SHORT[monthIdx],
      ingresos: isCurrentMonth
        ? resumen.ingresos_mes
        : isPrevMonth
          ? resumen.ingresos_mes_anterior
          : 0,
      egresos: isCurrentMonth
        ? resumen.egresos_mes
        : isPrevMonth
          ? resumen.egresos_mes_anterior
          : 0,
    }
  })
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}): JSX.Element | null {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1520] border border-white/[0.08] rounded-xl px-3 py-2 shadow-2xl text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ${p.value.toLocaleString('es-DO')}
        </p>
      ))}
    </div>
  )
}

export function ChartFlujoMensual({ resumen, mes }: Props): JSX.Element {
  const data = buildChartData(resumen, mes)
  const hasData = resumen.ingresos_mes > 0 || resumen.egresos_mes > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-white/30">
        <span className="text-4xl mb-2" aria-hidden="true">📊</span>
        <p className="text-sm">Sin datos este mes</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 8 }}
        />
        <Bar
          dataKey="ingresos"
          name="Ingresos"
          fill="#00B050"
          fillOpacity={0.85}
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
        <Bar
          dataKey="egresos"
          name="Egresos"
          fill="#FF4444"
          fillOpacity={0.85}
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
