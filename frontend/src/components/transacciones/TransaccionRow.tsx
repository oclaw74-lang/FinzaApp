import { Pencil, Trash2 } from 'lucide-react'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { formatDate } from '@/lib/utils'
import type { IngresoResponse, EgresoResponse } from '@/types/transacciones'

type Transaccion = IngresoResponse | EgresoResponse

interface TransaccionRowProps {
  transaccion: Transaccion
  tipo: 'ingreso' | 'egreso'
  categoriaNombre: string
  onEdit: (t: Transaccion) => void
  onDelete: (id: string) => void
}

export function TransaccionRow({
  transaccion,
  tipo,
  categoriaNombre,
  onEdit,
  onDelete,
}: TransaccionRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            tipo === 'ingreso' ? 'bg-prosperity-green' : 'bg-alert-red'
          }`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {transaccion.descripcion ?? categoriaNombre}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {categoriaNombre} &middot; {formatDate(transaccion.fecha)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <MoneyDisplay
          amount={parseFloat(transaccion.monto)}
          currency={transaccion.moneda}
          type={tipo}
          size="sm"
        />
        <button
          onClick={() => onEdit(transaccion)}
          className="text-gray-400 hover:text-finza-blue transition-colors"
          aria-label="Editar"
          type="button"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onDelete(transaccion.id)}
          className="text-gray-400 hover:text-alert-red transition-colors"
          aria-label="Eliminar"
          type="button"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
