import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, TrendingDown, Pencil, Trash2, Hash, BarChart2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TransaccionModal } from '@/components/transacciones/TransaccionModal'
import { useEgresos, useCreateEgreso, useUpdateEgreso, useDeleteEgreso } from '@/hooks/useEgresos'
import { getApiErrorMessage } from '@/lib/apiError'
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [egresoEditando, setEgresoEditando] = useState<EgresoResponse | null>(null)
  const [mes, setMes] = useState<number>(0)
  const [year, setYear] = useState<number>(defaults.year)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useEgresos({ page: 1, page_size: 200 })
  const { data: categorias = [] } = useCategorias()
  const createEgreso = useCreateEgreso()
  const updateEgreso = useUpdateEgreso()
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
      // Use string prefix to avoid UTC timezone shift on date-only strings
      const datePrefix = `${year}-${String(mes).padStart(2, '0')}`
      const matchesMes = mes === 0 || item.fecha.startsWith(datePrefix)
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
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleEdit = (egreso: EgresoResponse): void => {
    setEgresoEditando(egreso)
    setIsEditModalOpen(true)
  }

  const handleUpdate = async (formData: IngresoFormData | EgresoFormData): Promise<void> => {
    if (!egresoEditando) return
    try {
      await updateEgreso.mutateAsync({ id: egresoEditando.id, ...formData })
      setIsEditModalOpen(false)
      setEgresoEditando(null)
      toast.success(t('egresos.updated'))
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Eliminar este egreso?')) {
      try {
        await deleteEgreso.mutateAsync(id)
        toast.success(t('egresos.deleted'))
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      }
    }
  }

  return (
    <div className="animate-fade-in p-4 md:p-6 space-y-6">
      {/* Stats chips */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
        <div className="card-glass p-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-finza-red/10">
            <TrendingDown className="w-4 h-4 dark:text-finza-red" style={{ color: 'var(--danger)' }} />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <>
                <p className="kpi-value dark:text-finza-red">
                  {formatCurrency(totalMes)}
                </p>
                <p className="kpi-label dark:text-finza-t2">
                  {t('egresos.totalMonth')}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="card-glass p-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-finza-blue/10">
            <Hash className="w-4 h-4 dark:text-finza-blue" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <>
                <p className="kpi-value dark:text-[#e8f0ff]">
                  {filteredItems.length}
                </p>
                <p className="kpi-label dark:text-finza-t2">
                  {t('egresos.count')}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="card-glass p-5 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-finza-yellow/10">
            <BarChart2 className="w-4 h-4 dark:text-finza-yellow" style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <>
                <p className="kpi-value dark:text-finza-t2">
                  {formatCurrency(filteredItems.length ? totalMes / filteredItems.length : 0)}
                </p>
                <p className="kpi-label dark:text-finza-t2">Promedio</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="finza-card dark:bg-[rgba(8,15,30,0.6)] dark:backdrop-blur-xl dark:border-white/[0.06] p-0 overflow-hidden">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[var(--border)]">
          <div>
            <label htmlFor="egresos-mes" className="sr-only">{t('common.month')}</label>
            <select
              id="egresos-mes"
              aria-label={t('common.month')}
              className="finza-input text-sm w-auto"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
            >
              <option value={0}>Todos los meses</option>
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
              className="finza-input text-sm w-auto"
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
          <Button onClick={() => setIsModalOpen(true)} variant="default" size="md" className="ml-auto">
            <Plus size={16} />
            {t('egresos.newEgreso')}
          </Button>
        </div>

        {/* Table / States */}
        {isLoading ? (
          <div className="p-4 space-y-3">
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, i) => {
                const catName = categoriasMap[item.categoria_id] ?? ''
                const initial = catName.charAt(0).toUpperCase() || 'E'
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-raised)] dark:hover:bg-white/[0.03] transition-colors group border-l-2 border-l-[#FF0000]',
                      i % 2 !== 0 ? 'bg-[var(--surface-raised)]/40' : ''
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: 'var(--danger-muted)',
                            color: 'var(--danger)',
                          }}
                          aria-hidden="true"
                        >
                          {initial}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {item.descripcion ?? catName ?? '\u2014'}
                        </span>
                        {(item as EgresoResponse & { is_impulso?: boolean }).is_impulso === true && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color: 'var(--warning)', backgroundColor: 'var(--warning-muted)' }}>
                            <Zap size={9} />
                            Impulso
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="neutral">
                        {catName || '\u2014'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold dark:text-finza-red" style={{ color: 'var(--danger)' }}>
                        -{formatCurrency(parseFloat(item.monto), item.moneda)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)] hidden md:table-cell">
                      {formatDate(item.fecha)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="p-1.5 hover:bg-[var(--surface-raised)] rounded-lg transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil size={14} className="text-[var(--text-muted)]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--danger-muted)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                          aria-label="Eliminar"
                        >
                          <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <TransaccionModal
        tipo="egreso"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createEgreso.isPending}
      />

      <TransaccionModal
        tipo="egreso"
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEgresoEditando(null) }}
        onSubmit={handleUpdate}
        isLoading={updateEgreso.isPending}
        title={t('egresos.editEgreso')}
        submitLabel={t('common.save')}
        defaultValues={egresoEditando ? {
          categoria_id: egresoEditando.categoria_id,
          monto: parseFloat(egresoEditando.monto),
          moneda: egresoEditando.moneda as 'DOP' | 'USD',
          descripcion: egresoEditando.descripcion ?? undefined,
          metodo_pago: egresoEditando.metodo_pago,
          fecha: egresoEditando.fecha,
          notas: egresoEditando.notas ?? undefined,
        } : undefined}
      />
    </div>
  )
}
