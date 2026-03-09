import { useState } from 'react'
import { X, Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import { PagoForm } from './PagoForm'
import type { PagoFormData } from './PagoForm'
import { useDeletePago, useRegistrarPago, usePrestamoDetalle } from '@/hooks/usePrestamos'
import type { Prestamo, EstadoPrestamo } from '@/types/prestamo'

interface PrestamoDetailProps {
  prestamoId: string
  prestamoCache?: Prestamo
  onClose: () => void
  onEdit: (prestamo: Prestamo) => void
  onDelete: (id: string) => void
}

function estadoLabel(estado: EstadoPrestamo): string {
  const map: Record<EstadoPrestamo, string> = {
    activo: 'Activo',
    pagado: 'Pagado',
    vencido: 'Vencido',
  }
  return map[estado]
}

function estadoColor(estado: EstadoPrestamo): string {
  const map: Record<EstadoPrestamo, string> = {
    activo: 'text-finza-blue',
    pagado: 'text-prosperity-green',
    vencido: 'text-alert-red',
  }
  return map[estado]
}

export function PrestamoDetail({
  prestamoId,
  prestamoCache,
  onClose,
  onEdit,
  onDelete,
}: PrestamoDetailProps): JSX.Element {
  const [showPagoForm, setShowPagoForm] = useState(false)

  const { data: prestamo, isLoading, isError } = usePrestamoDetalle(prestamoId)
  const registrarPago = useRegistrarPago(prestamoId)
  const deletePago = useDeletePago(prestamoId)

  const displayPrestamo = prestamo ?? prestamoCache

  const handleRegistrarPago = async (data: PagoFormData): Promise<void> => {
    await registrarPago.mutateAsync(data)
    setShowPagoForm(false)
  }

  const handleDeletePago = async (pagoId: string): Promise<void> => {
    if (window.confirm('Eliminar este pago?')) {
      await deletePago.mutateAsync(pagoId)
    }
  }

  if (isLoading && !displayPrestamo) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
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

  if (isError && !displayPrestamo) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className="relative bg-white rounded-card shadow-card-hover w-full max-w-xl p-6">
          <p className="text-sm text-gray-500">No se pudo cargar el detalle del prestamo.</p>
          <Button variant="secondary" size="sm" onClick={onClose} className="mt-4">
            Cerrar
          </Button>
        </div>
      </div>
    )
  }

  if (!displayPrestamo) return <></>

  const porcentajePagado =
    displayPrestamo.monto_original > 0
      ? Math.min(
          100,
          Math.round(
            ((displayPrestamo.monto_original - displayPrestamo.monto_pendiente) /
              displayPrestamo.monto_original) *
              100
          )
        )
      : 0

  const isTipoDeben = displayPrestamo.tipo === 'me_deben'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de prestamo con ${displayPrestamo.persona}`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-card shadow-card-hover w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{displayPrestamo.persona}</h2>
            <p className="text-sm text-gray-400">
              {isTipoDeben ? 'Me deben' : 'Yo debo'} &middot;{' '}
              <span className={cn('font-medium', estadoColor(displayPrestamo.estado))}>
                {estadoLabel(displayPrestamo.estado)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
                <p className="text-xs text-gray-400">Pendiente</p>
                <p
                  className="text-3xl font-bold money"
                  style={{ color: isTipoDeben ? '#00B050' : '#FF0000' }}
                >
                  {formatMoney(displayPrestamo.monto_pendiente, displayPrestamo.moneda)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Original</p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatMoney(displayPrestamo.monto_original, displayPrestamo.moneda)}
                </p>
              </div>
            </div>
            <div
              className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={porcentajePagado}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${porcentajePagado}% pagado`}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${porcentajePagado}%`,
                  backgroundColor: isTipoDeben ? '#00B050' : '#FF0000',
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{porcentajePagado}% pagado</p>
          </div>

          {/* Datos */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Fecha prestamo</p>
              <p className="text-gray-900">{formatDate(displayPrestamo.fecha_prestamo)}</p>
            </div>
            {displayPrestamo.fecha_vencimiento && (
              <div>
                <p className="text-xs text-gray-400">Fecha vencimiento</p>
                <p
                  className={cn(
                    'text-gray-900',
                    displayPrestamo.estado === 'activo' &&
                      new Date(displayPrestamo.fecha_vencimiento) < new Date() &&
                      'text-alert-red font-medium'
                  )}
                >
                  {formatDate(displayPrestamo.fecha_vencimiento)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Moneda</p>
              <p className="text-gray-900">{displayPrestamo.moneda}</p>
            </div>
          </div>

          {displayPrestamo.descripcion && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Descripcion</p>
              <p className="text-sm text-gray-900">{displayPrestamo.descripcion}</p>
            </div>
          )}
          {displayPrestamo.notas && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Notas</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{displayPrestamo.notas}</p>
            </div>
          )}

          {/* Historial de pagos */}
          {displayPrestamo.pagos && displayPrestamo.pagos.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Historial de pagos</p>
              <div className="space-y-2">
                {displayPrestamo.pagos.map((pago) => (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatMoney(pago.monto, displayPrestamo.moneda)}
                      </p>
                      {pago.notas && (
                        <p className="text-xs text-gray-400">{pago.notas}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">{formatDate(pago.fecha)}</p>
                      <button
                        type="button"
                        onClick={() => handleDeletePago(pago.id)}
                        className="text-gray-300 hover:text-alert-red transition-colors"
                        aria-label="Eliminar pago"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario pago inline */}
          {showPagoForm && displayPrestamo.estado !== 'pagado' && (
            <div className="border border-border rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Registrar pago</p>
              <PagoForm
                montoPendiente={displayPrestamo.monto_pendiente}
                onSubmit={handleRegistrarPago}
                onCancel={() => setShowPagoForm(false)}
                isLoading={registrarPago.isPending}
              />
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between p-6 pt-0 gap-3 flex-wrap">
          {!showPagoForm && displayPrestamo.estado !== 'pagado' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => setShowPagoForm(true)}
            >
              <Plus size={15} className="mr-1" />
              Registrar pago
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(displayPrestamo)}
            >
              <Pencil size={15} className="mr-1" />
              Editar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(displayPrestamo.id)}
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
