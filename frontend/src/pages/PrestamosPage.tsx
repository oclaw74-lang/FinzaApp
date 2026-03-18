import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, HandCoins } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { PrestamoResumenCards } from '@/features/prestamos/components/PrestamoResumenCards'
import { PrestamoRow } from '@/features/prestamos/components/PrestamoRow'
import { PrestamoModal } from '@/features/prestamos/components/PrestamoModal'
import { PrestamoDetail } from '@/features/prestamos/components/PrestamoDetail'
import { ComparativaCard } from '@/components/dashboard/ComparativaCard'
import {
  usePrestamos,
  useCreatePrestamo,
  useUpdatePrestamo,
  useDeletePrestamo,
} from '@/hooks/usePrestamos'
import type { PrestamoFormData } from '@/features/prestamos/components/PrestamoForm'
import type { Prestamo } from '@/types/prestamo'

function SkeletonRow(): JSX.Element {
  return (
    <div className="px-4 py-4 border-b border-border animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Skeleton className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

function EmptyState(): JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <HandCoins size={40} className="text-[var(--text-muted)] opacity-40 mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-[var(--text-primary)]">No hay prestamos registrados</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">
        {t('prestamos.noPrestamosDesc')}
      </p>
    </div>
  )
}

export function PrestamosPage(): JSX.Element {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null)
  const [prestamoEditando, setPrestamoEditando] = useState<Prestamo | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data: prestamos = [], isLoading, isError } = usePrestamos()
  const createPrestamo = useCreatePrestamo()
  const updatePrestamo = useUpdatePrestamo()
  const deletePrestamo = useDeletePrestamo()

  const prestamosOrdenados = [...prestamos].sort((a, b) => {
    const prioridad = { vencido: 0, activo: 1, pagado: 2 }
    return prioridad[a.estado] - prioridad[b.estado]
  })

  const handleCreate = async (data: PrestamoFormData): Promise<void> => {
    try {
      await createPrestamo.mutateAsync({
        ...data,
        fecha_vencimiento: data.fecha_vencimiento || undefined,
        descripcion: data.descripcion || undefined,
        notas: data.notas || undefined,
        tasa_interes: data.tasa_interes ?? null,
        plazo_meses: data.plazo_meses ?? null,
      })
      setIsModalOpen(false)
      toast.success(t('prestamos.created'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleEdit = async (data: PrestamoFormData): Promise<void> => {
    if (!prestamoEditando) return
    try {
      await updatePrestamo.mutateAsync({
        id: prestamoEditando.id,
        persona: data.persona,
        monto_original: data.monto_original,
        moneda: data.moneda,
        fecha_prestamo: data.fecha_prestamo,
        fecha_vencimiento: data.fecha_vencimiento || undefined,
        descripcion: data.descripcion || undefined,
        notas: data.notas || undefined,
        tasa_interes: data.tasa_interes ?? null,
        plazo_meses: data.plazo_meses ?? null,
      })
      setPrestamoEditando(null)
      toast.success(t('prestamos.updated'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Eliminar este prestamo?')) {
      try {
        await deletePrestamo.mutateAsync(id)
        setDetailId(null)
        setPrestamoSeleccionado(null)
        toast.success(t('prestamos.deleted'))
      } catch {
        toast.error(t('common.error'))
      }
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

  return (
    <div className="animate-fade-in p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title-premium dark:text-[#e8f0ff]">{t('nav.prestamos')}</h1>
          <p className="text-sm dark:text-finza-t2 mt-1">Gestiona tus prestamos y cobros</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="default" size="md"
          className="dark:bg-finza-blue dark:hover:bg-finza-blue/80">
          <Plus size={16} />
          {t('common.new')}
        </Button>
      </div>

      {/* KPI cards */}
      <div className="mb-6">
        <PrestamoResumenCards />
      </div>

      {/* Lista unificada */}
      <div>
        {/* Error state */}
        {isError && (
          <p className="text-sm text-[#657a9e] text-center py-4">
            El servidor no esta disponible. La lista se mostrara cuando el backend responda.
          </p>
        )}

        {/* Loading */}
        {isLoading && !isError && (
          <div aria-label="Cargando prestamos" className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && prestamosOrdenados.length === 0 && (
          <EmptyState />
        )}

        {/* Items con badge de tipo */}
        {!isLoading && prestamosOrdenados.map((prestamo) => (
          <div key={prestamo.id} className="relative">
            <span
              className={cn(
                'absolute top-3 right-3 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                prestamo.tipo === 'me_deben'
                  ? 'bg-[rgba(0,223,162,0.15)] text-[#00dfa2]'
                  : 'bg-[rgba(255,64,96,0.15)] text-[#ff4060]'
              )}
            >
              {prestamo.tipo === 'me_deben' ? 'Me deben' : 'Yo debo'}
            </span>
            <PrestamoRow
              prestamo={prestamo}
              onClick={handleOpenDetail}
            />
          </div>
        ))}
      </div>

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

      {/* Comparativa deuda vs ahorro */}
      <div className="mt-6 dark:bg-[rgba(8,15,30,0.6)] dark:backdrop-blur-xl dark:border-white/[0.06] rounded-2xl">
        <ComparativaCard />
      </div>
    </div>
  )
}
