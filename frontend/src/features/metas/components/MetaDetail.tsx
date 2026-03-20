import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Pencil, Trash2, Plus, ArrowDown, ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import { ProgressBar } from './ProgressBar'
import { ContribucionForm } from './ContribucionForm'
import type { ContribucionFormData } from './ContribucionForm'
import {
  useMetaDetalle,
  useContribucionesMeta,
  useAgregarContribucion,
  useDeleteContribucion,
} from '@/hooks/useMetas'
import type { MetaAhorro, EstadoMeta, TipoContribucion } from '@/types/meta_ahorro'

interface MetaDetailProps {
  metaId: string
  metaCache?: MetaAhorro
  onClose: () => void
  onEdit: (meta: MetaAhorro) => void
  onDelete: (id: string) => void
}

function estadoBadgeClasses(estado: EstadoMeta): string {
  const map: Record<EstadoMeta, string> = {
    activa: 'bg-[var(--accent-muted)] text-[var(--accent)]',
    completada: 'bg-[var(--success-muted)] text-[var(--success)]',
    cancelada: 'bg-[var(--surface-raised)] text-[var(--text-muted)]',
  }
  return map[estado]
}

function tipoContribucionColor(tipo: TipoContribucion): string {
  return tipo === 'deposito' ? 'text-prosperity-green' : 'text-golden-flow'
}

