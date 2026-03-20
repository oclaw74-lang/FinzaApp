import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/lib/utils'
import { useMetasResumen } from '@/hooks/useMetas'

function SkeletonCard(): JSX.Element {
  return (
    <div className="finza-card animate-pulse" aria-hidden="true">
      <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-200 rounded" />
    </div>
  )
}

export function MetasResumenCards(): JSX.Element {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useMetasResumen()

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        aria-label={t('metas.resumen.cargando')}
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const resumen = data ?? {
    total_ahorrado: 0,
    metas_activas: 0,
    metas_completadas: 0,
    porcentaje_promedio_cumplimiento: 0,
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {isError && (
        <p className="col-span-3 text-xs text-gray-400 text-center">
          {t('metas.resumen.errorCargar')}
        </p>
      )}

      {/* Total ahorrado */}
      <div className="finza-card border border-[rgba(255,255,255,0.06)]">
        <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
          {t('metas.resumen.totalAhorrado')}
        </p>
        <p
          className="text-2xl font-bold font-mono text-prosperity-green"
          aria-label={`${t('metas.resumen.totalAhorrado')} ${formatMoney(resumen.total_ahorrado)}`}
        >
          {formatMoney(resumen.total_ahorrado)}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{t('metas.resumen.enMetasActivas')}</p>
      </div>

      {/* Metas activas */}
      <div className="finza-card border border-[rgba(255,255,255,0.06)]">
        <p className="text-sm font-medium text-[var(--text-muted)] mb-1">{t('metas.resumen.metasActivas')}</p>
        <p
          className="text-2xl font-bold text-finza-blue"
          aria-label={`${resumen.metas_activas} ${t('metas.resumen.metasActivas')}`}
        >
          {resumen.metas_activas}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {resumen.metas_completadas} {t('metas.status.completada').toLowerCase()}
          {resumen.metas_completadas !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Cumplimiento promedio */}
      <div className="finza-card border border-[rgba(255,255,255,0.06)]">
        <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
          {t('metas.resumen.cumplimientoPromedio')}
        </p>
        <p
          className="text-2xl font-bold text-golden-flow"
          aria-label={`${Math.round(resumen.porcentaje_promedio_cumplimiento)}% ${t('metas.resumen.cumplimientoPromedio')}`}
        >
          {Math.round(resumen.porcentaje_promedio_cumplimiento)}%
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{t('metas.resumen.sobreTodasMetas')}</p>
      </div>
    </div>
  )
}

