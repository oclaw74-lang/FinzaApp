import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Target } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MetasResumenCards } from '@/features/metas/components/MetasResumenCards'
import { MetaCard } from '@/features/metas/components/MetaCard'
import { MetaModal } from '@/features/metas/components/MetaModal'
import { MetaDetail } from '@/features/metas/components/MetaDetail'
import type { MetaFormData } from '@/features/metas/components/MetaForm'
import { useMetas, useCreateMeta, useUpdateMeta, useDeleteMeta } from '@/hooks/useMetas'
import type { MetaAhorro } from '@/types/meta_ahorro'
import { getApiErrorMessage } from '@/lib/apiError'

function SkeletonCard(): JSX.Element {
  return (
    <div className="card-glass animate-pulse p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex justify-between mb-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-3 w-16 mt-1" />
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
      <Target size={48} className="text-[var(--text-muted)] opacity-40 mb-4" aria-hidden="true" />
      <p className="text-sm font-medium text-[var(--text-primary)]">
        {t('metas.noMetas')}
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
        {t('metas.noMetasDesc')}
      </p>
      <Button onClick={onNew} size="md">
        <Plus size={16} />
        {t('metas.newMeta')}
      </Button>
    </div>
  )
}

export function MetasPage(): JSX.Element {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [metaSeleccionada, setMetaSeleccionada] = useState<MetaAhorro | null>(null)
  const [metaEditando, setMetaEditando] = useState<MetaAhorro | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data: metas = [], isLoading, isError } = useMetas()
  const createMeta = useCreateMeta()
  const updateMeta = useUpdateMeta()
  const deleteMeta = useDeleteMeta()

  const handleCreate = async (data: MetaFormData): Promise<void> => {
    try {
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
      toast.success(t('metas.created'))
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleEdit = async (data: MetaFormData): Promise<void> => {
    if (!metaEditando) return
    try {
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
      toast.success(t('metas.updated'))
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Eliminar esta meta de ahorro?')) {
      try {
        await deleteMeta.mutateAsync(id)
        setDetailId(null)
        setMetaSeleccionada(null)
        toast.success(t('metas.deleted'))
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      }
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
    <div className="animate-fade-in p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="page-title-premium dark:text-[#e8f0ff]">{t('nav.metas')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Gestiona tus objetivos financieros</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="default" size="md"
          className="dark:bg-finza-blue dark:hover:bg-finza-blue/80 shrink-0">
          <Plus size={16} />
          {t('metas.newMeta')}
        </Button>
      </div>

      {/* KPI cards */}
      <div className="mb-6">
        <MetasResumenCards />
      </div>

      {/* Error state */}
      {isError && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4 mb-4">
          El servidor no esta disponible. Las metas se mostraran cuando el
          backend responda.
        </p>
      )}

      {/* Grid de metas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading && !isError && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!isLoading && !isError && metas.length === 0 && (
          <EmptyState onNew={() => setIsModalOpen(true)} />
        )}

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
