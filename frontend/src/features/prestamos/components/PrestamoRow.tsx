import { formatMoney, formatDate, cn } from '@/lib/utils'
import type { Prestamo, EstadoPrestamo } from '@/types/prestamo'

function calcularDiasHastaVencimiento(fecha: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaObj = new Date(fecha)
  fechaObj.setHours(0, 0, 0, 0)
  return Math.round((fechaObj.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function EstadoBadge({ estado, diasVencimiento }: { estado: EstadoPrestamo; diasVencimiento?: number }): JSX.Element {
  if (estado === 'pagado') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(0,223,162,0.12)] text-[#00dfa2]">
        Pagado
      </span>
    )
  }

  if (estado === 'vencido') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(255,64,96,0.12)] text-[#ff4060]">
        Vencido
      </span>
    )
  }

  // activo
  if (diasVencimiento !== undefined && diasVencimiento <= 7) {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(255,179,64,0.12)] text-[#ffb340]">
        Pagar pronto
      </span>
    )
  }

  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(0,223,162,0.12)] text-[#00dfa2]">
      Al corriente
    </span>
  )
}

interface PrestamoRowProps {
  prestamo: Prestamo
  onClick: (prestamo: Prestamo) => void
}

export function PrestamoRow({ prestamo, onClick }: PrestamoRowProps): JSX.Element {
  const monto_original = Number(prestamo.monto_original ?? 0)
  const monto_pendiente = Number(prestamo.monto_pendiente ?? 0)
  const montoPagado = monto_original - monto_pendiente

  const porcentajePagado =
    monto_original > 0
      ? Math.min(100, Math.round((montoPagado / monto_original) * 100))
      : 0

  const diasVencimiento =
    prestamo.fecha_vencimiento ? calcularDiasHastaVencimiento(prestamo.fecha_vencimiento) : undefined

  const isTipoDeben = prestamo.tipo === 'me_deben'

  // Icon background color based on tipo
  const iconBgColor = isTipoDeben ? 'rgba(0,223,162,0.10)' : 'rgba(255,64,96,0.10)'
  const iconTextColor = isTipoDeben ? '#00dfa2' : '#ff4060'

  // Initials for icon
  const initials = prestamo.persona
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <button
      type="button"
      className={cn(
        'w-full text-left transition-opacity',
        prestamo.estado === 'pagado' && 'opacity-60'
      )}
      onClick={() => onClick(prestamo)}
      aria-label={`Ver detalle de prestamo con ${prestamo.persona}`}
    >
      <div
        className="flex items-center gap-4 px-5 py-[18px] rounded-[20px] mb-3"
        style={{
          background: 'rgba(8,15,30,0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: iconBgColor, color: iconTextColor }}
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Info central */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#e8f0ff]">{prestamo.persona}</p>
            {prestamo.descripcion && (
              <span className="text-xs text-[#657a9e] truncate max-w-[160px]">{prestamo.descripcion}</span>
            )}
          </div>

          {/* Progress bar */}
          <div
            className="h-1.5 rounded-full overflow-hidden my-2"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            role="progressbar"
            aria-valuenow={porcentajePagado}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${porcentajePagado}% pagado`}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${porcentajePagado}%`,
                background: 'linear-gradient(90deg, #3d8ef8, #9768ff)',
              }}
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[#657a9e]">
            <span>Pagado: {formatMoney(montoPagado, prestamo.moneda)}</span>
            <span>Pendiente: {formatMoney(monto_pendiente, prestamo.moneda)}</span>
          </div>
        </div>

        {/* Derecha: cuota, fecha, badge */}
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
          {prestamo.cuota_mensual != null && (
            <>
              <p className="text-[10px] uppercase tracking-widest text-[#657a9e]">Cuota</p>
              <p className="text-sm font-bold tabular-nums text-[#e8f0ff]">
                {formatMoney(prestamo.cuota_mensual, prestamo.moneda)}
              </p>
            </>
          )}
          {prestamo.fecha_vencimiento && (
            <p className="text-xs text-[#657a9e]">
              Vence: {formatDate(prestamo.fecha_vencimiento)}
            </p>
          )}
          <EstadoBadge estado={prestamo.estado} diasVencimiento={diasVencimiento} />
        </div>
      </div>
    </button>
  )
}
