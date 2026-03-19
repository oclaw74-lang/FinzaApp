import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  mes: string
  ingresos: number
  egresos: number
}

interface Props {
  ingresos: number
  egresos: number
  mes: number
}

const MESES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function ChartBalanceTendencia({ ingresos, egresos, mes }: Props): JSX.Element {
  const data: DataPoint[] = Array.from({ length: 6 }, (_, i) => {
    const monthIdx = ((mes - 1 - (5 - i) + 12) % 12)
    const isCurrentMonth = i === 5
    return {
      mes: MESES_SHORT[monthIdx],
      ingresos: isCurrentMonth ? ingresos : 0,
      egresos: isCurrentMonth ? egresos : 0,
    }
  })

  return (
    <div className="finza-card h-full">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
        Flujo financiero
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEgresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--danger)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--danger)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-md)',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
            formatter={(v) => [`${(v as number)?.toLocaleString('es-DO')}`, '']}
          />
          <Area
            type="monotone"
            dataKey="ingresos"
            stroke="var(--success)"
            strokeWidth={2.5}
            fill="url(#gradIngresos)"
            name="Ingresos"
          />
          <Area
            type="monotone"
            dataKey="egresos"
            stroke="var(--danger)"
            strokeWidth={2.5}
            fill="url(#gradEgresos)"
            name="Egresos"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className="w-3 h-1 rounded inline-block" style={{ background: 'var(--success)' }} />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className="w-3 h-1 rounded inline-block" style={{ background: 'var(--danger)' }} />
          Egresos
        </span>
      </div>
    </div>
  )
}
