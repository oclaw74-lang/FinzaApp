import { useTranslation } from 'react-i18next'
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'
import { useComparativa } from '@/hooks/useComparativa'
import type { ItemComparativa } from '@/types/comparativa'

function SkeletonRow(): JSX.Element {
  return (
    <div className="flex justify-between items-center py-2 animate-pulse">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

interface ItemRowProps {
  item: ItemComparativa
}

function ItemRow({ item }: ItemRowProps): JSX.Element {
  const isDeuda = item.tipo === 'deuda'
  return (
    <div className="flex justify-between items-start py-2 border-b border-[var(--border)] last:border-0 gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{item.nombre}</p>
        {item.tasa_anual !== null && (
          <p className="text-xs text-[var(--text-muted)]">{item.tasa_anual}% anual</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-[var(--text-primary)]">
          {formatCurrency(item.monto)}
        </p>
        <p
          className={cn(
            'text-xs font-medium',
            isDeuda ? 'text-red-500' : 'text-green-500'
          )}
        >
          {isDeuda ? '-' : '+'}{formatCurrency(item.costo_o_rendimiento_mensual)}/mes
        </p>
      </div>
    </div>
  )
}

export function ComparativaCard(): JSX.Element {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useComparativa()

  if (isError) {
    return null as unknown as JSX.Element
  }

  const diferenciaPositiva = data ? data.diferencia > 0 : false
  const diferenciaNeutra = data ? Math.abs(data.diferencia) < 1 : false

  return (
    <section aria-label={t('comparativa.title')} className="finza-card p-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{t('comparativa.title')}</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Two-column table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deudas column */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={14} className="text-red-500" aria-hidden="true" />
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                {t('comparativa.deudas')}
              </p>
            </div>

            {isLoading && (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}

            {!isLoading && data?.deudas.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] py-2">{t('comparativa.noDeudas')}</p>
            )}

            {!isLoading && data?.deudas.map((item) => (
              <ItemRow key={item.nombre} item={item} />
            ))}

            {!isLoading && data && data.deudas.length > 0 && (
              <div className="flex justify-between items-center pt-2 mt-1">
                <p className="text-xs font-bold text-[var(--text-muted)]">
                  {t('comparativa.totalCosto')}
                </p>
                <p className="text-xs font-bold text-red-500">
                  {formatCurrency(data.total_costo_deuda)}/mes
                </p>
              </div>
            )}
          </div>

          {/* Ahorros column */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={14} className="text-green-500" aria-hidden="true" />
              <p className="text-xs font-semibold text-green-500 uppercase tracking-wide">
                {t('comparativa.ahorros')}
              </p>
            </div>

            {isLoading && (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}

            {!isLoading && data?.ahorros.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] py-2">{t('comparativa.noAhorros')}</p>
            )}

            {!isLoading && data?.ahorros.map((item) => (
              <ItemRow key={item.nombre} item={item} />
            ))}

            {!isLoading && data && data.ahorros.length > 0 && (
              <div className="flex justify-between items-center pt-2 mt-1">
                <p className="text-xs font-bold text-[var(--text-muted)]">
                  {t('comparativa.totalRendimiento')}
                </p>
                <p className="text-xs font-bold text-green-500">
                  +{formatCurrency(data.total_rendimiento_ahorro)}/mes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Diferencia */}
        {!isLoading && data && (
          <div className="flex justify-between items-center py-2 border-t border-[var(--border)]">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {t('comparativa.diferencia')}
            </p>
            <p
              className={cn(
                'text-sm font-bold',
                diferenciaPositiva ? 'text-red-500' : diferenciaNeutra ? 'text-[var(--text-muted)]' : 'text-green-500'
              )}
            >
              {diferenciaPositiva ? '+' : ''}{formatCurrency(data.diferencia)}/mes
            </p>
          </div>
        )}

        {/* Recomendacion banner */}
        {!isLoading && data && (
          <div
            className={cn(
              'flex items-start gap-2 rounded-xl p-3',
              diferenciaPositiva
                ? 'bg-red-50 dark:bg-red-900/20'
                : diferenciaNeutra
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : 'bg-green-50 dark:bg-green-900/20'
            )}
            role="note"
            aria-label={t('comparativa.recomendacion')}
          >
            {diferenciaPositiva ? (
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
            ) : diferenciaNeutra ? (
              <MinusCircle size={16} className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div>
              <p
                className={cn(
                  'text-xs font-semibold mb-0.5',
                  diferenciaPositiva
                    ? 'text-red-600 dark:text-red-400'
                    : diferenciaNeutra
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-green-600 dark:text-green-400'
                )}
              >
                {t('comparativa.recomendacion')}
              </p>
              <p className="text-xs text-[var(--text-primary)]">{data.recomendacion}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
