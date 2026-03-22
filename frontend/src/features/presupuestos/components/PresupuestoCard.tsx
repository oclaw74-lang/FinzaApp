import { Tag } from 'lucide-react'
import { BudgetProgressBar } from './BudgetProgressBar'
import { formatMoney } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PresupuestoEstado } from '@/types/presupuesto'

interface PresupuestoCardProps {
  estado: PresupuestoEstado
  onClick: (estado: PresupuestoEstado) => void
}

function getPctColorClass(porcentaje: number): string {
  if (porcentaje >= 90) return 'text-red-400'
  if (porcentaje >= 60) return 'text-yellow-400'
  return 'text-emerald-400'
}

export function PresupuestoCard({
  estado,
  onClick,
}: PresupuestoCardProps): JSX.Element {
  const excedido = estado.porcentaje_usado >= 100
  const pctColor = getPctColorClass(estado.porcentaje_usado)

  return (
    <button
      type="button"
      onClick={() => onClick(estado)}
      className={cn(
        'card-glass rounded-2xl p-5 text-left w-full transition-all',
        'hover:bg-white/[0.06] dark:hover:bg-white/[0.04]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finza-blue/50'
      )}
      aria-label={`Editar presupuesto de ${estado.categoria_nombre}`}
    >
      {/* Header: icono + nombre + pct badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center flex-shrink-0">
            <Tag size={18} className="text-white/60" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {estado.categoria_nombre}
            </p>
            <p className={cn('text-xs mt-0.5', pctColor)}>
              {Math.round(estado.porcentaje_usado)}% utilizado
            </p>
          </div>
        </div>
        {excedido && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 whitespace-nowrap flex-shrink-0">
            Excedido
          </span>
        )}
        {!excedido && estado.alerta && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 whitespace-nowrap flex-shrink-0">
            Alerta
          </span>
        )}
      </div>

      {/* Progress bar */}
      <BudgetProgressBar
        porcentaje={estado.porcentaje_usado}
        aria-label={`${Math.round(estado.porcentaje_usado)}% del presupuesto de ${estado.categoria_nombre} usado`}
      />

      {/* Montos */}
      <div className="flex items-center justify-between mt-2">
        <p className={cn('text-xs tabular-nums font-medium', pctColor)}>
          {formatMoney(estado.gasto_actual, estado.moneda)}
        </p>
        <p className="text-xs text-white/30 tabular-nums">
          de {formatMoney(estado.monto_limite, estado.moneda)}
        </p>
      </div>
    </button>
  )
}
