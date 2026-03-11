import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { getCategoriaIcon } from '@/lib/iconMap'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
} from '@/hooks/useCategorias'
import { getApiErrorMessage } from '@/lib/apiError'
import type { CategoriaResponse } from '@/types/transacciones'

interface CategoriaFormData {
  nombre: string
  tipo: 'ingreso' | 'egreso' | 'ambos'
  icono: string
}

function SkeletonRow(): JSX.Element {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="w-7 h-7 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

interface CategoriaModalProps {
  categoriaEditando: CategoriaResponse | null
  isLoading: boolean
  onClose: () => void
  onSubmit: (data: CategoriaFormData) => Promise<void>
}

function CategoriaModal({
  categoriaEditando,
  isLoading,
  onClose,
  onSubmit,
}: CategoriaModalProps): JSX.Element {
  const { t } = useTranslation()
  const [nombre, setNombre] = useState(categoriaEditando?.nombre ?? '')
  const [tipo, setTipo] = useState<'ingreso' | 'egreso' | 'ambos'>(
    categoriaEditando?.tipo ?? 'egreso'
  )
  const [icono, setIcono] = useState(categoriaEditando?.icono ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es requerido')
      return
    }
    setError(null)
    await onSubmit({ nombre: nombre.trim(), tipo, icono: icono.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={categoriaEditando ? t('categorias.editarTitulo') : t('categorias.nueva')}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-[var(--surface)] rounded-card shadow-card-hover w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {categoriaEditando ? t('categorias.editarTitulo') : t('categorias.nueva')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Cerrar"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <Input
            label={t('categorias.nombre')}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Alimentacion"
            required
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              {t('categorias.tipo')}
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'ingreso' | 'egreso' | 'ambos')}
              disabled={!!categoriaEditando}
              className="finza-input w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="ingreso">{t('categorias.ingreso')}</option>
              <option value="egreso">{t('categorias.egreso')}</option>
              <option value="ambos">{t('categorias.ambos')}</option>
            </select>
          </div>
          <Input
            label={t('categorias.icono')}
            value={icono}
            onChange={(e) => setIcono(e.target.value)}
            placeholder="🎯"
            maxLength={2}
          />
          {error && (
            <p className="text-xs text-alert-red bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="default" size="md" isLoading={isLoading}>
              {categoriaEditando ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TipoBadge({ tipo }: { tipo: 'ingreso' | 'egreso' | 'ambos' }): JSX.Element {
  const { t } = useTranslation()
  const variantMap = {
    ingreso: 'success',
    egreso: 'danger',
    ambos: 'info',
  } as const
  return (
    <Badge variant={variantMap[tipo]}>
      {t(`categorias.${tipo}`)}
    </Badge>
  )
}

export function CategoriasPage(): JSX.Element {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaResponse | null>(null)

  const { data: categorias = [], isLoading, isError } = useCategorias()
  const createCategoria = useCreateCategoria()
  const updateCategoria = useUpdateCategoria()
  const deleteCategoria = useDeleteCategoria()

  const categoriasSistema = categorias.filter((c) => c.es_sistema)
  const categoriasPersonalizadas = categorias.filter((c) => !c.es_sistema)

  const handleOpenCreate = (): void => {
    setCategoriaEditando(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cat: CategoriaResponse): void => {
    setCategoriaEditando(cat)
    setIsModalOpen(true)
  }

  const handleCloseModal = (): void => {
    setIsModalOpen(false)
    setCategoriaEditando(null)
  }

  const handleSubmit = async (data: CategoriaFormData): Promise<void> => {
    try {
      if (categoriaEditando) {
        await updateCategoria.mutateAsync({
          id: categoriaEditando.id,
          nombre: data.nombre,
          icono: data.icono || undefined,
        })
        toast.success(t('categorias.updated'))
      } else {
        await createCategoria.mutateAsync({
          nombre: data.nombre,
          tipo: data.tipo,
          icono: data.icono || undefined,
        })
        toast.success(t('categorias.created'))
      }
      handleCloseModal()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleDelete = async (cat: CategoriaResponse): Promise<void> => {
    if (window.confirm(t('categorias.deleteConfirm'))) {
      try {
        await deleteCategoria.mutateAsync(cat.id)
        toast.success(t('categorias.deleted'))
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      }
    }
  }

  const isPending = createCategoria.isPending || updateCategoria.isPending

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[var(--text-muted)] text-sm">
          {t('categorias.subtitle')}
        </p>
        <Button onClick={handleOpenCreate} variant="default" size="md">
          <Plus size={16} />
          {t('categorias.nueva')}
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4 mb-4">
          El servidor no esta disponible. Las categorias se mostraran cuando el backend responda.
        </p>
      )}

      {/* Seccion: Sistema */}
      {!isError && (
        <section className="mb-8" aria-label="Categorias del sistema">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
            {t('categorias.sistema')}
          </h2>
          <div className="finza-card p-0 overflow-hidden">
            {isLoading && (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}
            {!isLoading && categoriasSistema.map((cat) => {
              const CatIcon = getCategoriaIcon(cat.icono)
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-surface-raised flex items-center justify-center text-sm">
                      <CatIcon size={14} className="text-[var(--text-muted)]" />
                    </div>
                    <span className="text-sm text-[var(--text-primary)]">{cat.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TipoBadge tipo={cat.tipo} />
                    <Badge variant="neutral">{t('categorias.sistema')}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Seccion: Personalizadas */}
      {!isError && (
        <section aria-label="Categorias personalizadas">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
            {t('categorias.personalizada')}
          </h2>
          <div className="finza-card p-0 overflow-hidden">
            {isLoading && (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}
            {!isLoading && categoriasPersonalizadas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Tag size={40} className="text-[var(--text-muted)] opacity-30 mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {t('categorias.noCategorias')}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
                  {t('categorias.noCategoriasDesc')}
                </p>
                <Button onClick={handleOpenCreate} size="md">
                  <Plus size={16} />
                  {t('categorias.nueva')}
                </Button>
              </div>
            )}
            {!isLoading && categoriasPersonalizadas.map((cat) => {
              const CatIcon = getCategoriaIcon(cat.icono)
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-surface-raised flex items-center justify-center text-sm">
                      <CatIcon size={14} className="text-[var(--text-muted)]" />
                    </div>
                    <span className="text-sm text-[var(--text-primary)]">{cat.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TipoBadge tipo={cat.tipo} />
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      aria-label={`Editar ${cat.nombre}`}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-finza-blue hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      aria-label={`Eliminar ${cat.nombre}`}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-alert-red hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Modal crear/editar */}
      {isModalOpen && (
        <CategoriaModal
          categoriaEditando={categoriaEditando}
          isLoading={isPending}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
