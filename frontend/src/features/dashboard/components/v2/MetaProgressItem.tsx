import { formatDate, formatMoney } from '@/lib/utils'
import type { MetaActivaV2 } from '@/types/dashboard'

interface MetaProgressItemProps {
  meta: MetaActivaV2
}

export function MetaProgressItem({ meta }: MetaProgressItemProps): JSX.Element {
  const { nombre, monto_objetivo, monto_actual, porcentaje_completado, fecha_limite } = meta
  const pct = Math.min(100, Math.max(0, porcentaje_completado))

  const barColor =
    pct >= 100
      ? 'bg-prosperity-green'
      : pct >= 60
        ? 'bg-finza-blue-light'
        : 'bg-finza-blue'

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-gray-800 truncate">{nombre}</span>
        <span className="text-xs font-semibold text-finza-blue flex-shrink-0">
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`${barColor} h-1.5 rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Meta ${nombre}: ${pct.toFixed(0)}% completada`}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{formatMoney(monto_actual)} / {formatMoney(monto_objetivo)}</span>
        {fecha_limite && (
          <span>Limite: {formatDate(fecha_limite)}</span>
        )}
      </div>
    </div>
  )
}
