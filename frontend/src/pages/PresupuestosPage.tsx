import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Target, Sparkles, X, Tag } from 'lucide-react'
import * as Icons from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PresupuestoCard } from '@/features/presupuestos/components/PresupuestoCard'
import { PresupuestoModal } from '@/features/presupuestos/components/PresupuestoModal'
import type { PresupuestoFormData } from '@/features/presupuestos/components/PresupuestoForm'
import {
  usePresupuestosEstado,
  usePresupuestosSugeridos,
  useCreatePresupuesto,
  useUpdatePresupuesto,
  useDeletePresupuesto,
} from '@/hooks/usePresupuestos'
import { useCategorias } from '@/hooks/useCategorias'
import { formatCurrency, MESES } from '@/lib/utils'
import type { PresupuestoEstado, PresupuestoSugerido } from '@/types/presupuesto'

function getDefaultMesYear(): { mes: number; year: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, year: now.getFullYear() }
}

function getYearOptions(currentYear: number): number[] {
  return [currentYear - 1, currentYear, currentYear + 1]
}

function SkeletonCard(): JSX.Element {
  return (
    <div className="card-glass animate-pulse p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex justify-between mb-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      <Skeleton className="h-3 w-12 mt-1" />
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
      <Target size={48} className="text-[var(--text-muted)] opacity-40 mb-4" aria-hidden="true" />
      <p className="text-sm font-medium text-[var(--text-primary)]">
        {t('presupuestos.noPresupuestos')}
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
        {t('presupuestos.noPresupuestosDesc')}
      </p>
      <Button onClick={onNew} size="md">
        <Plus size={16} />
        {t('presupuestos.newPresupuesto')}
      </Button>
    </div>
  )
}

