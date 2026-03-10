import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, TrendingDown, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TransaccionModal } from '@/components/transacciones/TransaccionModal'
import { useEgresos, useCreateEgreso, useDeleteEgreso } from '@/hooks/useEgresos'
import { useCategorias } from '@/hooks/useCategorias'
import { formatCurrency, formatDate, MESES, cn } from '@/lib/utils'
import type { IngresoFormData, EgresoFormData } from '@/components/transacciones/TransaccionForm'
import type { EgresoResponse } from '@/types/transacciones'

function getDefaultPeriod(): { mes: number; year: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, year: now.getFullYear() }
}

function buildYearOptions(currentYear: number): number[] {
  return [currentYear - 1, currentYear, currentYear + 1]
}

export function EgresosPage(): JSX.Element {
  const { t } = useTranslation()
  const defaults = getDefaultPeriod()
  const currentYear = defaults.year

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mes, setMes] = useState<number>(defaults.mes)
  const [year, setYear] = useState<number>(defaults.year)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useEgresos({ page: 1, page_size: 200 })
  const { data: categorias = [] } = useCategorias('egreso')
  const createEgreso = useCreateEgreso()
  const deleteEgreso = useDeleteEgreso()

  const yearOptions = buildYearOptions(currentYear)
  const categoriasMap = useMemo(
    () => Object.fromEntries(categorias.map((c) => [c.id, c.nombre])),
    [categorias]
  )

  const filteredItems = useMemo(() => {
    const items = data?.items ?? []
    const searchLower = search.toLowerCase()
    return items.filter((item) => {
      const fecha = new Date(item.fecha)
      const matchesMes = fecha.getMonth() + 1 === mes && fecha.getFullYear() === year
      const matchesSearch = searchLower === '' ||
        (item.descripcion?.toLowerCase().includes(searchLower) ?? false) ||
        (categoriasMap[item.categoria_id]?.toLowerCase().includes(searchLower) ?? false)
      return matchesMes && matchesSearch
    })
  }, [data?.items, mes, year, search, categoriasMap])

  const totalMes = useMemo(
    () => filteredItems.reduce((sum, e) => sum + parseFloat(e.monto), 0),
    [filteredItems]
  )

  const handleCreate = async (formData: IngresoFormData | EgresoFormData): Promise<void> => {
    try {
      await createEgreso.mutateAsync(formData)
      setIsModalOpen(false)
      toast.success(t('egresos.created'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Eliminar este egreso?')) {
      try {
        await deleteEgreso.mutateAsync(id)
        toast.success(t('egresos.deleted'))
      } catch {
        toast.error(t('common.error'))
      }
    }
  }

  const handleEdit = (_t: EgresoResponse): void => {
    // Edit will be implemented in a future iteration
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('egresos.title')}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {MESES[mes - 1]} {year}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="default" size="md">
          <Plus size={16} />
          {t('egresos.newEgreso')}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="finza-card">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--text-muted)]">{t('egresos.totalMonth')}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 font-mono">
                {formatCurrency(totalMes)}
              </p>
            </>
          )}
        </div>
        <div className="finza-card">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--text-muted)]">{t('egresos.count')}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                {filteredItems.length}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label htmlFor="egresos-mes" className="sr-only">{t('common.month')}</label>
          <select
            id="egresos-mes"
            aria-label={t('common.month')}
            className="finza-input text-sm"
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
          >
            {MESES.map((nombre, idx) => (
              <option key={idx + 1} value={idx + 1}>{nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="egresos-year" className="sr-only">{t('common.year')}</label>
          <select
            id="egresos-year"
            aria-label={t('common.year')}
            className="finza-input text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder={t('common.search')}
          className="finza-input text-sm flex-1 min-w-[200px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('common.search')}
        />
      </div>

      {/* Table / States */}
      {isLoading ? (
        <div className="finza-card overflow-hidden p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <TrendingDown size={48} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="font-medium text-[var(--text-primary)]">{t('egresos.noEgresos')}</p>
          <p className="text-sm text-[var(--text-muted)] mb-4">{t('egresos.noEgresosDesc')}</p>
          <Button onClick={() => setIsModalOpen(true)} size="md">
            <Plus size={16} />
            {t('egresos.newEgreso')}
          </Button>
        </div>
      ) : (
        <div className="finza-card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('common.description')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">
                  {t('common.category')}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('common.amount')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">
                  {t('common.date')}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, i) => (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b border-border last:border-0 hover:bg-surface-raised transition-colors',
                    i % 2 !== 0 ? 'bg-surface-raised/50' : ''
                  )}
                >
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                    {item.descripcion ?? categoriasMap[item.categoria_id] ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="neutral">
                      {categoriasMap[item.categoria_id] ?? '—'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-alert-red">
                    -{formatCurrency(parseFloat(item.monto), item.moneda)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)] hidden md:table-cell">
                    {formatDate(item.fecha)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:text-finza-blue hover:bg-surface-raised transition-colors"
                        aria-label="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:text-alert-red hover:bg-surface-raised transition-colors"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TransaccionModal
        tipo="egreso"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createEgreso.isPending}
      />
    </div>
  )
}
