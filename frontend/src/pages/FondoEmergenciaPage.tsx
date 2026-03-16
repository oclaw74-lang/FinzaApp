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

function ProgressBar({ porcentaje }: { porcentaje: number }) {
  const color =
    porcentaje >= 100
      ? 'var(--success)'
      : porcentaje >= 33
      ? '#FFC000'
      : 'var(--danger)'

  const hitos = [
    { pct: 33.3, label: '1 mes' },
    { pct: 100, label: '3 meses' },
    { pct: 200, label: '6 meses' },
  ]

  const barPct = Math.min(porcentaje, 100)

  return (
    <div className="mb-6">
      <div className="relative h-4 bg-surface-raised rounded-full overflow-visible mb-6">
        <div
          className="h-4 rounded-full transition-all duration-500"
          style={{ width: `${barPct}%`, backgroundColor: color }}
        />
        {hitos.map((h) => (
          <div
            key={h.pct}
            className="absolute top-0 h-4 w-0.5 bg-[var(--border)] z-10"
            style={{ left: `${Math.min(h.pct, 100)}%` }}
          >
            <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] text-[var(--text-muted)] whitespace-nowrap">
              {h.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FondoEmergenciaPage(): JSX.Element {
  const { t } = useTranslation()
  const { data: fondo, isLoading } = useFondoEmergencia()
  const crear = useCreateFondoEmergencia()
  const depositar = useDepositarFondo()
  const retirar = useRetirarFondo()
  const actualizar = useUpdateFondoEmergencia()

  const [modal, setModal] = useState<ModalMode>(null)
  const [monto, setMonto] = useState('')
  const [metaMeses, setMetaMeses] = useState<1 | 3 | 6>(3)
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
      toast.success(t('fondoEmergencia.depositado'))
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
      toast.success(t('fondoEmergencia.retirado'))
      setModal(null)
      setMonto('')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleChangeMeta = async (meses: 1 | 3 | 6) => {
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
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('fondoEmergencia.title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">{t('fondoEmergencia.subtitle')}</p>
      </div>

      {!fondo ? (
        <div className="finza-card p-12 text-center">
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
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="finza-card p-4">
              <p className="text-xs text-[var(--text-muted)]">{t('fondoEmergencia.montoActual')}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] money">{formatCurrency(fondo.monto_actual)}</p>
            </div>
            <div className="finza-card p-4">
              <p className="text-xs text-[var(--text-muted)]">{t('fondoEmergencia.metaCalculada')}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] money">
                {fondo.meta_calculada ? formatCurrency(fondo.meta_calculada) : '—'}
              </p>
            </div>
            <div className="finza-card p-4">
              <p className="text-xs text-[var(--text-muted)]">{t('fondoEmergencia.porcentaje')}</p>
              <p className={cn('text-2xl font-bold', fondo.porcentaje >= 100 ? 'text-[var(--success)]' : 'text-[var(--text-primary)]')}>
                {fondo.porcentaje.toFixed(1)}%
              </p>
            </div>
            <div className="finza-card p-4">
              <p className="text-xs text-[var(--text-muted)]">{t('fondoEmergencia.sugerenciaMensual')}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] money">
                {fondo.meta_calculada
                  ? formatCurrency(Math.max(0, (fondo.meta_calculada - fondo.monto_actual) / 12))
                  : '—'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="finza-card p-5 mb-4">
            <ProgressBar porcentaje={fondo.porcentaje} />
          </div>

          {/* Meta selector */}
          <div className="finza-card p-4 mb-4">
            <p className="text-xs text-[var(--text-muted)] mb-2">{t('fondoEmergencia.metaMeses')}</p>
            <div className="flex gap-2">
              {([1, 3, 6] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => handleChangeMeta(m)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                    fondo.meta_meses === m
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-surface-raised text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {m} {m === 1 ? t('fondoEmergencia.hito1mes') : `meses`}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setModal('depositar')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--success)] text-white font-medium text-sm"
            >
              <ArrowUpCircle size={16} />
              {t('fondoEmergencia.depositar')}
            </button>
            <button
              onClick={() => setModal('retirar')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-raised text-[var(--text-primary)] font-medium text-sm border border-[var(--border)]"
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
              onChange={(e) => setMetaMeses(Number(e.target.value) as 1 | 3 | 6)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)] mb-3"
            >
              <option value={1}>1 mes</option>
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
            </select>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Notas (opcional)</label>
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
