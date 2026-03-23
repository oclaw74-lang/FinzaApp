import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Pencil, Trash2, Plus, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import { PagoForm } from './PagoForm'
import type { PagoFormData } from './PagoForm'
import { useDeletePago, useRegistrarPago, usePrestamoDetalle, useTablaAmortizacion, useUpdatePrestamo } from '@/hooks/usePrestamos'
import type { Prestamo, EstadoPrestamo } from '@/types/prestamo'
import { getApiErrorMessage } from '@/lib/apiError'

interface PrestamoDetailProps {
  prestamoId: string
  prestamoCache?: Prestamo
  onClose: () => void
  onEdit: (prestamo: Prestamo) => void
  onDelete: (id: string) => void
}

function estadoLabel(estado: EstadoPrestamo, t: (key: string) => string): string {
  const map: Record<EstadoPrestamo, string> = {
    activo: t('prestamos.status.activo'),
    pagado: t('prestamos.status.pagado'),
    vencido: t('prestamos.status.vencido'),
    cancelado: t('prestamos.status.cancelado'),
  }
  return map[estado]
}

function estadoColor(estado: EstadoPrestamo): string {
  const map: Record<EstadoPrestamo, string> = {
    activo: 'text-finza-blue',
    pagado: 'text-prosperity-green',
    vencido: 'text-alert-red',
    cancelado: 'text-[var(--text-muted)]',
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
  const { t } = useTranslation()
  const [showPagoForm, setShowPagoForm] = useState(false)

  const { data: prestamo, isLoading, isError } = usePrestamoDetalle(prestamoId)
  const registrarPago = useRegistrarPago(prestamoId)
  const deletePago = useDeletePago(prestamoId)
  const updatePrestamo = useUpdatePrestamo()
  const [tablaExpanded, setTablaExpanded] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  const displayPrestamo = prestamo ?? prestamoCache

  const hasAmortizacion =
    displayPrestamo != null &&
    displayPrestamo.tasa_interes != null &&
    displayPrestamo.plazo_meses != null

  const {
    data: amortizacion,
    isLoading: loadingAmortizacion,
  } = useTablaAmortizacion(hasAmortizacion ? prestamoId : null)

  const handleRegistrarPago = async (data: PagoFormData): Promise<void> => {
    try {
      await registrarPago.mutateAsync(data)
      setShowPagoForm(false)
      toast.success(t('prestamos.pagoRegistrado'))
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleDeletePago = async (pagoId: string): Promise<void> => {
    if (window.confirm(t('prestamos.detail.pagoConfirm'))) {
      await deletePago.mutateAsync(pagoId)
    }
  }

  const handleCancelar = async (): Promise<void> => {
    if (!window.confirm(t('prestamos.detail.cancelarConfirm'))) return
    try {
      setCancelando(true)
      await updatePrestamo.mutateAsync({ id: prestamoId, estado: 'cancelado' })
      toast.success(t('prestamos.detail.cancelarExito'))
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setCancelando(false)
    }
  }

  if (isLoading && !displayPrestamo) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className="relative bg-[var(--surface)] dark:border dark:border-white/[0.08] rounded-card w-full max-w-3xl p-6 animate-pulse">
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

  if (isError && !displayPrestamo) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className="relative bg-[var(--surface)] dark:border dark:border-white/[0.08] rounded-card w-full max-w-3xl p-6">
          <p className="text-sm text-[var(--text-muted)]">{t('prestamos.detail.noCargar')}</p>
          <Button variant="secondary" size="sm" onClick={onClose} className="mt-4">
            {t('common.close')}
          </Button>
        </div>
      </div>,
      document.body
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de prestamo con ${displayPrestamo.persona}`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-[var(--surface)] dark:border dark:border-white/[0.08] rounded-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{displayPrestamo.persona}</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {isTipoDeben ? t('prestamos.detail.meDeben') : t('prestamos.detail.yoDebo')} &middot;{' '}
              <span className={cn('font-medium', estadoColor(displayPrestamo.estado))}>
                {estadoLabel(displayPrestamo.estado, t)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label={t('prestamos.detail.cerrar')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Montos y progreso */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs text-[var(--text-muted)]">{t('prestamos.detail.pendiente')}</p>
                <p
                  className="text-3xl font-bold money"
                  style={{ color: isTipoDeben ? '#00B050' : '#FF0000' }}
                >
                  {formatMoney(displayPrestamo.monto_pendiente, displayPrestamo.moneda)}
                </p>
                {hasAmortizacion && displayPrestamo.total_intereses != null && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {t('prestamos.detail.totalConIntereses')}{' '}
                    <span className="font-medium text-[var(--text-primary)]">
                      {formatMoney(
                        displayPrestamo.monto_original + displayPrestamo.total_intereses,
                        displayPrestamo.moneda
                      )}
                    </span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">{t('prestamos.detail.original')}</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {formatMoney(displayPrestamo.monto_original, displayPrestamo.moneda)}
                </p>
              </div>
            </div>
            <div
              className="w-full h-2 bg-[var(--surface-raised)] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={porcentajePagado}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('prestamos.detail.porcentajePagado', { pct: porcentajePagado })}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${porcentajePagado}%`,
                  backgroundColor: isTipoDeben ? '#00B050' : '#FF0000',
                }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {t('prestamos.detail.porcentajePagado', { pct: porcentajePagado })}
            </p>
          </div>

          {/* Datos */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[var(--text-muted)]">{t('prestamos.detail.fechaPrestamo')}</p>
              <p className="text-[var(--text-primary)]">{formatDate(displayPrestamo.fecha_prestamo)}</p>
            </div>
            {displayPrestamo.fecha_vencimiento && (
              <div>
                <p className="text-xs text-[var(--text-muted)]">{t('prestamos.detail.fechaVencimiento')}</p>
                <p
                  className={cn(
                    'text-[var(--text-primary)]',
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
              <p className="text-xs text-[var(--text-muted)]">{t('prestamos.detail.moneda')}</p>
              <p className="text-[var(--text-primary)]">{displayPrestamo.moneda}</p>
            </div>
            {displayPrestamo.plazo_meses != null && (
              <div>
                <p className="text-xs text-[var(--text-muted)]">{t('prestamos.detail.plazo')}</p>
                <p className="text-[var(--text-primary)]">{displayPrestamo.plazo_meses} {t('prestamos.detail.meses')}</p>
              </div>
            )}
          </div>

          {/* Detalles financieros — intereses */}
          {(displayPrestamo.tasa_interes != null || displayPrestamo.cuota_mensual != null) && (
            <div className="bg-[var(--surface-raised)] rounded-xl p-4 grid grid-cols-2 gap-3">
              {displayPrestamo.tasa_interes != null && (
                <div>
                  <p className="text-xs text-[var(--text-muted)]">{t('prestamos.form.tasaInteres')}</p>
                  <p className="text-sm font-semibold text-[var(--warning)]">{displayPrestamo.tasa_interes}{t('prestamos.detail.anual')}</p>
                </div>
              )}
              {displayPrestamo.cuota_mensual != null && (
                <div>
                  <p className="text-xs text-[var(--text-muted)]">{t('prestamos.cuota')}</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{formatMoney(displayPrestamo.cuota_mensual, displayPrestamo.moneda)}</p>
                </div>
              )}
              {displayPrestamo.total_intereses != null && (
                <div>
                  <p className="text-xs text-[var(--text-muted)]">{t('prestamos.totalIntereses')}</p>
                  <p className="text-sm font-semibold text-[var(--danger)]">{formatMoney(displayPrestamo.total_intereses, displayPrestamo.moneda)}</p>
                </div>
              )}
              {displayPrestamo.proximo_pago != null && (
                <div>
                  <p className="text-xs text-[var(--text-muted)]">{t('prestamos.proximoPago')}</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{formatDate(displayPrestamo.proximo_pago)}</p>
                </div>
              )}
            </div>
          )}

          {displayPrestamo.descripcion && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('prestamos.detail.descripcion')}</p>
              <p className="text-sm text-[var(--text-primary)]">{displayPrestamo.descripcion}</p>
            </div>
          )}
          {displayPrestamo.notas && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('prestamos.detail.notas')}</p>
              <p className="text-sm text-[var(--text-secondary)] bg-[var(--surface-raised)] rounded-lg p-3">{displayPrestamo.notas}</p>
            </div>
          )}

          {/* Historial de pagos */}
          {displayPrestamo.pagos && displayPrestamo.pagos.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">{t('prestamos.detail.historialPagos')}</p>
              <div className="space-y-2">
                {displayPrestamo.pagos.map((pago) => (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between py-2 px-3 bg-[var(--surface-raised)] rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {formatMoney(pago.monto, displayPrestamo.moneda)}
                      </p>
                      {pago.monto_capital != null && pago.monto_interes != null && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatMoney(pago.monto_capital, displayPrestamo.moneda)} {t('prestamos.detail.capital')}
                          {' + '}
                          {formatMoney(pago.monto_interes, displayPrestamo.moneda)} {t('prestamos.detail.interes')}
                        </p>
                      )}
                      {pago.notas && (
                        <p className="text-xs text-[var(--text-muted)]">{pago.notas}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[var(--text-muted)]">{formatDate(pago.fecha)}</p>
                      <button
                        type="button"
                        onClick={() => handleDeletePago(pago.id)}
                        className="text-[var(--text-subtle)] hover:text-alert-red transition-colors"
                        aria-label={t('prestamos.detail.eliminarPago')}
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
            <div className="border border-[var(--border)] bg-[var(--surface-raised)] rounded-lg p-4">
              <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">{t('prestamos.detail.registrarPago')}</p>
              <PagoForm
                montoPendiente={Number(displayPrestamo.monto_pendiente)}
                onSubmit={handleRegistrarPago}
                onCancel={() => setShowPagoForm(false)}
                isLoading={registrarPago.isPending}
              />
            </div>
          )}

          {/* Tabla de amortizacion */}
          {hasAmortizacion && (
            <div>
              <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                {t('prestamos.detail.tablaAmortizacion')}
              </p>

              {loadingAmortizacion ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : amortizacion ? (
                <>
                  {/* Resumen cards */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-[var(--surface-raised)] rounded-xl p-3">
                      <p className="text-xs text-[var(--text-muted)]">{t('prestamos.detail.capitalPagado')}</p>
                      <p className="text-sm font-bold text-green-500 dark:text-finza-green tabular-nums mt-0.5">
                        {formatMoney(amortizacion.resumen.total_pagado_capital, displayPrestamo.moneda)}
                      </p>
                    </div>
                    <div className="bg-[var(--surface-raised)] rounded-xl p-3">
                      <p className="text-xs text-[var(--text-muted)]">{t('prestamos.detail.interesesPagados')}</p>
                      <p className="text-sm font-bold tabular-nums mt-0.5" style={{ color: 'var(--warning)' }}>
                        {formatMoney(amortizacion.resumen.total_pagado_intereses, displayPrestamo.moneda)}
                      </p>
                    </div>
                    <div className="bg-[var(--surface-raised)] rounded-xl p-3">
                      <p className="text-xs text-[var(--text-muted)]">{t('prestamos.detail.capitalPendiente')}</p>
                      <p className="text-sm font-bold text-finza-blue tabular-nums mt-0.5">
                        {formatMoney(amortizacion.resumen.monto_pendiente, displayPrestamo.moneda)}
                      </p>
                    </div>
                    <div className="bg-[var(--surface-raised)] rounded-xl p-3">
                      <p className="text-xs text-[var(--text-muted)]">{t('prestamos.detail.totalInteresesProyectados')}</p>
                      <p className="text-sm font-bold text-[var(--text-muted)] tabular-nums mt-0.5">
                        {formatMoney(amortizacion.resumen.total_intereses_proyectados, displayPrestamo.moneda)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    {t('prestamos.detail.cuotasPagadas', {
                      pagadas: amortizacion.resumen.cuotas_pagadas,
                      totales: amortizacion.resumen.cuotas_totales,
                    })}
                  </p>

                  {/* Toggle tabla completa */}
                  <button
                    type="button"
                    onClick={() => setTablaExpanded((v) => !v)}
                    className="flex items-center gap-2 text-xs font-medium text-finza-blue hover:text-finza-blue/80 transition-colors mb-2"
                    aria-expanded={tablaExpanded}
                  >
                    {tablaExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {tablaExpanded
                      ? t('prestamos.detail.ocultarTabla')
                      : t('prestamos.detail.verTabla', { cuotas: amortizacion.resumen.cuotas_totales })}
                  </button>

                  {tablaExpanded && (
                    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
                            <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">{t('prestamos.detail.colNum')}</th>
                            <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">{t('prestamos.detail.colFecha')}</th>
                            <th className="px-3 py-2 text-right text-[var(--text-muted)] font-semibold">{t('prestamos.detail.colCuota')}</th>
                            <th className="px-3 py-2 text-right text-[var(--text-muted)] font-semibold">{t('prestamos.detail.colCapital')}</th>
                            <th className="px-3 py-2 text-right text-[var(--text-muted)] font-semibold">{t('prestamos.detail.colInteres')}</th>
                            <th className="px-3 py-2 text-right text-[var(--text-muted)] font-semibold">{t('prestamos.detail.colSaldo')}</th>
                            <th className="px-3 py-2 text-center text-[var(--text-muted)] font-semibold">{t('prestamos.detail.colEstado')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {amortizacion.tabla.map((cuota, idx) => {
                            const isProxima =
                              !cuota.pagado &&
                              (idx === 0 ||
                                amortizacion.tabla[idx - 1]?.pagado === true)
                            return (
                              <tr
                                key={cuota.numero}
                                className={cn(
                                  'border-b border-[var(--border)] last:border-0 transition-colors',
                                  cuota.pagado
                                    ? 'bg-green-50/50 dark:bg-green-950/20'
                                    : isProxima
                                    ? 'bg-blue-50/50 dark:bg-blue-950/20'
                                    : 'hover:bg-[var(--surface-raised)]/50'
                                )}
                              >
                                <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
                                  {cuota.numero}
                                </td>
                                <td className="px-3 py-2 text-[var(--text-muted)]">
                                  {formatDate(cuota.fecha_estimada)}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-[var(--text-primary)]">
                                  {formatMoney(cuota.cuota, displayPrestamo.moneda)}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-[var(--text-primary)]">
                                  {formatMoney(cuota.capital, displayPrestamo.moneda)}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--warning)' }}>
                                  {formatMoney(cuota.interes, displayPrestamo.moneda)}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-[var(--text-muted)]">
                                  {formatMoney(cuota.saldo_restante, displayPrestamo.moneda)}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {cuota.pagado ? (
                                    <CheckCircle2 size={14} className="mx-auto text-green-500 dark:text-finza-green" />
                                  ) : isProxima ? (
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" aria-label={t('prestamos.row.cuota')} />
                                  ) : (
                                    <span className="inline-block w-2 h-2 rounded-full bg-[var(--border)]" aria-label={t('prestamos.status.pendiente')} />
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
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
              {t('prestamos.detail.registrarPago')}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(displayPrestamo)}
            >
              <Pencil size={15} className="mr-1" />
              {t('common.edit')}
            </Button>
            {displayPrestamo.estado === 'activo' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelar}
                isLoading={cancelando}
                className="text-[var(--text-muted)]"
              >
                <XCircle size={15} className="mr-1" />
                {t('prestamos.detail.cancelar')}
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(displayPrestamo.id)}
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
