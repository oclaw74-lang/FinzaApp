import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PiggyBank, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  useFondoEmergencia,
  useCreateFondoEmergencia,
  useDepositarFondo,
  useRetirarFondo,
  useUpdateFondoEmergencia,
} from '@/hooks/useFondoEmergencia'

type ModalMode = 'crear' | 'depositar' | 'retirar' | null

export function FondoEmergenciaPage(): JSX.Element {
  const { t } = useTranslation()
  const { data: fondo, isLoading } = useFondoEmergencia()
  const crear = useCreateFondoEmergencia()
  const depositar = useDepositarFondo()
  const retirar = useRetirarFondo()
  const actualizar = useUpdateFondoEmergencia()

  const [modal, setModal] = useState<ModalMode>(null)
  const [monto, setMonto] = useState('')
  const [metaMeses, setMetaMeses] = useState<3 | 6 | 12>(3)
  const [notas, setNotas] = useState('')

  const handleCrear = async () => {
    try {
      await crear.mutateAsync({ monto_actual: 0, meta_meses: metaMeses, notas: notas || undefined })
      toast.success(t('fondoEmergencia.created'))
      setModal(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDepositar = async () => {
    const m = parseFloat(monto)
    if (!m || m <= 0) return
    try {
      await depositar.mutateAsync(m)
      toast.success(t('fondoEmergencia.depositoRegistrado'))
      setModal(null)
      setMonto('')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleRetirar = async () => {
    const m = parseFloat(monto)
    if (!m || m <= 0) return
    try {
      await retirar.mutateAsync(m)
      toast.success(t('fondoEmergencia.retiroRegistrado'))
      setModal(null)
      setMonto('')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleChangeMeta = async (meses: 3 | 6 | 12) => {
    if (!fondo) return
    try {
      await actualizar.mutateAsync({ meta_meses: meses })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in p-4 md:p-6 space-y-6">
      <div className="mb-6">
        <h1 className="page-title-premium dark:text-[#e8f0ff]">{t('fondoEmergencia.title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">{t('fondoEmergencia.subtitle')}</p>
      </div>

      {!fondo ? (
        <div className="card-glass p-12 text-center dark:border-finza-cyan/20">
          <PiggyBank size={40} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="font-medium text-[var(--text-primary)]">{t('fondoEmergencia.noFondo')}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1 mb-4">{t('fondoEmergencia.noFondoDesc')}</p>
          <button
            onClick={() => setModal('crear')}
            className="finza-btn px-4 py-2 text-sm"
          >
            <Plus size={16} className="inline mr-1" />
            {t('fondoEmergencia.configurar')}
          </button>
        </div>
      ) : (
        <>
          {/* Hero Card */}
          <div
            className="relative rounded-[20px] p-8 overflow-hidden mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0,223,162,0.1), rgba(61,142,248,0.05))',
              border: '1px solid rgba(0,223,162,0.2)',
            }}
          >
            {/* Decorative blob */}
            <div
              className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,223,162,0.15), transparent 70%)' }}
            />

            {/* Label */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00dfa2] mb-1">
              {t('fondoEmergencia.montoActual')}
            </p>

            {/* Monto */}
            <p className="text-[42px] font-extrabold tabular-nums text-[var(--text-primary)] leading-none mb-2">
              {formatCurrency(fondo.monto_actual)}
            </p>

            {/* Subtitle */}
            <p className="text-sm text-[var(--text-muted)] mb-5">
              {t('fondoEmergencia.coberturaDesc', {
                meses: fondo.meta_meses,
                unidad: fondo.meta_meses === 1 ? t('fondoEmergencia.mes') : t('fondoEmergencia.mesesShort'),
              })}
            </p>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-[var(--surface-raised)] dark:bg-white/10 overflow-hidden mb-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(fondo.porcentaje, 100)}%`,
                  background: 'linear-gradient(90deg, #00dfa2, #00dfff)',
                }}
              />
            </div>

            {/* Meta row */}
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>{t('fondoEmergencia.porcentajeMeta', { pct: (fondo.porcentaje ?? 0).toFixed(1) })}</span>
              {fondo.meta_calculada && fondo.meta_calculada > fondo.monto_actual && (
                <span>{t('fondoEmergencia.remaining')} {formatCurrency(fondo.meta_calculada - fondo.monto_actual)}</span>
              )}
            </div>
          </div>

          {/* Info cards 2 col */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="card-glass p-5">
              <p className="kpi-label dark:text-finza-t2">{t('fondoEmergencia.sugerenciaMensual')}</p>
              <p className="text-xl font-bold tabular-nums mt-2" style={{ color: '#ffb340' }}>
                {fondo.meta_calculada
                  ? formatCurrency(Math.max(0, (fondo.meta_calculada - fondo.monto_actual) / 12))
                  : '—'}
              </p>
            </div>
            <div className="card-glass p-5">
              <p className="kpi-label dark:text-finza-t2">{t('fondoEmergencia.metaCalculada')}</p>
              <p className="text-xl font-bold tabular-nums mt-2" style={{ color: '#3d8ef8' }}>
                {fondo.meta_calculada ? formatCurrency(fondo.meta_calculada) : '—'}
              </p>
            </div>
          </div>

          {/* Meta selector */}
          <div className="card-glass p-4 mb-4">
            <p className="text-xs text-[var(--text-muted)] mb-2">{t('fondoEmergencia.metaMeses')}</p>
            <div className="flex gap-2">
              {([3, 6, 12] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => handleChangeMeta(m)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                    fondo.meta_meses === m
                      ? 'bg-[var(--accent)] dark:bg-finza-cyan text-white dark:text-[#080f1e]'
                      : 'bg-surface-raised text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {m} {t('fondoEmergencia.meses')}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setModal('depositar')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #00dfa2, #00b87a)' }}
            >
              <ArrowUpCircle size={16} />
              {t('fondoEmergencia.depositar')}
            </button>
            <button
              onClick={() => setModal('retirar')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-transparent text-[var(--text-primary)] font-medium text-sm border border-[var(--border)]"
            >
              <ArrowDownCircle size={16} />
              {t('fondoEmergencia.retirar')}
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      {modal === 'crear' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="finza-card p-6 w-full max-w-sm">
            <h2 className="font-bold text-[var(--text-primary)] mb-4">{t('fondoEmergencia.configurar')}</h2>
            <label className="block text-xs text-[var(--text-muted)] mb-1">{t('fondoEmergencia.metaMeses')}</label>
            <select
              value={metaMeses}
              onChange={(e) => setMetaMeses(Number(e.target.value) as 3 | 6 | 12)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)] mb-3"
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
            <label className="block text-xs text-[var(--text-muted)] mb-1">{t('fondoEmergencia.notasOpcional')}</label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)] mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)]">
                {t('common.cancel')}
              </button>
              <button onClick={handleCrear} disabled={crear.isPending} className="flex-1 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium">
                {t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {(modal === 'depositar' || modal === 'retirar') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="finza-card p-6 w-full max-w-sm">
            <h2 className="font-bold text-[var(--text-primary)] mb-4">
              {modal === 'depositar' ? t('fondoEmergencia.depositar') : t('fondoEmergencia.retirar')}
            </h2>
            <label className="block text-xs text-[var(--text-muted)] mb-1">{t('fondoEmergencia.monto')}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)] mb-4"
              placeholder="0.00"
            />
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setMonto('') }} className="flex-1 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)]">
                {t('common.cancel')}
              </button>
              <button
                onClick={modal === 'depositar' ? handleDepositar : handleRetirar}
                disabled={depositar.isPending || retirar.isPending}
                className={cn('flex-1 py-2 rounded-xl text-white text-sm font-medium',
                  modal === 'depositar' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
                )}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
