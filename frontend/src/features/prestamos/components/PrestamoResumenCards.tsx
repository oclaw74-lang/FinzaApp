import { formatMoney } from '@/lib/utils'
import { usePrestamoResumen } from '@/hooks/usePrestamos'
import { Skeleton } from '@/components/ui/skeleton'

function SkeletonCard(): JSX.Element {
  return (
    <div className="rounded-2xl p-6 animate-pulse bg-[var(--surface-raised)]" aria-hidden="true">
      <div className="h-4 w-24 bg-white/20 rounded mb-3" />
      <div className="h-8 w-32 bg-white/20 rounded mb-2" />
      <div className="h-3 w-20 bg-white/20 rounded" />
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
        <p className="col-span-2 text-xs text-[var(--text-muted)] text-center">
          No se pudo cargar el resumen. Los datos se actualizaran cuando el servidor este disponible.
        </p>
      )}

      {/* Me deben */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
      >
        <div
          className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"
          aria-hidden="true"
        />
        <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Me deben</p>
        <p
          className="text-3xl font-bold mt-1"
          aria-label={`Me deben ${formatMoney(resumen.total_me_deben)}`}
        >
          {formatMoney(resumen.total_me_deben)}
        </p>
        <p className="text-white/50 text-xs mt-1">
          {resumen.cantidad_activos} activo{resumen.cantidad_activos !== 1 ? 's' : ''}
          {resumen.cantidad_vencidos > 0 && (
            <span className="text-yellow-300 ml-2">
              {resumen.cantidad_vencidos} vencido{resumen.cantidad_vencidos !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Yo debo */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #dc2626, #e11d48)' }}
      >
        <div
          className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"
          aria-hidden="true"
        />
        <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Yo debo</p>
        <p
          className="text-3xl font-bold mt-1"
          aria-label={`Yo debo ${formatMoney(resumen.total_yo_debo)}`}
        >
          {formatMoney(resumen.total_yo_debo)}
        </p>
        <p className="text-white/50 text-xs mt-1">Total pendiente</p>
      </div>
    </div>
  )
}