export function MetaDetail({
  metaId,
  metaCache,
  onClose,
  onEdit,
  onDelete,
}: MetaDetailProps): JSX.Element {
  const { t } = useTranslation()
  const [showContribucionForm, setShowContribucionForm] = useState(false)

  const { data: meta, isLoading, isError } = useMetaDetalle(metaId)
  const {
    data: contribuciones = [],
    isLoading: isLoadingContribuciones,
  } = useContribucionesMeta(metaId)

  const agregarContribucion = useAgregarContribucion(metaId)
  const deleteContribucion = useDeleteContribucion(metaId)

  const displayMeta = meta ?? metaCache

  const handleAgregarContribucion = async (
    data: ContribucionFormData
  ): Promise<void> => {
    await agregarContribucion.mutateAsync(data)
    setShowContribucionForm(false)
  }

  const handleDeleteContribucion = async (
    contribucionId: string
  ): Promise<void> => {
    if (window.confirm(t('metas.contribucion.confirmarEliminar'))) {
      await deleteContribucion.mutateAsync(contribucionId)
    }
  }

  if (isLoading && !displayMeta) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative bg-[var(--surface)] dark:border dark:border-white/[0.08] rounded-card shadow-card-hover w-full max-w-xl p-6 animate-pulse">
          <div className="h-6 w-48 bg-[var(--surface-raised)] rounded mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-[var(--surface-raised)] rounded" />
            <div className="h-4 w-3/4 bg-[var(--surface-raised)] rounded" />
            <div className="h-4 w-1/2 bg-[var(--surface-raised)] rounded" />
          </div>
        </div>
      </div>,
      document.body
    )
  }

  if (isError && !displayMeta) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative bg-[var(--surface)] dark:border dark:border-white/[0.08] rounded-card shadow-card-hover w-full max-w-xl p-6">
          <p className="text-sm text-gray-500">
            {t('metas.detail.noCargar')}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="mt-4"
          >
            {t('common.close')}
          </Button>
        </div>
      </div>,
      document.body
    )
  }

  if (!displayMeta) return <></>

  const porcentaje =
    displayMeta.monto_objetivo > 0
      ? Math.min(
          100,
          Math.round(
            (displayMeta.monto_actual / displayMeta.monto_objetivo) * 100
          )
        )
      : 0

  const colorMeta = displayMeta.color ?? '#366092'

  // Contribuciones en orden cronologico inverso
  const contribucionesOrdenadas = [...contribuciones].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de meta: ${displayMeta.nombre}`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-[var(--surface)] dark:border dark:border-white/[0.08] rounded-card shadow-card-hover w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">
              {displayMeta.icono ? `${displayMeta.icono} ` : ''}
              {displayMeta.nombre}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  estadoBadgeClasses(displayMeta.estado)
                )}
              >
                {t(`metas.status.${displayMeta.estado}`)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-3 flex-shrink-0"
            aria-label={t('metas.detail.cerrar')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Montos y progreso */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs text-[var(--text-muted)]">{t('metas.detail.ahorrado')}</p>
                <p
                  className="text-3xl font-bold money"
                  style={{ color: colorMeta }}
                >
                  {formatMoney(displayMeta.monto_actual)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">{t('metas.detail.objetivo')}</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {formatMoney(displayMeta.monto_objetivo)}
                </p>
              </div>
            </div>
            <ProgressBar
              porcentaje={porcentaje}
              color={colorMeta}
              aria-label={t('metas.detail.porcentaje', { pct: porcentaje })}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {t('metas.detail.porcentaje', { pct: porcentaje })}
            </p>
          </div>

          {/* Datos generales */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[var(--text-muted)]">{t('metas.detail.fechaInicio')}</p>
              <p className="text-[var(--text-primary)]">
                {formatDate(displayMeta.fecha_inicio)}
              </p>
            </div>
            {displayMeta.fecha_objetivo && (
              <div>
                <p className="text-xs text-[var(--text-muted)]">{t('metas.detail.fechaObjetivo')}</p>
                <p className="text-[var(--text-primary)]">
                  {formatDate(displayMeta.fecha_objetivo)}
                </p>
              </div>
            )}
          </div>

          {displayMeta.descripcion && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('metas.detail.descripcion')}</p>
              <p className="text-sm text-[var(--text-primary)]">{displayMeta.descripcion}</p>
            </div>
          )}

          {/* Lista de contribuciones */}
          <div>
            <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
              {t('metas.detail.historial')}
            </p>

            {isLoadingContribuciones && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-[var(--surface-raised)] rounded-lg animate-pulse"
                  />
                ))}
              </div>
            )}

            {!isLoadingContribuciones &&
              contribucionesOrdenadas.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">
                  {t('metas.detail.sinContribuciones')}
                </p>
              )}

            {!isLoadingContribuciones &&
              contribucionesOrdenadas.length > 0 && (
                <div className="space-y-2">
                  {contribucionesOrdenadas.map((contrib) => (
                    <div
                      key={contrib.id}
                      className="flex items-center justify-between py-2 px-3 bg-[var(--surface-raised)] rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {contrib.tipo === 'deposito' ? (
                          <ArrowDown
                            size={14}
                            className="text-prosperity-green flex-shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowUp
                            size={14}
                            className="text-golden-flow flex-shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <div>
                          <p
                            className={cn(
                              'text-sm font-medium',
                              tipoContribucionColor(contrib.tipo)
                            )}
                          >
                            {contrib.tipo === 'deposito' ? '+' : '-'}
                            {formatMoney(contrib.monto)}
                          </p>
                          {contrib.notas && (
                            <p className="text-xs text-[var(--text-muted)]">
                              {contrib.notas}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatDate(contrib.fecha)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDeleteContribucion(contrib.id)}
                          className="text-[var(--text-subtle)] hover:text-alert-red transition-colors"
                          aria-label={t('metas.contribucion.eliminarLabel')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Formulario contribucion inline */}
          {showContribucionForm && displayMeta.estado === 'activa' && (
            <div className="border border-[var(--border)] bg-[var(--surface-raised)] rounded-lg p-4">
              <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                {t('metas.detail.agregarContribucion')}
              </p>
              <ContribucionForm
                montoActual={displayMeta.monto_actual}
                onSubmit={handleAgregarContribucion}
                onCancel={() => setShowContribucionForm(false)}
                isLoading={agregarContribucion.isPending}
              />
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between p-6 pt-0 gap-3 flex-wrap">
          {!showContribucionForm && displayMeta.estado === 'activa' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => setShowContribucionForm(true)}
            >
              <Plus size={15} className="mr-1" />
              {t('metas.detail.agregarContribucionBtn')}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(displayMeta)}
            >
              <Pencil size={15} className="mr-1" />
              {t('common.edit')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(displayMeta.id)}
            >
              <Trash2 size={15} className="mr-1" />
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
