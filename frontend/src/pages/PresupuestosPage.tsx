import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { PresupuestoCard } from '@/features/presupuestos/components/PresupuestoCard'
import { PresupuestoModal } from '@/features/presupuestos/components/PresupuestoModal'
import type { PresupuestoFormData } from '@/features/presupuestos/components/PresupuestoForm'
import {
  usePresupuestosEstado,
  useCreatePresupuesto,
  useUpdatePresupuesto,
  useDeletePresupuesto,
} from '@/hooks/usePresupuestos'
import { useCategorias } from '@/hooks/useCategorias'
import type { PresupuestoEstado } from '@/types/presupuesto'

// ─── Helpers ────────────────────────────────────────────────────────────────

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function getDefaultMesYear(): { mes: number; year: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, year: now.getFullYear() }
}

function getYearOptions(currentYear: number): number[] {
  return [currentYear - 1, currentYear, currentYear + 1]
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SkeletonCard(): JSX.Element {
  return (
    <div className="finza-card animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="flex justify-between mb-2">
        <div className="h-6 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
      <div className="h-2.5 w-full bg-gray-200 rounded-full" />
      <div className="h-3 w-12 bg-gray-200 rounded mt-1" />
    </div>
  )
}

function EmptyState(): JSX.Element {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
      <Target size={48} className="text-gray-300 mb-4" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-500">
        No hay presupuestos asignados para este mes
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Crea tu primer presupuesto con el boton &ldquo;+ Nuevo&rdquo;
      </p>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function PresupuestosPage(): JSX.Element {
  const defaults = getDefaultMesYear()
  const [mes, setMes] = useState<number>(defaults.mes)
  const [year, setYear] = useState<number>(defaults.year)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEstado, setEditingEstado] = useState<PresupuestoEstado | null>(null)
  const [preselectedCategoriaId, setPreselectedCategoriaId] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: estadoList = [], isLoading, isError } = usePresupuestosEstado(mes, year)
  const { data: todasCategorias = [] } = useCategorias()

  const createPresupuesto = useCreatePresupuesto(mes, year)
  const updatePresupuesto = useUpdatePresupuesto(mes, year)
  const deletePresupuesto = useDeletePresupuesto(mes, year)

  const categoriasConPresupuestoIds = new Set(estadoList.map((e) => e.categoria_id))

  const categoriasSinPresupuesto = todasCategorias.filter(
    (cat) =>
      (cat.tipo === 'egreso' || cat.tipo === 'ambos') &&
      !categoriasConPresupuestoIds.has(cat.id)
  )

  const handleOpenCreate = (): void => {
    setPreselectedCategoriaId(undefined)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenAsignar = (categoriaId: string): void => {
    setPreselectedCategoriaId(categoriaId)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (estado: PresupuestoEstado): void => {
    setEditingEstado(estado)
    setFormError(null)
  }

  const handleCloseModal = (): void => {
    setIsModalOpen(false)
    setPreselectedCategoriaId(undefined)
    setFormError(null)
  }

  const handleCloseEdit = (): void => {
    setEditingEstado(null)
    setFormError(null)
  }

  const handleCreate = async (data: PresupuestoFormData): Promise<void> => {
    setFormError(null)
    try {
      await createPresupuesto.mutateAsync({
        categoria_id: data.categoria_id,
        mes,
        year,
        monto_limite: data.monto_limite,
      })
      handleCloseModal()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setFormError('Ya existe un presupuesto para esta categoria en este mes')
      } else {
        setFormError('Error al crear el presupuesto. Intenta de nuevo.')
      }
    }
  }

  const handleUpdate = async (data: PresupuestoFormData): Promise<void> => {
    if (!editingEstado) return
    setFormError(null)
    try {
      await updatePresupuesto.mutateAsync({
        id: editingEstado.id,
        monto_limite: data.monto_limite,
      })
      handleCloseEdit()
    } catch (_error) {
      setFormError('Error al actualizar el presupuesto. Intenta de nuevo.')
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!editingEstado) return
    if (window.confirm('Eliminar este presupuesto?')) {
      await deletePresupuesto.mutateAsync(editingEstado.id)
      handleCloseEdit()
    }
  }

  const currentYear = defaults.year
  const yearOptions = getYearOptions(currentYear)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Controla tus limites de gasto por categoria
          </p>
        </div>
        <Button onClick={handleOpenCreate} variant="default">
          <Plus size={18} className="mr-2" />
          Nuevo
        </Button>
      </div>

      {/* Selector de mes / año */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="mes-selector"
            className="text-xs text-gray-500 font-medium"
          >
            Mes
          </label>
          <select
            id="mes-selector"
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="finza-input py-1.5 pr-8 text-sm"
          >
            {MESES.map((nombre, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="year-selector"
            className="text-xs text-gray-500 font-medium"
          >
            Año
          </label>
          <select
            id="year-selector"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="finza-input py-1.5 pr-8 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <p className="text-sm text-gray-400 text-center py-4 mb-4">
          El servidor no esta disponible. Los presupuestos se mostraran cuando
          el backend responda.
        </p>
      )}

      {/* Seccion: Con presupuesto */}
      {!isError && (
        <>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Con presupuesto asignado
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {isLoading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}
            {!isLoading && estadoList.length === 0 && <EmptyState />}
            {!isLoading &&
              estadoList.map((estado) => (
                <PresupuestoCard
                  key={estado.id}
                  estado={estado}
                  onClick={handleOpenEdit}
                />
              ))}
          </div>

          {/* Seccion: Sin presupuesto */}
          {!isLoading && categoriasSinPresupuesto.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Sin presupuesto
              </h2>
              <div className="finza-card p-0 overflow-hidden">
                {categoriasSinPresupuesto.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className={`flex items-center justify-between px-4 py-3 ${
                      idx < categoriasSinPresupuesto.length - 1
                        ? 'border-b border-border'
                        : ''
                    }`}
                  >
                    <span className="text-sm text-gray-700">
                      {cat.icono ? `${cat.icono} ` : ''}
                      {cat.nombre}
                    </span>
                    <Button
                      variant="secondary"
                      onClick={() => handleOpenAsignar(cat.id)}
                      className="text-xs py-1 px-3 h-auto"
                    >
                      <Plus size={13} className="mr-1" />
                      Asignar limite
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Modal crear */}
      <PresupuestoModal
        isOpen={isModalOpen}
        mes={mes}
        year={year}
        categoriaIdInicial={preselectedCategoriaId}
        errorMessage={formError}
        onClose={handleCloseModal}
        onSubmit={handleCreate}
        isLoading={createPresupuesto.isPending}
      />

      {/* Modal editar */}
      {editingEstado && (
        <PresupuestoModal
          isOpen={true}
          mes={mes}
          year={year}
          categoriaIdInicial={editingEstado.categoria_id}
          montoLimiteInicial={editingEstado.monto_limite}
          isEditing={true}
          errorMessage={formError}
          onClose={handleCloseEdit}
          onSubmit={handleUpdate}
          onDelete={handleDelete}
          isLoading={updatePresupuesto.isPending}
        />
      )}
    </div>
  )
}
