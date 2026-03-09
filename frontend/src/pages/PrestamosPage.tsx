import { useState } from 'react'
import { Plus, HandCoins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PrestamoResumenCards } from '@/features/prestamos/components/PrestamoResumenCards'
import { PrestamoRow } from '@/features/prestamos/components/PrestamoRow'
import { PrestamoModal } from '@/features/prestamos/components/PrestamoModal'
import { PrestamoDetail } from '@/features/prestamos/components/PrestamoDetail'
import {
  usePrestamos,
  useCreatePrestamo,
  useUpdatePrestamo,
  useDeletePrestamo,
} from '@/hooks/usePrestamos'
import type { PrestamoFormData } from '@/features/prestamos/components/PrestamoForm'
import type { Prestamo, TipoPrestamo } from '@/types/prestamo'

type TabActiva = TipoPrestamo

function SkeletonRow(): JSX.Element {
  return (
    <div className="px-4 py-4 border-b border-border animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-2 h-2 rounded-full bg-gray-200 mt-1.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-2 w-full bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="space-y-1 text-right">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ tipo }: { tipo: TipoPrestamo }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <HandCoins size={40} className="text-gray-300 mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-500">
        {tipo === 'me_deben'
          ? 'No hay prestamos donde te deban'
          : 'No hay prestamos donde debas'}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Registra un nuevo prestamo con el boton &ldquo;+ Nuevo&rdquo;
      </p>
    </div>
  )
}

export function PrestamosPage(): JSX.Element {
  const [tabActiva, setTabActiva] = useState<TabActiva>('me_deben')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null)
  const [prestamoEditando, setPrestamoEditando] = useState<Prestamo | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data: prestamos = [], isLoading, isError } = usePrestamos({ tipo: tabActiva })
  const createPrestamo = useCreatePrestamo()
  const updatePrestamo = useUpdatePrestamo()
  const deletePrestamo = useDeletePrestamo()

  // Solo mostrar activos y vencidos en la lista principal — pagados con opacidad
  const prestamosOrdenados = [...prestamos].sort((a, b) => {
    const prioridad = { vencido: 0, activo: 1, pagado: 2 }
    return prioridad[a.estado] - prioridad[b.estado]
  })

  const handleCreate = async (data: PrestamoFormData): Promise<void> => {
    await createPrestamo.mutateAsync({
      ...data,
      fecha_vencimiento: data.fecha_vencimiento || undefined,
      descripcion: data.descripcion || undefined,
      notas: data.notas || undefined,
    })
    setIsModalOpen(false)
  }

  const handleEdit = async (data: PrestamoFormData): Promise<void> => {
    if (!prestamoEditando) return
    await updatePrestamo.mutateAsync({
      id: prestamoEditando.id,
      persona: data.persona,
      monto_original: data.monto_original,
      moneda: data.moneda,
      fecha_prestamo: data.fecha_prestamo,
      fecha_vencimiento: data.fecha_vencimiento || undefined,
      descripcion: data.descripcion || undefined,
      notas: data.notas || undefined,
    })
    setPrestamoEditando(null)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Eliminar este prestamo?')) {
      await deletePrestamo.mutateAsync(id)
      setDetailId(null)
      setPrestamoSeleccionado(null)
    }
  }

  const handleOpenDetail = (prestamo: Prestamo): void => {
    setPrestamoSeleccionado(prestamo)
    setDetailId(prestamo.id)
  }

  const handleOpenEdit = (prestamo: Prestamo): void => {
    setPrestamoEditando(prestamo)
    setDetailId(null)
    setPrestamoSeleccionado(null)
  }

  const handleCloseDetail = (): void => {
    setDetailId(null)
    setPrestamoSeleccionado(null)
  }

  const tabs: { value: TabActiva; label: string }[] = [
    { value: 'me_deben', label: 'Me deben' },
    { value: 'yo_debo', label: 'Yo debo' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prestamos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus prestamos y cobros</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="default">
          <Plus size={18} className="mr-2" />
          Nuevo
        </Button>
      </div>

      {/* KPI cards */}
      <div className="mb-6">
        <PrestamoResumenCards />
      </div>

      {/* Tabs + lista */}
      <Card>
        <CardHeader>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border -mb-4 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={tabActiva === tab.value}
                onClick={() => setTabActiva(tab.value)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                  tabActiva === tab.value
                    ? 'border-finza-blue text-finza-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Error state */}
          {isError && (
            <p className="text-sm text-gray-400 text-center py-4">
              El servidor no esta disponible. La lista se mostrara cuando el backend responda.
            </p>
          )}

          {/* Loading */}
          {isLoading && !isError && (
            <div aria-label="Cargando prestamos">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && prestamosOrdenados.length === 0 && (
            <EmptyState tipo={tabActiva} />
          )}

          {/* Lista */}
          {!isLoading && !isError && prestamosOrdenados.length > 0 && (
            <CardTitle className="sr-only">
              Lista de prestamos — {tabActiva === 'me_deben' ? 'Me deben' : 'Yo debo'}
            </CardTitle>
          )}
          {!isLoading && prestamosOrdenados.map((prestamo) => (
            <PrestamoRow
              key={prestamo.id}
              prestamo={prestamo}
              onClick={handleOpenDetail}
            />
          ))}
        </CardContent>
      </Card>

      {/* Modal crear */}
      <PrestamoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createPrestamo.isPending}
      />

      {/* Modal editar */}
      {prestamoEditando && (
        <PrestamoModal
          isOpen={true}
          onClose={() => setPrestamoEditando(null)}
          onSubmit={handleEdit}
          isLoading={updatePrestamo.isPending}
          prestamo={prestamoEditando}
        />
      )}

      {/* Panel de detalle */}
      {detailId && (
        <PrestamoDetail
          prestamoId={detailId}
          prestamoCache={prestamoSeleccionado ?? undefined}
          onClose={handleCloseDetail}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
