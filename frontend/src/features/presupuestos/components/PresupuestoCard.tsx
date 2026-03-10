import { AlertTriangle } from 'lucide-react'
import { BudgetProgressBar } from './BudgetProgressBar'
import { formatMoney } from '@/lib/utils'
import type { PresupuestoEstado } from '@/types/presupuesto'

interface PresupuestoCardProps {
  estado: PresupuestoEstado
  onClick: (estado: PresupuestoEstado) => void
}

export function PresupuestoCard({
  estado,
  onClick,
}: PresupuestoCardProps): JSX.Element {
  const excedido = estado.porcentaje_usado >= 100

  return (
    <button
      type="button"
      onClick={() => onClick(estado)}
      className="finza-card text-left w-full transition-all hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-finza-blue"
      aria-label={`Editar presupuesto de ${estado.categoria_nombre}`}
    >
      {/* Header: nombre + badges de alerta */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
          {estado.categoria_nombre}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {excedido ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-alert-red whitespace-nowrap">
              Excedido
            </span>
          ) : estado.alerta ? (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-golden-flow whitespace-nowrap">
              <AlertTriangle size={11} aria-hidden="true" />
              Alerta
            </span>
          ) : null}
        </div>
      </div>

      {/* Montos */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-xs text-[var(--text-muted)]">Gastado</p>
          <p
            className={`text-lg font-bold font-mono ${
              excedido
                ? 'text-alert-red'
                : estado.alerta
                  ? 'text-golden-flow'
                  : 'text-[var(--text-primary)]'
            }`}
          >
            {formatMoney(estado.gasto_actual)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-muted)]">Limite</p>
          <p className="text-sm font-semibold text-[var(--text-muted)]">
            {formatMoney(estado.monto_limite)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <BudgetProgressBar
        porcentaje={estado.porcentaje_usado}
        aria-label={`${Math.round(estado.porcentaje_usado)}% del presupuesto de ${estado.categoria_nombre} usado`}
      />
      <p className="text-xs text-[var(--text-muted)] mt-1">
        {Math.round(estado.porcentaje_usado)}% usado
      </p>
    </button>
  )
}
