import { formatMoney } from '@/lib/utils'
import { usePrestamoResumen } from '@/hooks/usePrestamos'

function SkeletonCard(): JSX.Element {
  return (
    <div className="finza-card animate-pulse" aria-hidden="true">
      <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-200 rounded" />
    </div>
  )
}

export function PrestamoResumenCards(): JSX.Element {
  const { data, isLoading, isError } = usePrestamoResumen()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Cargando resumen de prestamos">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const resumen = data ?? {
    total_me_deben: 0,
    total_yo_debo: 0,
    cantidad_activos: 0,
    cantidad_vencidos: 0,
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {isError && (
        <p className="col-span-2 text-xs text-gray-400 text-center">
          No se pudo cargar el resumen. Los datos se actualizaran cuando el servidor este disponible.
        </p>
      )}

      {/* Me deben */}
      <div className="finza-card border-l-4 border-prosperity-green">
        <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Me deben</p>
        <p
          className="text-2xl font-bold font-mono text-prosperity-green"
          aria-label={`Me deben ${formatMoney(resumen.total_me_deben)}`}
        >
          {formatMoney(resumen.total_me_deben)}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {resumen.cantidad_activos} activo{resumen.cantidad_activos !== 1 ? 's' : ''}
          {resumen.cantidad_vencidos > 0 && (
            <span className="text-alert-red ml-2">
              {resumen.cantidad_vencidos} vencido{resumen.cantidad_vencidos !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Yo debo */}
      <div className="finza-card border-l-4 border-alert-red">
        <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Yo debo</p>
        <p
          className="text-2xl font-bold font-mono text-alert-red"
          aria-label={`Yo debo ${formatMoney(resumen.total_yo_debo)}`}
        >
          {formatMoney(resumen.total_yo_debo)}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Total pendiente
        </p>
      </div>
    </div>
  )
}
