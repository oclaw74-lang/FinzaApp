import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetasResumenCards } from '@/features/metas/components/MetasResumenCards'
import { MetaCard } from '@/features/metas/components/MetaCard'
import { MetaModal } from '@/features/metas/components/MetaModal'
import { MetaDetail } from '@/features/metas/components/MetaDetail'
import type { MetaFormData } from '@/features/metas/components/MetaForm'
import { useMetas, useCreateMeta, useUpdateMeta, useDeleteMeta } from '@/hooks/useMetas'
import type { MetaAhorro } from '@/types/meta_ahorro'

function SkeletonCard(): JSX.Element {
  return (
    <div className="finza-card animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="flex justify-between mb-2">
        <div className="h-6 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full" />
      <div className="h-3 w-16 bg-gray-200 rounded mt-1" />
    </div>
  )
}

function EmptyState(): JSX.Element {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
      <Target size={48} className="text-gray-300 mb-4" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-500">
        No tienes metas de ahorro todavia
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Crea tu primera meta con el boton &ldquo;Nueva Meta&rdquo;
      </p>
    </div>
  )
}

export function MetasPage(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [metaSeleccionada, setMetaSeleccionada] = useState<MetaAhorro | null>(null)
  const [metaEditando, setMetaEditando] = useState<MetaAhorro | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data: metas = [], isLoading, isError } = useMetas()
  const createMeta = useCreateMeta()
  const updateMeta = useUpdateMeta()
  const deleteMeta = useDeleteMeta()

  const handleCreate = async (data: MetaFormData): Promise<void> => {
    await createMeta.mutateAsync({
      nombre: data.nombre,
      monto_objetivo: data.monto_objetivo,
      fecha_inicio: data.fecha_inicio,
      descripcion: data.descripcion || undefined,
      fecha_objetivo: data.fecha_objetivo || undefined,
      color: data.color || undefined,
      icono: data.icono || undefined,
    })
    setIsModalOpen(false)
  }

  const handleEdit = async (data: MetaFormData): Promise<void> => {
    if (!metaEditando) return
    await updateMeta.mutateAsync({
      id: metaEditando.id,
      nombre: data.nombre,
      monto_objetivo: data.monto_objetivo,
      fecha_inicio: data.fecha_inicio,
      descripcion: data.descripcion || undefined,
      fecha_objetivo: data.fecha_objetivo || undefined,
      color: data.color || undefined,
      icono: data.icono || undefined,
    })
    setMetaEditando(null)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Eliminar esta meta de ahorro?')) {
      await deleteMeta.mutateAsync(id)
      setDetailId(null)
      setMetaSeleccionada(null)
    }
  }

  const handleOpenDetail = (meta: MetaAhorro): void => {
    setMetaSeleccionada(meta)
    setDetailId(meta.id)
  }

  const handleOpenEdit = (meta: MetaAhorro): void => {
    setMetaEditando(meta)
    setDetailId(null)
    setMetaSeleccionada(null)
  }

  const handleCloseDetail = (): void => {
    setDetailId(null)
    setMetaSeleccionada(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas de ahorro</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona tus objetivos financieros
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="default">
          <Plus size={18} className="mr-2" />
          Nueva Meta
        </Button>
      </div>

      {/* KPI cards */}
      <div className="mb-6">
        <MetasResumenCards />
      </div>

      {/* Error state */}
      {isError && (
        <p className="text-sm text-gray-400 text-center py-4 mb-4">
          El servidor no esta disponible. Las metas se mostraran cuando el
          backend responda.
        </p>
      )}

      {/* Grid de metas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Loading state */}
        {isLoading && !isError && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* Empty state */}
        {!isLoading && !isError && metas.length === 0 && <EmptyState />}

        {/* Lista de metas */}
        {!isLoading &&
          metas.map((meta) => (
            <MetaCard key={meta.id} meta={meta} onClick={handleOpenDetail} />
          ))}
      </div>

      {/* Modal crear */}
      <MetaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMeta.isPending}
      />

      {/* Modal editar */}
      {metaEditando && (
        <MetaModal
          isOpen={true}
          onClose={() => setMetaEditando(null)}
          onSubmit={handleEdit}
          isLoading={updateMeta.isPending}
          meta={metaEditando}
        />
      )}

      {/* Panel de detalle */}
      {detailId && (
        <MetaDetail
          metaId={detailId}
          metaCache={metaSeleccionada ?? undefined}
          onClose={handleCloseDetail}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
