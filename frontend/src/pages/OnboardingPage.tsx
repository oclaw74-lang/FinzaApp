import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Globe, DollarSign, CheckCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateProfile } from '@/hooks/useProfile'
import { usePaises } from '@/hooks/useCatalogos'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const TOTAL_STEPS = 3

export function OnboardingPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const updateProfile = useUpdateProfile()
  const { data: paises = [], isLoading: paisesLoading } = usePaises()

  const [step, setStep] = useState(1)
  const [selectedPais, setSelectedPais] = useState('DO')
  const [salario, setSalario] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const progressPct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)

  const handleNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))

  const handleSavePais = async () => {
    const pais = paises.find((p) => p.codigo === selectedPais)
    if (pais) {
      try {
        await supabase.auth.updateUser({
          data: {
            country: pais.nombre,
            currency: pais.moneda_codigo,
            pais_codigo: pais.codigo,
          },
        })
      } catch {
        // non-blocking
      }
    }
    handleNext()
  }

  const handleSaveSalario = async () => {
    if (salario) {
      try {
        await updateProfile.mutateAsync({
          salario_mensual_neto: parseFloat(salario),
        })
      } catch {
        // non-blocking
      }
    }
    handleNext()
  }

  const handleFinish = async () => {
    setIsSubmitting(true)
    try {
      await updateProfile.mutateAsync({ onboarding_completed: true })
      toast.success(t('onboarding.listo'))
    } catch {
      // best effort
    } finally {
      setIsSubmitting(false)
      navigate('/dashboard', { replace: true })
    }
  }

  const stepIcons = [Globe, DollarSign, CheckCircle]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full mx-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <Sparkles className="text-[var(--accent)]" size={28} aria-hidden="true" />
            <span className="text-2xl font-bold text-[var(--text-primary)]">Finza</span>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl shadow-xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-[var(--border)]">
            <div
              className="h-1 bg-[var(--accent)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 py-4 px-6">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const stepNum = i + 1
              const isCompleted = stepNum < step
              const isCurrent = stepNum === step
              const Icon = stepIcons[i]
              return (
                <div key={i} className="flex items-center">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                      isCompleted
                        ? 'bg-[var(--accent)] text-white'
                        : isCurrent
                        ? 'border-2 border-[var(--accent)] text-[var(--accent)]'
                        : 'border-2 border-[var(--border)] text-[var(--text-muted)]'
                    )}
                  >
                    {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                  </div>
                  {i < TOTAL_STEPS - 1 && (
                    <div
                      className={cn(
                        'w-10 h-0.5 mx-1',
                        isCompleted ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="px-6 pb-6">
            {/* STEP 1 — País y moneda */}
            {step === 1 && (
              <div className="animate-fade-in">
                <div className="text-center mb-5">
                  <p className="text-xl font-bold text-[var(--text-primary)] mb-1">
                    {t('onboarding.bienvenido')}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {t('onboarding.paisSubtitulo')}
                  </p>
                </div>

                {paisesLoading ? (
                  <div className="h-48 flex items-center justify-center">
                    <p className="text-sm text-[var(--text-muted)]">Cargando países...</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-[var(--border)] mb-5">
                    {paises.map((pais) => (
                      <button
                        key={pais.codigo}
                        type="button"
                        onClick={() => setSelectedPais(pais.codigo)}
                        className={cn(
                          'w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                          selectedPais === pais.codigo
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                            : 'hover:bg-[var(--surface-raised)] text-[var(--text-primary)]'
                        )}
                      >
                        {pais.bandera_emoji && (
                          <span className="text-lg" aria-hidden="true">{pais.bandera_emoji}</span>
                        )}
                        <span className="flex-1">{pais.nombre}</span>
                        <span className="text-xs text-[var(--text-muted)]">{pais.moneda_codigo}</span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleSavePais}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors"
                >
                  {t('onboarding.continuar')}
                </button>
              </div>
            )}

            {/* STEP 2 — Salario */}
            {step === 2 && (
              <div className="animate-fade-in">
                <div className="text-center mb-6">
                  <DollarSign
                    size={32}
                    className="text-[var(--accent)] mx-auto mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-xl font-bold text-[var(--text-primary)] mb-1">
                    {t('onboarding.paso2')}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {t('onboarding.salarioHint')}
                  </p>
                </div>
                <div className="space-y-2 mb-6">
                  <label
                    htmlFor="onboarding-salario"
                    className="block text-sm font-medium text-[var(--text-secondary)]"
                  >
                    {t('onboarding.salarioLabel')}
                  </label>
                  <input
                    id="onboarding-salario"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={salario}
                    onChange={(e) => setSalario(e.target.value)}
                    className="finza-input w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleNext}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)] hover:bg-[var(--surface-raised)] transition-colors"
                  >
                    {t('onboarding.omitir')}
                  </button>
                  <button
                    onClick={handleSaveSalario}
                    disabled={updateProfile.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                  >
                    {t('onboarding.continuar')}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Listo */}
            {step === 3 && (
              <div className="animate-fade-in text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-[var(--success)]" aria-hidden="true" />
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    {t('onboarding.listo')}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {t('onboarding.listoDesc')}
                  </p>
                </div>
                <div className="space-y-2 mb-6 text-left">
                  {selectedPais && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle size={14} className="text-[var(--success)]" />
                      <span>
                        {paises.find((p) => p.codigo === selectedPais)?.bandera_emoji}{' '}
                        {paises.find((p) => p.codigo === selectedPais)?.nombre ?? selectedPais}
                      </span>
                    </div>
                  )}
                  {salario && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle size={14} className="text-[var(--success)]" />
                      <span>
                        {t('onboarding.salarioLabel')}: {parseFloat(salario).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle size={14} className="text-[var(--success)]" />
                    <span>{t('onboarding.listoDesc')}</span>
                  </div>
                </div>
                <button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {t('onboarding.finalizar')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
