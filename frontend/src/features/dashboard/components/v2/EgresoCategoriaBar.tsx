import { formatMoney } from '@/lib/utils'
import type { EgresoCategoria } from '@/types/dashboard'

interface EgresoCategoriaBarProps {
  item: EgresoCategoria
}

export function EgresoCategoriaBar({ item }: EgresoCategoriaBarProps): JSX.Element {
  const { categoria, total, porcentaje } = item
  const pct = Math.min(100, Math.max(0, porcentaje))

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--text-secondary)] truncate mr-2">{categoria}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-[var(--text-muted)]">{pct.toFixed(1)}%</span>
          <span className="text-sm font-semibold font-mono text-alert-red">
            {formatMoney(total)}
          </span>
        </div>
      </div>
      <div className="w-full bg-[var(--surface-raised)] rounded-full h-2 overflow-hidden">
        <div
          className="bg-finza-blue h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
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
