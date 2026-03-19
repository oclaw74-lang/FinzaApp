import { TransaccionRow } from './TransaccionRow'
import type { IngresoResponse, EgresoResponse, CategoriaResponse } from '@/types/transacciones'

type Transaccion = IngresoResponse | EgresoResponse

interface TransaccionesListProps {
  transacciones: Transaccion[]
  tipo: 'ingreso' | 'egreso'
  categorias: CategoriaResponse[]
  isLoading: boolean
  onEdit: (t: Transaccion) => void
  onDelete: (id: string) => void
}

export function TransaccionesList({
  transacciones,
  tipo,
  categorias,
  isLoading,
  onEdit,
  onDelete,
}: TransaccionesListProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" aria-label="Cargando transacciones">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-flow-light rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (transacciones.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">
          No hay {tipo === 'ingreso' ? 'ingresos' : 'egresos'} registrados.
        </p>
      </div>
    )
  }

  const categoriasMap = Object.fromEntries(categorias.map((c) => [c.id, c.nombre]))

  return (
    <div>
      {transacciones.map((t) => (
        <TransaccionRow
          key={t.id}
          transaccion={t}
          tipo={tipo}
          categoriaNombre={categoriasMap[t.categoria_id] ?? 'Sin categoria'}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
