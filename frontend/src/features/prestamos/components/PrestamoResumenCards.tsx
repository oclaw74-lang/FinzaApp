import { formatMoney } from '@/lib/utils'
import { usePrestamoResumen } from '@/hooks/usePrestamos'

function SkeletonKpi(): JSX.Element {
  return (
    <div className="card-glass rounded-[20px] p-5 animate-pulse" aria-hidden="true">
      <div className="h-3 w-20 bg-white/10 rounded mb-3" />
      <div className="h-7 w-28 bg-white/10 rounded mb-2" />
      <div className="h-3 w-16 bg-white/10 rounded" />
    </div>
  )
}

export function PrestamoResumenCards(): JSX.Element {
  const { data, isLoading, isError } = usePrestamoResumen()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Cargando resumen de prestamos">
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
      </div>
    )
  }

  const resumen = data ?? {
    total_me_deben: 0,
    total_yo_debo: 0,
    cantidad_activos: 0,
    cantidad_vencidos: 0,
  }

  const totalDeuda = resumen.total_me_deben + resumen.total_yo_debo

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {isError && (
        <p className="col-span-3 text-xs text-[#657a9e] text-center py-2">
          No se pudo cargar el resumen. Los datos se actualizaran cuando el servidor este disponible.
        </p>
      )}

      {/* Deuda total */}
      <div className="card-glass rounded-[20px] p-5">
        <p className="text-[11px] uppercase tracking-widest text-[#657a9e] mb-1">Deuda total</p>
        <p
          className="text-[26px] font-bold tabular-nums tracking-tight text-[#ff4060] leading-none"
          style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}
          aria-label={`Deuda total ${formatMoney(totalDeuda)}`}
        >
          {formatMoney(totalDeuda)}
        </p>
        <p className="text-xs text-[#657a9e] mt-1">
          {resumen.cantidad_activos} credito{resumen.cantidad_activos !== 1 ? 's' : ''} activo{resumen.cantidad_activos !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Me deben */}
      <div className="card-glass rounded-[20px] p-5">
        <p className="text-[11px] uppercase tracking-widest text-[#657a9e] mb-1">Me deben</p>
        <p
          className="text-[26px] font-bold tabular-nums tracking-tight text-[#00dfa2] leading-none"
          style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}
          aria-label={`Me deben ${formatMoney(resumen.total_me_deben)}`}
        >
          {formatMoney(resumen.total_me_deben)}
        </p>
        <p className="text-xs text-[#657a9e] mt-1">Por cobrar</p>
      </div>

      {/* Yo debo */}
      <div className="card-glass rounded-[20px] p-5">
        <p className="text-[11px] uppercase tracking-widest text-[#657a9e] mb-1">Yo debo</p>
        <p
          className="text-[26px] font-bold tabular-nums tracking-tight text-[#ffb340] leading-none"
          style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}
          aria-label={`Yo debo ${formatMoney(resumen.total_yo_debo)}`}
        >
          {formatMoney(resumen.total_yo_debo)}
        </p>
        <p className="text-xs text-[#657a9e] mt-1">
          {resumen.cantidad_vencidos > 0
            ? <span className="text-[#ff4060]">{resumen.cantidad_vencidos} vencido{resumen.cantidad_vencidos !== 1 ? 's' : ''}</span>
            : 'Al corriente'}
        </p>
      </div>
    </div>
  )
}
