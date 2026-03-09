import { formatMoney } from '@/lib/utils'
import { useMetasResumen } from '@/hooks/useMetas'

function SkeletonCard(): JSX.Element {
  return (
    <div className="finza-card animate-pulse" aria-hidden="true">
      <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-200 rounded" />
    </div>
  )
}

export function MetasResumenCards(): JSX.Element {
  const { data, isLoading, isError } = useMetasResumen()

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        aria-label="Cargando resumen de metas"
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const resumen = data ?? {
    total_ahorrado: 0,
    metas_activas: 0,
    metas_completadas: 0,
    porcentaje_promedio_cumplimiento: 0,
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {isError && (
        <p className="col-span-3 text-xs text-gray-400 text-center">
          No se pudo cargar el resumen. Los datos se actualizaran cuando el
          servidor este disponible.
        </p>
      )}

      {/* Total ahorrado */}
      <div className="finza-card border-l-4 border-prosperity-green">
        <p className="text-sm font-medium text-gray-500 mb-1">
          Total ahorrado
        </p>
        <p
          className="text-2xl font-bold money"
          style={{ color: '#00B050' }}
          aria-label={`Total ahorrado ${formatMoney(resumen.total_ahorrado)}`}
        >
          {formatMoney(resumen.total_ahorrado)}
        </p>
        <p className="text-xs text-gray-400 mt-1">En metas activas</p>
      </div>

      {/* Metas activas */}
      <div className="finza-card border-l-4 border-finza-blue">
        <p className="text-sm font-medium text-gray-500 mb-1">Metas activas</p>
        <p
          className="text-2xl font-bold"
          style={{ color: '#366092' }}
          aria-label={`${resumen.metas_activas} metas activas`}
        >
          {resumen.metas_activas}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {resumen.metas_completadas} completada
          {resumen.metas_completadas !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Cumplimiento promedio */}
      <div className="finza-card border-l-4 border-golden-flow">
        <p className="text-sm font-medium text-gray-500 mb-1">
          Cumplimiento promedio
        </p>
        <p
          className="text-2xl font-bold"
          style={{ color: '#FFC000' }}
          aria-label={`${Math.round(resumen.porcentaje_promedio_cumplimiento)}% cumplimiento promedio`}
        >
          {Math.round(resumen.porcentaje_promedio_cumplimiento)}%
        </p>
        <p className="text-xs text-gray-400 mt-1">Sobre todas las metas</p>
      </div>
    </div>
  )
}