export function PresupuestosPage(): JSX.Element {
  const { t } = useTranslation()
  const defaults = getDefaultMesYear()
  const [mes, setMes] = useState<number>(defaults.mes)
  const [year, setYear] = useState<number>(defaults.year)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEstado, setEditingEstado] = useState<PresupuestoEstado | null>(null)
  const [preselectedCategoriaId, setPreselectedCategoriaId] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [applyingAll, setApplyingAll] = useState(false)

  const { data: estadoList = [], isLoading, isError } = usePresupuestosEstado(mes, year)
  const {
    data: sugeridos = [],
    isFetching: isFetchingSugeridos,
    refetch: refetchSugeridos,
  } = usePresupuestosSugeridos(mes, year)
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

  const currentYear = defaults.year
  const yearOptions = getYearOptions(currentYear)

  // Summary totals
  const totalPresupuestado = useMemo(
    () => estadoList.reduce((sum, e) => sum + e.monto_limite, 0),
    [estadoList]
  )
  const totalGastado = useMemo(
    () => estadoList.reduce((sum, e) => sum + e.gasto_actual, 0),
    [estadoList]
  )
  const disponible = totalPresupuestado - totalGastado

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

  const handleOpenSugerencias = async (): Promise<void> => {
    setIsSuggestionsOpen(true)
    await refetchSugeridos()
  }

  const handleAplicarSugerido = async (sugerido: PresupuestoSugerido): Promise<void> => {
    try {
      await createPresupuesto.mutateAsync({
        categoria_id: sugerido.categoria_id,
        mes,
        year,
        monto_limite: sugerido.sugerido,
      })
      toast.success(`Presupuesto para ${sugerido.categoria_nombre} creado`)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error(`Ya existe un presupuesto para ${sugerido.categoria_nombre}`)
      } else {
        toast.error(getApiErrorMessage(error))
      }
    }
  }

  const handleAplicarTodos = async (): Promise<void> => {
    if (sugeridos.length === 0) return
    setApplyingAll(true)
    let applied = 0
    for (const sug of sugeridos) {
      try {
        await createPresupuesto.mutateAsync({
          categoria_id: sug.categoria_id,
          mes,
          year,
          monto_limite: sug.sugerido,
        })
        applied++
      } catch {
        // skip already-existing ones
      }
    }
    setApplyingAll(false)
    toast.success(t('presupuestos.sugerenciasAplicadas', { n: applied }))
    setIsSuggestionsOpen(false)
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
      toast.success(t('presupuestos.created'))
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setFormError(getApiErrorMessage(error, 'Ya existe un presupuesto para esta categoria'))
      } else {
        setFormError(getApiErrorMessage(error, 'Error al crear el presupuesto. Intenta de nuevo.'))
        toast.error(getApiErrorMessage(error))
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
      toast.success(t('presupuestos.updated'))
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Error al actualizar el presupuesto. Intenta de nuevo.'))
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!editingEstado) return
    if (window.confirm('Eliminar este presupuesto?')) {
      try {
        await deletePresupuesto.mutateAsync(editingEstado.id)
        handleCloseEdit()
        toast.success(t('presupuestos.deleted'))
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      }
    }
  }

  return (
    <div className="animate-fade-in p-6 md:p-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title-premium dark:text-[#e8f0ff]">{t('nav.presupuestos')}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Controla tus limites de gasto por categoria
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenSugerencias}
            variant="secondary"
            size="md"
            aria-label={t('presupuestos.sugerir')}
          >
            <Sparkles size={16} />
            {t('presupuestos.sugerir')}
          </Button>
          <Button onClick={handleOpenCreate} variant="default" size="md">
            <Plus size={16} />
            {t('common.new')}
          </Button>
        </div>
      </div>

      {/* Selector de mes / año */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <label htmlFor="mes-selector" className="text-xs text-[var(--text-muted)] font-medium">
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
          <label htmlFor="year-selector" className="text-xs text-[var(--text-muted)] font-medium">
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

      {/* Summary cards */}
      {!isError && !isLoading && estadoList.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card-glass p-5">
            <p className="kpi-label dark:text-finza-t2">{t('presupuestos.budgeted')}</p>
            <p className="kpi-value dark:text-finza-blue mt-2">
              {formatCurrency(totalPresupuestado)}
            </p>
          </div>
          <div className="card-glass p-5">
            <p className="kpi-label dark:text-finza-t2">{t('presupuestos.spent')}</p>
            <p className={`kpi-value mt-2 ${totalGastado > totalPresupuestado ? 'dark:text-finza-red' : 'dark:text-finza-green'}`}>
              {formatCurrency(totalGastado)}
            </p>
          </div>
          <div className="card-glass p-5">
            <p className="kpi-label dark:text-finza-t2">{t('presupuestos.available')}</p>
            <p className={`kpi-value mt-2 ${disponible >= 0 ? 'text-prosperity-green dark:text-finza-green' : 'text-alert-red dark:text-finza-red'}`}>
              {formatCurrency(Math.abs(disponible))}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4 mb-4">
          El servidor no esta disponible. Los presupuestos se mostraran cuando
          el backend responda.
        </p>
      )}

      {/* Seccion: Con presupuesto */}
      {!isError && (
        <>
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
            Con presupuesto asignado
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {isLoading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}
            {!isLoading && estadoList.length === 0 && (
              <EmptyState onNew={handleOpenCreate} />
            )}
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
              <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                Sin presupuesto
              </h2>
              <div className="card-glass p-0 overflow-hidden">
                {categoriasSinPresupuesto.map((cat, idx) => {
                  const iconName = cat.icono ?? ''
                  const IconComponent =
                    iconName && (Icons as Record<string, unknown>)[iconName]
                      ? (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
                      : Tag
                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center justify-between px-4 py-3 dark:hover:bg-white/[0.03] transition-colors ${
                        idx < categoriasSinPresupuesto.length - 1
                          ? 'border-b border-border'
                          : ''
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                        <IconComponent className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
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
                  )
                })}
                {/* Boton para agregar presupuesto de categoria no listada */}
                <div className="border-t border-border px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">
                    ¿No ves tu categoria?
                  </span>
                  <Button
                    variant="secondary"
                    onClick={handleOpenCreate}
                    className="text-xs py-1 px-3 h-auto"
                  >
                    <Plus size={13} className="mr-1" />
                    Agregar otro
                  </Button>
                </div>
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

      {/* Sugerencias modal */}
      {isSuggestionsOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sugerencias-title"
        >
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
              <div>
                <h2
                  id="sugerencias-title"
                  className="font-bold text-[var(--text-primary)]"
                >
                  {t('presupuestos.sugerenciasTitle')}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('presupuestos.sugerenciasSubtitle')}
                </p>
              </div>
              <button
                onClick={() => setIsSuggestionsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]"
                aria-label={t('common.close')}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {isFetchingSugeridos ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : sugeridos.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles
                    size={32}
                    className="mx-auto mb-2 text-[var(--text-muted)] opacity-40"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-[var(--text-muted)]">
                    {t('presupuestos.sinSugerencias')}
                  </p>
                </div>
              ) : (
                sugeridos.map((sug) => (
                  <div
                    key={sug.categoria_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-raised)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                        {sug.categoria_nombre}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {t('presupuestos.promedio')}: {formatCurrency(sug.promedio_mensual)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="font-bold text-[var(--accent)] text-sm whitespace-nowrap">
                        {formatCurrency(sug.sugerido)}
                      </span>
                      <button
                        onClick={() => handleAplicarSugerido(sug)}
                        disabled={createPresupuesto.isPending}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {t('presupuestos.aplicar')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal footer */}
            {sugeridos.length > 0 && (
              <div className="p-5 border-t border-[var(--border)]">
                <Button
                  onClick={handleAplicarTodos}
                  isLoading={applyingAll}
                  className="w-full"
                  variant="default"
                >
                  <Sparkles size={16} />
                  {t('presupuestos.aplicarTodos')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
