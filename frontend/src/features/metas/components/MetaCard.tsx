import { formatMoney, formatDate, cn } from '@/lib/utils'
import { ProgressBar } from './ProgressBar'
import type { MetaAhorro, EstadoMeta } from '@/types/meta_ahorro'

interface MetaCardProps {
  meta: MetaAhorro
  onClick: (meta: MetaAhorro) => void
}

function estadoLabel(estado: EstadoMeta): string {
  const map: Record<EstadoMeta, string> = {
    activa: 'Activa',
    completada: 'Completada',
    cancelada: 'Cancelada',
  }
  return map[estado]
}

function estadoBadgeClasses(estado: EstadoMeta): string {
  const map: Record<EstadoMeta, string> = {
    activa: 'bg-blue-100 text-finza-blue',
    completada: 'bg-green-100 text-prosperity-green',
    cancelada: 'bg-gray-100 text-gray-500',
  }
  return map[estado]
}

export function MetaCard({ meta, onClick }: MetaCardProps): JSX.Element {
  const porcentaje =
    meta.monto_objetivo > 0
      ? Math.min(100, (meta.monto_actual / meta.monto_objetivo) * 100)
      : 0

  const isCompletada = porcentaje >= 100 || meta.estado === 'completada'
  const colorMeta = meta.color ?? '#366092'

  return (
    <button
      type="button"
      onClick={() => onClick(meta)}
      className={cn(
        'finza-card text-left w-full transition-all hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finza-blue',
        meta.estado === 'cancelada' && 'opacity-60'
      )}
      aria-label={`Ver detalle de meta: ${meta.nombre}`}
    >
      {/* Header: icono/color + nombre + badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Color / icono indicator */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
            style={{ backgroundColor: colorMeta }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {meta.icono ? `${meta.icono} ` : ''}
              {meta.nombre}
            </p>
            {meta.descripcion && (
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {meta.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Badge estado */}
        {isCompletada ? (
          <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-prosperity-green whitespace-nowrap">
            Completada
          </span>
        ) : (
          <span
            className={cn(
              'flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
              estadoBadgeClasses(meta.estado)
            )}
          >
            {estadoLabel(meta.estado)}
          </span>
        )}
      </div>

      {/* Montos */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-xs text-gray-400">Ahorrado</p>
          <p
            className="text-lg font-bold money"
            style={{ color: colorMeta }}
          >
            {formatMoney(meta.monto_actual)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Objetivo</p>
          <p className="text-sm font-semibold text-gray-700">
            {formatMoney(meta.monto_objetivo)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        porcentaje={porcentaje}
        color={colorMeta}
        aria-label={`${Math.round(porcentaje)}% de la meta ${meta.nombre}`}
      />
      <p className="text-xs text-gray-400 mt-1">
        {Math.round(porcentaje)}% completado
      </p>

      {/* Fecha objetivo */}
      {meta.fecha_objetivo && (
        <p className="text-xs text-gray-400 mt-2">
          Objetivo:{' '}
          <span className="text-gray-600">{formatDate(meta.fecha_objetivo)}</span>
        </p>
      )}
    </button>
  )
}
