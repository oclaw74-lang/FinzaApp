import { formatMoney } from '@/lib/utils'
import type { EgresoCategoria } from '@/types/dashboard'

interface EgresoCategoriaBarProps {
  item: EgresoCategoria
}

export function EgresoCategoriaBar({ item }: EgresoCategoriaBarProps): JSX.Element {
  const { categoria, total, porcentaje } = item
  const pct = Math.min(100, Math.max(0, porcentaje))

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--text-secondary)] truncate mr-2">{categoria}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="badge-danger px-1.5 py-0.5 rounded-full text-[10px] font-medium">
            {pct.toFixed(1)}%
          </span>
          <span className="text-sm font-semibold font-mono tabular-nums text-alert-red">
            {formatMoney(total)}
          </span>
        </div>
      </div>
      <div className="w-full bg-[var(--surface-raised)] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #366092, #5B9BD5)',
          }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${categoria}: ${pct.toFixed(1)}% del total de egresos`}
        />
      </div>
    </div>
  )
}
