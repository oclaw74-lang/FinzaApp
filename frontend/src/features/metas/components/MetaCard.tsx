import { useTranslation } from 'react-i18next'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import { ProgressBar } from './ProgressBar'
import type { MetaAhorro, EstadoMeta } from '@/types/meta_ahorro'

interface MetaCardProps {
  meta: MetaAhorro
  onClick: (meta: MetaAhorro) => void
}

function estadoBadgeClasses(estado: EstadoMeta): string {
  const map: Record<EstadoMeta, string> = {
    activa: 'bg-[var(--accent-muted)] text-[var(--accent)]',
    completada: 'bg-[var(--success-muted)] text-[var(--success)]',
    cancelada: 'bg-[var(--surface-raised)] text-[var(--text-muted)]',
  }
  return map[estado]
}

export function MetaCard({ meta, onClick }: MetaCardProps): JSX.Element {
  const { t } = useTranslation()

  const porcentaje =
    meta.monto_objetivo > 0
      ? Math.min(100, (meta.monto_actual / meta.monto_objetivo) * 100)
      : 0

  const isCompletada = porcentaje >= 100 || meta.estado === 'completada'
  const colorMeta = meta.color ?? '#366092'

  const estadoLabel = (estado: EstadoMeta): string => {
    const key = `metas.status.${estado}` as const
    return t(key)
  }

  return (
    <button
      type="button"
      onClick={() => onClick(meta)}
      className={cn(
        'finza-card text-left w-full transition-all hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finza-blue',
        meta.estado === 'cancelada' && 'opacity-60'
      )}
      aria-label={`${t('metas.detail.ahorrado')} ${meta.nombre}`}
    >
      {/* Header: icono prominente + nombre + badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Icono / emoji */}
          {meta.icono ? (
            <div
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl text-2xl"
              style={{ backgroundColor: `${colorMeta}20` }}
              aria-hidden="true"
            >
              {meta.icono}
            </div>
          ) : (
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: colorMeta }}
              aria-hidden="true"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {meta.nombre}
            </p>
            {meta.descripcion && (
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                {meta.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Badge estado */}
        {isCompletada ? (
          <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--success-muted)] text-[var(--success)] whitespace-nowrap">
            {t('metas.card.completada')}
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
          <p className="text-xs text-[var(--text-muted)]">{t('metas.card.ahorrado')}</p>
          <p
            className="text-lg font-bold font-mono"
            style={{ color: colorMeta }}
          >
            {formatMoney(meta.monto_actual, meta.moneda || 'DOP')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-muted)]">{t('metas.card.objetivo')}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {formatMoney(meta.monto_objetivo, meta.moneda || 'DOP')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        porcentaje={porcentaje}
        color={colorMeta}
        aria-label={t('metas.card.porcentaje', { pct: Math.round(porcentaje) })}
      />
      <p className="text-xs text-[var(--text-muted)] mt-1">
        {t('metas.card.porcentaje', { pct: Math.round(porcentaje) })}
      </p>

      {/* Fecha objetivo */}
      {meta.fecha_objetivo && (
        <p className="text-xs text-[var(--text-muted)] mt-2">
          {t('metas.card.objetivoFecha')}{' '}
          <span className="text-[var(--text-primary)]">{formatDate(meta.fecha_objetivo)}</span>
        </p>
      )}
    </button>
  )
}

