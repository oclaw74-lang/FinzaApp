import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, RefreshCw, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  useRecurrentes,
  useCreateRecurrente,
  useUpdateRecurrente,
  useDeleteRecurrente,
  useProximosVencimientos,
} from '@/hooks/useRecurrentes'
import type { RecurrenteResponse, RecurrenteCreate, FrecuenciaRecurrente, TipoRecurrente } from '@/types/recurrente'

type ModalMode = 'crear' | 'editar' | null

const TIPOS: TipoRecurrente[] = ['ingreso', 'egreso']
const FRECUENCIAS: FrecuenciaRecurrente[] = ['diaria', 'semanal', 'quincenal', 'mensual']

interface FormState {
  tipo: TipoRecurrente
  descripcion: string
  monto: string
  frecuencia: FrecuenciaRecurrente
  dia_del_mes: string
  fecha_inicio: string
  fecha_fin: string
}

const defaultForm: FormState = {
  tipo: 'egreso',
  descripcion: '',
  monto: '',
  frecuencia: 'mensual',
  dia_del_mes: '',
  fecha_inicio: '',
  fecha_fin: '',
}

export function RecurrentesPage(): JSX.Element {
  const { t } = useTranslation()
  const now = new Date()
  const mes = now.getMonth() + 1
  const year = now.getFullYear()

  const { data: recurrentes, isLoading: loadingRecurrentes } = useRecurrentes()
  const { data: proximos, isLoading: loadingProximos } = useProximosVencimientos(mes, year)
  const crear = useCreateRecurrente()
  const actualizar = useUpdateRecurrente()
  const eliminar = useDeleteRecurrente()

  const [modal, setModal] = useState<ModalMode>(null)
  const [editando, setEditando] = useState<RecurrenteResponse | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)

  const openCrear = () => {
    setEditando(null)
    setForm(defaultForm)
    setModal('crear')
  }

  const openEditar = (r: RecurrenteResponse) => {
    setEditando(r)
    setForm({
      tipo: r.tipo,
      descripcion: r.descripcion,
      monto: String(r.monto),
      frecuencia: r.frecuencia,
      dia_del_mes: r.dia_del_mes !== null ? String(r.dia_del_mes) : '',
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin ?? '',
    })
    setModal('editar')
  }

  const closeModal = () => {
    setModal(null)
    setEditando(null)
    setForm(defaultForm)
  }

  const buildPayload = (): RecurrenteCreate => ({
    tipo: form.tipo,
    descripcion: form.descripcion,
    monto: parseFloat(form.monto),
    frecuencia: form.frecuencia,
    dia_del_mes: form.frecuencia === 'mensual' && form.dia_del_mes ? parseInt(form.dia_del_mes, 10) : null,
    fecha_inicio: form.fecha_inicio,
    fecha_fin: form.fecha_fin || null,
  })

  const handleCrear = async () => {
    try {
      await crear.mutateAsync(buildPayload())
      toast.success(t('recurrentes.toast.created'))
      closeModal()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleActualizar = async () => {
    if (!editando) return
    try {
      await actualizar.mutateAsync({ id: editando.id, ...buildPayload() })
      toast.success(t('recurrentes.toast.updated'))
      closeModal()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleEliminar = async (id: string) => {
    if (!window.confirm(t('common.confirm'))) return
    try {
      await eliminar.mutateAsync(id)
      toast.success(t('recurrentes.toast.deleted'))
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleToggleActivo = async (r: RecurrenteResponse) => {
    try {
      await actualizar.mutateAsync({ id: r.id, activo: !r.activo })
      toast.success(t('recurrentes.toast.updated'))
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  return (
    <div className="animate-fade-in p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title-premium dark:text-[#e8f0ff]">{t('recurrentes.title')}</h1>
          <p className="text-sm dark:text-finza-t2 mt-1">{t('recurrentes.subtitle')}</p>
        </div>
        <button
          onClick={openCrear}
          className="flex items-center gap-2 bg-finza-blue hover:bg-finza-blue/80 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          aria-label={t('recurrentes.nueva')}
        >
          <Plus size={14} />
          {t('recurrentes.nueva')}
        </button>
      </div>

      {/* Proximos vencimientos */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Calendar size={16} />
          {t('recurrentes.proximosTitle')}
        </h2>
        {loadingProximos ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : !proximos || proximos.length === 0 ? (
          <div className="card-glass p-8 text-center">
            <Calendar size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="font-medium text-[var(--text-primary)]">{t('recurrentes.noProximos')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {proximos.map(({ recurrente, fecha_estimada }) => (
              <div key={recurrente.id} className="card-glass p-4 flex items-center gap-4 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-[var(--text-primary)] truncate">
                      {recurrente.descripcion}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-[10px]"
                      style={{
                        background: recurrente.tipo === 'ingreso' ? 'var(--income)' : 'var(--expense)',
                        color: 'white',
                      }}
                    >
                      {t(`recurrentes.tipo.${recurrente.tipo}`)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {t(`recurrentes.frecuencia.${recurrente.frecuencia}`)}
                    </Badge>
                  </div>
                  <p className="text-xs dark:text-finza-yellow mt-0.5">{fecha_estimada}</p>
                </div>
                <p className={`font-bold text-sm money ${recurrente.tipo === 'ingreso' ? 'dark:text-finza-green' : 'dark:text-finza-red'} text-[var(--text-primary)]`}>
                  {formatCurrency(recurrente.monto)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Todas las recurrentes */}
      <section>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <RefreshCw size={16} />
          {t('recurrentes.todasTitle')}
        </h2>
        {loadingRecurrentes ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : !recurrentes || recurrentes.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <RefreshCw size={32} className="mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="font-medium text-[var(--text-primary)]">{t('recurrentes.noRecurrentes')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recurrentes.map((r) => (
              <div key={r.id} className="card-glass p-4 flex items-center gap-4 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-[var(--text-primary)] truncate">{r.descripcion}</p>
                    <Badge
                      variant="secondary"
                      className="text-[10px]"
                      style={{
                        background: r.tipo === 'ingreso' ? 'var(--income)' : 'var(--expense)',
                        color: 'white',
                      }}
                    >
                      {t(`recurrentes.tipo.${r.tipo}`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t(`recurrentes.frecuencia.${r.frecuencia}`)}
                    {r.dia_del_mes ? ` · ${t('recurrentes.form.diaDelMes')} ${r.dia_del_mes}` : ''}
                  </p>
                </div>
                <p className={`font-bold text-sm money ${r.tipo === 'ingreso' ? 'dark:text-finza-green' : 'dark:text-finza-red'} text-[var(--text-primary)]`}>
                  {formatCurrency(r.monto)}
                </p>
                {/* Toggle activo */}
                <button
                  onClick={() => handleToggleActivo(r)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    r.activo ? 'bg-[var(--success)] dark:bg-finza-blue' : 'bg-[var(--border)]'
                  }`}
                  role="switch"
                  aria-checked={r.activo}
                  aria-label={r.activo ? 'activo' : 'inactivo'}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      r.activo ? 'translate-x-[18px]' : 'translate-x-[2px]'
                    }`}
                  />
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditar(r)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)]"
                    aria-label={t('common.edit')}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleEliminar(r.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)]"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create / Edit Modal */}
      {(modal === 'crear' || modal === 'editar') && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="finza-card p-6 w-full max-w-sm space-y-3 overflow-y-auto max-h-[90vh]">
            <h2 id="modal-title" className="font-bold text-[var(--text-primary)]">
              {modal === 'crear' ? t('recurrentes.form.createTitle') : t('recurrentes.form.editTitle')}
            </h2>

            {/* Tipo */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('recurrentes.form.tipo')}</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoRecurrente }))}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
              >
                {TIPOS.map((tipo) => (
                  <option key={tipo} value={tipo}>{t(`recurrentes.tipo.${tipo}`)}</option>
                ))}
              </select>
            </div>

            {/* Descripcion */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('recurrentes.form.descripcion')}</label>
              <input
                type="text"
                placeholder={t('recurrentes.form.descripcion')}
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('recurrentes.form.monto')}</label>
              <input
                type="number"
                placeholder={t('recurrentes.form.monto')}
                value={form.monto}
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
                min="0"
                step="0.01"
              />
            </div>

            {/* Frecuencia */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('recurrentes.form.frecuencia')}</label>
              <select
                value={form.frecuencia}
                onChange={(e) => setForm((f) => ({ ...f, frecuencia: e.target.value as FrecuenciaRecurrente, dia_del_mes: '' }))}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
              >
                {FRECUENCIAS.map((f) => (
                  <option key={f} value={f}>{t(`recurrentes.frecuencia.${f}`)}</option>
                ))}
              </select>
            </div>

            {/* Dia del mes — solo si mensual */}
            {form.frecuencia === 'mensual' && (
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">{t('recurrentes.form.diaDelMes')}</label>
                <input
                  type="number"
                  placeholder="1-31"
                  value={form.dia_del_mes}
                  onChange={(e) => setForm((f) => ({ ...f, dia_del_mes: e.target.value }))}
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
                  min="1"
                  max="31"
                />
              </div>
            )}

            {/* Fecha inicio */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('recurrentes.form.fechaInicio')}</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{t('recurrentes.form.fechaFin')}</label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value }))}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)]"
              >
                {t('recurrentes.form.cancelar')}
              </button>
              <button
                onClick={modal === 'crear' ? handleCrear : handleActualizar}
                disabled={crear.isPending || actualizar.isPending}
                className="flex-1 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
              >
                {t('recurrentes.form.guardar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
