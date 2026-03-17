import { AlertCircle, Clock } from 'lucide-react'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import type { Prestamo, EstadoPrestamo } from '@/types/prestamo'

function calcularDiasHastaProximoPago(proximoPago: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  // Parse date parts directly to avoid UTC offset issues with ISO date strings
  const [year, month, day] = proximoPago.split('-').map(Number)
  const fechaPago = new Date(year, month - 1, day, 0, 0, 0, 0)
  return Math.round((fechaPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function ProximoPagoBadge({ proximoPago }: { proximoPago: string }): JSX.Element {
  const dias = calcularDiasHastaProximoPago(proximoPago)

  if (dias <= 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFEBEB] text-alert-red"
        role="status"
        aria-label="Pago hoy"
      >
        <AlertCircle size={11} aria-hidden="true" />
        ¡Pago hoy!
      </span>
    )
  }

  if (dias <= 3) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFF9E6] text-[#B8860B]"
        role="status"
        aria-label={`Pago en ${dias} dias`}
      >
        <Clock size={11} aria-hidden="true" />
        Pago en {dias} {dias === 1 ? 'dia' : 'dias'}
      </span>
    )
  }

  if (dias <= 7) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFF3E0] text-[#E65100]"
        role="status"
        aria-label={`Pago en ${dias} dias`}
      >
        <Clock size={11} aria-hidden="true" />
        Pago en {dias} dias
      </span>
    )
  }

  return (
    <span className="text-xs text-[var(--text-muted)]">
      Prox. pago: {formatDate(proximoPago)}
    </span>
  )
}

interface PrestamoRowProps {
  prestamo: Prestamo
  onClick: (prestamo: Prestamo) => void
}

function EstadoBadge({ estado }: { estado: EstadoPrestamo }): JSX.Element {
  const styles: Record<EstadoPrestamo, string> = {
    activo: 'bg-[#EBF3FB] text-finza-blue',
    pagado: 'bg-[#E6F5ED] text-prosperity-green',
    vencido: 'bg-[#FFEBEB] text-alert-red',
  }
  const labels: Record<EstadoPrestamo, string> = {
    activo: 'Activo',
    pagado: 'Pagado',
    vencido: 'Vencido',
  }

  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', styles[estado])}
      aria-label={`Estado: ${labels[estado]}`}
    >
      {labels[estado]}
    </span>
  )
}

export function PrestamoRow({ prestamo, onClick }: PrestamoRowProps): JSX.Element {
  const monto_original = Number(prestamo.monto_original ?? 0)
  const monto_pendiente = Number(prestamo.monto_pendiente ?? 0)

  const porcentajePagado =
    monto_original > 0
      ? Math.min(
          100,
          Math.round(
            ((monto_original - monto_pendiente) / monto_original) * 100
          )
        )
      : 0

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vencimientoVencido =
    prestamo.fecha_vencimiento !== undefined &&
    prestamo.fecha_vencimiento !== null &&
    new Date(prestamo.fecha_vencimiento) < hoy &&
    prestamo.estado === 'activo'

  const isTipoDeben = prestamo.tipo === 'me_deben'

  return (
    <button
      type="button"
      className={cn(
        'w-full text-left px-4 py-4 border-b border-border last:border-0',
        'hover:bg-flow-light/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finza-blue',
        prestamo.estado === 'pagado' && 'opacity-60'
      )}
      onClick={() => onClick(prestamo)}
      aria-label={`Ver detalle de prestamo con ${prestamo.persona}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Indicador tipo + info principal */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
            style={{ backgroundColor: isTipoDeben ? '#00B050' : '#FF0000' }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{prestamo.persona}</p>
              <EstadoBadge estado={prestamo.estado} />
            </div>
            {prestamo.descripcion && (
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{prestamo.descripcion}</p>
            )}
            <div className="mt-2 space-y-1">
              {/* Progress bar */}
              <div
                className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden"
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
              <p className="text-xs text-[var(--text-muted)]">{porcentajePagado}% pagado</p>
            </div>

            {/* Intereses y proximo pago — solo en prestamos activos */}
            {prestamo.estado === 'activo' && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {prestamo.cuota_mensual != null && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#EBF3FB] text-finza-blue">
                    Cuota: {formatMoney(prestamo.cuota_mensual, prestamo.moneda)}/mes
                  </span>
                )}
                {prestamo.proximo_pago != null && (
                  <ProximoPagoBadge proximoPago={prestamo.proximo_pago} />
                )}
              </div>
            )}
            {prestamo.estado === 'activo' && prestamo.total_intereses != null && prestamo.total_intereses > 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Intereses totales: {formatMoney(prestamo.total_intereses, prestamo.moneda)}
              </p>
            )}
          </div>
        </div>

        {/* Montos + fechas */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {formatMoney(monto_pendiente, prestamo.moneda)}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            de {formatMoney(monto_original, prestamo.moneda)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {formatDate(prestamo.fecha_prestamo)}
          </p>
          {prestamo.fecha_vencimiento && (
            <p
              className={cn(
                'text-xs mt-0.5',
                vencimientoVencido ? 'text-alert-red font-medium' : 'text-gray-400'
              )}
            >
              Vence: {formatDate(prestamo.fecha_vencimiento)}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
