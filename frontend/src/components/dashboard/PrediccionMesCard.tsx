import { TrendingDown, TrendingUp, Calendar, Lightbulb } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, formatMoney } from '@/lib/utils'
import { usePrediccionMes } from '@/hooks/usePrediccionMes'
import { Skeleton } from '@/components/ui/skeleton'

export function PrediccionMesCard(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { data, isLoading, isError } = usePrediccionMes()

  if (isLoading) {
    return (
      <div className="finza-card p-5 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="finza-card p-5 text-[var(--text-muted)] text-sm">
        {t('common.noData')}
      </div>
    )
  }

  // Resolve category name based on current language
  const isEn = i18n.language === 'en'
  const categoriaNombre = data.categoria_mayor_impacto
    ? (isEn && data.categoria_mayor_impacto.nombre_en) || data.categoria_mayor_impacto.nombre
    : null

  // Build suggestion text
  let sugerenciaText: string
  if (data.sugerencia_tipo === 'reducir' && data.sugerencia_datos) {
    const catName = isEn
      ? (data.sugerencia_datos.categoria_en ?? data.sugerencia_datos.categoria ?? '')
      : (data.sugerencia_datos.categoria ?? '')
    sugerenciaText = t('prediccion.sugerenciaReducir', {
      categoria: catName,
      monto: data.sugerencia_datos.monto ?? 0,
    })
  } else if (data.sugerencia_tipo === 'positivo') {
    sugerenciaText = t('prediccion.sugerenciaPositiva')
  } else {
    sugerenciaText = t('prediccion.sugerenciaNegativa')
  }

  return (
    <div
      className={cn(
        'finza-card p-5',
        data.es_negativa && 'border-l-4 border-[var(--danger)]'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            {t('prediccion.title')}
          </p>
          <div className="flex items-center gap-2">
            {data.es_negativa ? (
              <TrendingDown size={18} className="text-[var(--danger)]" />
            ) : (
              <TrendingUp size={18} className="text-[var(--success)]" />
            )}
            <span
              className={cn(
                'text-2xl font-bold tabular-nums',
                data.es_negativa ? 'text-[var(--danger)]' : 'text-[var(--success)]'
              )}
            >
              {formatMoney(data.saldo_proyectado)}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('prediccion.saldoProyectado')}</p>
        </div>

        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] bg-surface-raised px-2 py-1 rounded-lg">
          <Calendar size={12} />
          <span>{data.dias_restantes}d</span>
        </div>
      </div>

      {/* Grid de metricas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Gasto diario */}
        <div className="bg-surface-raised rounded-lg p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {t('prediccion.gastoDiario')}
          </p>
          <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
            {formatMoney(data.gasto_diario_promedio)}
          </p>
        </div>

        {/* Si respeta presupuesto */}
        <div className="bg-surface-raised rounded-lg p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {t('prediccion.siPresupuesto')}
          </p>
          <p
            className={cn(
              'text-sm font-bold tabular-nums',
              data.saldo_si_presupuesto == null
                ? 'text-[var(--text-muted)]'
                : data.saldo_si_presupuesto >= 0
                  ? 'text-[var(--success)]'
                  : 'text-[var(--danger)]'
            )}
          >
            {data.saldo_si_presupuesto != null
              ? formatMoney(data.saldo_si_presupuesto)
              : '—'}
          </p>
        </div>
      </div>

      {/* Categoria de mayor impacto */}
      {data.categoria_mayor_impacto && (
        <div className="mb-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
            {t('prediccion.mayorImpacto')}
          </p>
          <div className="flex items-center justify-between bg-surface-raised rounded-lg px-3 py-2">
            <span className="text-sm text-[var(--text-primary)] font-medium">
              {categoriaNombre}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                {data.categoria_mayor_impacto.porcentaje_del_total}%
              </span>
              <span className="text-sm font-bold tabular-nums text-[var(--danger)]">
                {formatMoney(data.categoria_mayor_impacto.monto)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sugerencia */}
      <div className="flex items-start gap-2 bg-[var(--accent)]/10 rounded-lg px-3 py-2.5">
        <Lightbulb size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{sugerenciaText}</p>
      </div>
    </div>
  )
}