import { useState } from 'react'
import { X, Pencil, Trash2, Plus, ArrowDown, ArrowUp } from 'lucide-react'
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
    activa: 'bg-blue-100 text-finza-blue',
    completada: 'bg-green-100 text-prosperity-green',
    cancelada: 'bg-gray-100 text-gray-500',
  }
  return map[estado]
}

function estadoLabel(estado: EstadoMeta): string {
  const map: Record<EstadoMeta, string> = {
    activa: 'Activa',
    completada: 'Completada',
    cancelada: 'Cancelada',
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
    if (window.confirm('Eliminar esta contribucion?')) {
      await deleteContribucion.mutateAsync(contribucionId)
    }
  }

  if (isLoading && !displayMeta) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative bg-white rounded-card shadow-card-hover w-full max-w-xl p-6 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (isError && !displayMeta) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative bg-white rounded-card shadow-card-hover w-full max-w-xl p-6">
          <p className="text-sm text-gray-500">
            No se pudo cargar el detalle de la meta.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="mt-4"
          >
            Cerrar
          </Button>
        </div>
      </div>
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de meta: ${displayMeta.nombre}`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-card shadow-card-hover w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-gray-900 truncate">
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
                {estadoLabel(displayMeta.estado)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-3 flex-shrink-0"
            aria-label="Cerrar detalle"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Montos y progreso */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs text-gray-400">Ahorrado</p>
                <p
                  className="text-3xl font-bold money"
                  style={{ color: colorMeta }}
                >
                  {formatMoney(displayMeta.monto_actual)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Objetivo</p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatMoney(displayMeta.monto_objetivo)}
                </p>
              </div>
            </div>
            <ProgressBar
              porcentaje={porcentaje}
              color={colorMeta}
              aria-label={`${porcentaje}% de la meta ${displayMeta.nombre}`}
            />
            <p className="text-xs text-gray-400 mt-1">{porcentaje}% completado</p>
          </div>

          {/* Datos generales */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Fecha inicio</p>
              <p className="text-gray-900">
                {formatDate(displayMeta.fecha_inicio)}
              </p>
            </div>
            {displayMeta.fecha_objetivo && (
              <div>
                <p className="text-xs text-gray-400">Fecha objetivo</p>
                <p className="text-gray-900">
                  {formatDate(displayMeta.fecha_objetivo)}
                </p>
              </div>
            )}
          </div>

          {displayMeta.descripcion && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Descripcion</p>
              <p className="text-sm text-gray-900">{displayMeta.descripcion}</p>
            </div>
          )}

          {/* Lista de contribuciones */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Historial de contribuciones
            </p>

            {isLoadingContribuciones && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            )}

            {!isLoadingContribuciones &&
              contribucionesOrdenadas.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  Sin contribuciones aun. Agrega tu primer deposito.
                </p>
              )}

            {!isLoadingContribuciones &&
              contribucionesOrdenadas.length > 0 && (
                <div className="space-y-2">
                  {contribucionesOrdenadas.map((contrib) => (
                    <div
                      key={contrib.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
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
                            <p className="text-xs text-gray-400">
                              {contrib.notas}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">
                          {formatDate(contrib.fecha)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDeleteContribucion(contrib.id)}
                          className="text-gray-300 hover:text-alert-red transition-colors"
                          aria-label="Eliminar contribucion"
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
            <div className="border border-border rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Agregar contribucion
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
              Agregar contribucion
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(displayMeta)}
            >
              <Pencil size={15} className="mr-1" />
              Editar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(displayMeta.id)}
            >
              <Trash2 size={15} className="mr-1" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
