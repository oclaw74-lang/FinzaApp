import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

interface Props {
  data: Array<{ categoria: string; total: number }>
}

export function ChartGastosPorCategoria({ data }: Props): JSX.Element {
  const chartData = data.slice(0, 6).map((item, i) => ({
    name: item.categoria.length > 14 ? item.categoria.slice(0, 14) + '\u2026' : item.categoria,
    total: Number(item.total ?? 0),
    color: COLORS[i % COLORS.length],
  }))

  if (chartData.length === 0) {
    return (
      <div className="finza-card h-full">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
          Gastos por categoria
        </p>
        <div className="flex flex-col items-center justify-center h-48 text-[var(--text-subtle)]">
          <span className="text-4xl mb-2" aria-hidden="true">📊</span>
          <p className="text-sm">Sin datos este mes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="finza-card h-full">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
        Gastos por categoria
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" hide axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 12, fill: 'var(--text-muted)', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-raised)' }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-md)',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
            formatter={(v) => [`${(v as number)?.toLocaleString('es-DO')}`, 'Total']}
          />
          <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
