import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Zap, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiError'
import { useDualMoneda } from '@/hooks/useDualMoneda'
import { useUserCurrency } from '@/hooks/useUserCurrency'
import {
  useSuscripcionesResumen,
  useCreateSuscripcion,
  useUpdateSuscripcion,
  useDeleteSuscripcion,
  useDetectarSuscripciones,
  useConfirmarDetectadas,
} from '@/hooks/useSuscripciones'
import type { SuscripcionData } from '@/types/suscripciones'

type ModalMode = 'crear' | 'editar' | 'detectar' | null

const FRECUENCIAS = ['mensual', 'anual', 'semanal', 'trimestral'] as const

const INITIAL_FORM = {
  nombre: '',
  monto: '',
  frecuencia: 'mensual',
  moneda: '',       // filled dynamically from user's main currency
  dia_del_mes: '',
  fecha_inicio: '',
}

export function SuscripcionesPage(): JSX.Element {
  const { t } = useTranslation()
  const { data: resumen, isLoading } = useSuscripcionesResumen()
  const { data: dualMoneda } = useDualMoneda()
  const userCurrency = useUserCurrency()
  const crear = useCreateSuscripcion()
  const actualizar = useUpdateSuscripcion()
  const eliminar = useDeleteSuscripcion()
  const detectar = useDetectarSuscripciones()
  const confirmar = useConfirmarDetectadas()

  const [modal, setModal] = useState<ModalMode>(null)
  const [editando, setEditando] = useState<SuscripcionData | null>(null)
  const [candidatos, setCandidatos] = useState<SuscripcionData[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({ ...INITIAL_FORM, moneda: userCurrency })

  // Build currency options: only main + secondary currency
  const monedaPrincipal = dualMoneda?.moneda_principal ?? userCurrency
  const monedaSecundaria = dualMoneda?.moneda_secundaria
  const tasaCambio = dualMoneda?.tasa_cambio ?? 1

  const monedaOptions = [
    { value: monedaPrincipal, label: monedaPrincipal },
    ...(monedaSecundaria ? [{ value: monedaSecundaria, label: monedaSecundaria }] : []),
  ]

  const openCrear = () => {
    setEditando(null)
    setForm({ ...INITIAL_FORM, moneda: monedaPrincipal || userCurrency })
    setModal('crear')
  }

  const openEditar = (s: SuscripcionData) => {
    setEditando(s)
    setForm({
      nombre: s.nombre,
      monto: String(s.monto),
      frecuencia: s.frecuencia,
      moneda: s.moneda || monedaPrincipal || userCurrency,
      dia_del_mes: s.dia_del_mes ? String(s.dia_del_mes) : '',
      fecha_inicio: s.fecha_inicio ?? '',
    })
    setModal('editar')
  }

  const buildPayload = () => ({
    nombre: form.nombre,
    monto: parseFloat(form.monto),
    frecuencia: form.frecuencia,
    moneda: form.moneda,
    dia_del_mes: form.frecuencia === 'mensual' && form.dia_del_mes ? parseInt(form.dia_del_mes, 10) : null,
    fecha_inicio: form.fecha_inicio || null,
  })

  const handleCrear = async () => {
    try {
      await crear.mutateAsync(buildPayload())
      toast.success(t('suscripciones.created'))
      setModal(null)
    } catch (err) { toast.error(getApiErrorMessage(err)) }
  }

  const handleActualizar = async () => {
    if (!editando) return
    try {
      await actualizar.mutateAsync({ id: editando.id, ...buildPayload() } as SuscripcionData & { id: string })
      toast.success(t('suscripciones.updated'))
      setModal(null)
      setEditando(null)
    } catch (err) { toast.error(getApiErrorMessage(err)) }
  }

  const handleEliminar = async (id: string) => {
    if (!window.confirm(t('common.confirm'))) return
    try {
      await eliminar.mutateAsync(id)
      toast.success(t('suscripciones.deleted'))
    } catch (err) { toast.error(getApiErrorMessage(err)) }
  }

  const handleDetectar = async () => {
    try {
      const result = await detectar.mutateAsync()
      setCandidatos(result)
      setSeleccionados(new Set(result.map((c) => c.id)))
      setModal('detectar')
    } catch (err) { toast.error(getApiErrorMessage(err)) }
  }

  const handleConfirmar = async () => {
    const sel = candidatos.filter((c) => seleccionados.has(c.id))
    try {
      await confirmar.mutateAsync(sel)
      toast.success(t('suscripciones.created'))
      setModal(null)
      setCandidatos([])
    } catch (err) { toast.error(getApiErrorMessage(err)) }
  }

  // Convert amount to main currency for totals
  const toMainCurrency = (monto: number, moneda: string): number => {
    if (!monedaSecundaria || moneda === monedaPrincipal) return monto
    if (moneda === monedaSecundaria && tasaCambio > 0) return monto * tasaCambio
    return monto
  }

  const suscripciones = resumen?.suscripciones ?? []

  // Compute totals in main currency
  const totalMensualMain = suscripciones.reduce(
    (acc, s) => acc + toMainCurrency(s.monto_mensual, s.moneda),
    0,
  )

  const closeModal = () => {
    setModal(null)
    setEditando(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('suscripciones.title')}</h1>
          <p className="text-sm text-[var(--text-muted)]">{t('suscripciones.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDetectar} disabled={detectar.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <RefreshCw size={14} />
            {t('suscripciones.detectar')}
          </button>
          <button onClick={openCrear} className="finza-btn flex items-center gap-1.5 px-3 py-2 text-sm">
            <Plus size={14} />
            {t('suscripciones.nueva')}
          </button>
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="finza-card p-4">
            <p className="text-xs text-[var(--text-muted)]">{t('suscripciones.totalMensual')}</p>
            <p className="text-xl font-bold text-[var(--text-primary)] money">{formatCurrency(totalMensualMain)}</p>
            {monedaSecundaria && <p className="text-[10px] text-[var(--text-muted)]">{monedaPrincipal}</p>}
          </div>
          <div className="finza-card p-4">
            <p className="text-xs text-[var(--text-muted)]">{t('suscripciones.totalAnual')}</p>
            <p className="text-xl font-bold text-[var(--text-primary)] money">{formatCurrency(totalMensualMain * 12)}</p>
            {monedaSecundaria && <p className="text-[10px] text-[var(--text-muted)]">{monedaPrincipal}</p>}
          </div>
          <div className="finza-card p-4">
            <p className="text-xs text-[var(--text-muted)]">{t('suscripciones.cantidadActivas')}</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{resumen?.cantidad_activas ?? 0}</p>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : suscripciones.length === 0 ? (
        <div className="finza-card p-12 text-center">
          <Zap size={32} className="mx-auto mb-2 text-[var(--text-muted)]" />
          <p className="font-medium text-[var(--text-primary)]">{t('suscripciones.noSuscripciones')}</p>
          <p className="text-sm text-[var(--text-muted)]">{t('suscripciones.noSuscripcionesDesc')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {suscripciones.map((s) => {
            const diaLabel = s.dia_del_mes ? `· Día ${s.dia_del_mes}` : s.fecha_proximo_cobro ? `· ${s.fecha_proximo_cobro}` : ''
            const montoMain = toMainCurrency(s.monto_mensual, s.moneda)
            const showConverted = monedaSecundaria && s.moneda !== monedaPrincipal
            return (
              <div key={s.id} className="finza-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-[var(--text-primary)] truncate">{s.nombre}</p>
                    {s.auto_detectada && (
                      <Badge variant="neutral" className="text-[10px]">{t('suscripciones.autoDetectada')}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{t(`suscripciones.${s.frecuencia}`)} {diaLabel}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm money text-[var(--text-primary)]">
                    {formatCurrency(s.monto)} <span className="text-[10px] font-normal text-[var(--text-muted)]">{s.moneda}</span>
                  </p>
                  {showConverted ? (
                    <p className="text-xs text-[var(--text-muted)]">≈ {formatCurrency(montoMain)}/mes</p>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">{formatCurrency(s.monto_mensual)}/mes</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditar(s)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)]"><Pencil size={13} /></button>
                  <button onClick={() => handleEliminar(s.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)]"><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal — via createPortal to avoid header stacking */}
      {(modal === 'crear' || modal === 'editar') && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative finza-card p-6 w-full max-w-sm space-y-3">
            <h2 className="font-bold text-[var(--text-primary)]">
              {modal === 'crear' ? t('suscripciones.nueva') : t('common.edit')}
            </h2>
            <input
              placeholder={t('suscripciones.nombre')}
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
            />
            <input
              type="number"
              placeholder={t('suscripciones.monto')}
              value={form.monto}
              onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
            />
            {/* Currency: only main + secondary */}
            <select
              value={form.moneda}
              onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
            >
              {monedaOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={form.frecuencia}
              onChange={(e) => setForm((f) => ({ ...f, frecuencia: e.target.value }))}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
            >
              {FRECUENCIAS.map((f) => <option key={f} value={f}>{t(`suscripciones.${f}`)}</option>)}
            </select>
            {/* Day of month — only for monthly */}
            {form.frecuencia === 'mensual' && (
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-muted)]">Día del mes</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="1–31"
                  value={form.dia_del_mes}
                  onChange={(e) => setForm((f) => ({ ...f, dia_del_mes: e.target.value }))}
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
                />
              </div>
            )}
            {/* Optional start date */}
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-muted)]">Fecha de inicio (opcional)</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={closeModal} className="flex-1 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)]">{t('common.cancel')}</button>
              <button
                onClick={modal === 'crear' ? handleCrear : handleActualizar}
                disabled={crear.isPending || actualizar.isPending}
                className="flex-1 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Detectar modal — via createPortal */}
      {modal === 'detectar' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModal(null)} />
          <div className="relative finza-card p-6 w-full max-w-sm">
            <h2 className="font-bold text-[var(--text-primary)] mb-3">{t('suscripciones.candidatosDetectados')}</h2>
            {candidatos.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] mb-4">{t('suscripciones.noPatterns')}</p>
            ) : (
              <div className="space-y-2 mb-4">
                {candidatos.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-raised cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seleccionados.has(c.id)}
                      onChange={(e) => setSeleccionados((prev) => { const n = new Set(prev); e.target.checked ? n.add(c.id) : n.delete(c.id); return n })}
                    />
                    <span className="text-sm text-[var(--text-primary)] flex-1">{c.nombre}</span>
                    <span className="text-sm font-bold money text-[var(--text-primary)]">{formatCurrency(c.monto)}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)]">{t('common.cancel')}</button>
              {candidatos.length > 0 && (
                <button
                  onClick={handleConfirmar}
                  disabled={confirmar.isPending || seleccionados.size === 0}
                  className="flex-1 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
                >
                  {t('suscripciones.confirmarDetectadas')}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
