import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DollarSign, Target, BarChart2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateProfile } from '@/hooks/useProfile'
import { apiClient } from '@/lib/api'
import { useCategorias } from '@/hooks/useCategorias'
import { cn } from '@/lib/utils'

interface OnboardingWizardProps {
  onComplete: () => void
}

interface Step3Form {
  monto: string
  descripcion: string
  fecha: string
  categoria_id: string
}

const TOTAL_STEPS = 4

export function OnboardingWizard({ onComplete }: OnboardingWizardProps): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const updateProfile = useUpdateProfile()
  const { data: categorias = [] } = useCategorias()

  const [step, setStep] = useState(1)
  const [salario, setSalario] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step3Form, setStep3Form] = useState<Step3Form>({
    monto: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    categoria_id: '',
  })

  const categoriasIngreso = categorias.filter(
    (c) => c.tipo === 'ingreso' || c.tipo === 'ambos'
  )

  const progressPct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)

  const handleNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  const handleSkip = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))

  const handleSaveSalario = async () => {
    if (salario) {
      try {
        await updateProfile.mutateAsync({
          salario_mensual_neto: parseFloat(salario),
        })
      } catch {
        // non-blocking — continue wizard
      }
    }
    handleNext()
  }

  const handleRegisterIngreso = async () => {
    if (!step3Form.monto || !step3Form.categoria_id) {
      handleSkip()
      return
    }
    setIsSubmitting(true)
    try {
      await apiClient.post('/ingresos', {
        categoria_id: step3Form.categoria_id,
        monto: parseFloat(step3Form.monto),
        moneda: 'DOP',
        descripcion: step3Form.descripcion || undefined,
        fecha: step3Form.fecha,
      })
      toast.success(t('ingresos.created'))
    } catch {
      // non-blocking
    } finally {
      setIsSubmitting(false)
      handleNext()
    }
  }

  const handleFinish = async () => {
    setIsSubmitting(true)
    try {
      await updateProfile.mutateAsync({ onboarding_completed: true })
    } catch {
      // best effort
    } finally {
      setIsSubmitting(false)
      onComplete()
      navigate('/')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.bienvenido')}
    >
      <div className="max-w-lg w-full mx-auto mt-8 mb-8 bg-[var(--surface)] rounded-2xl shadow-xl overflow-hidden">
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
            return (
              <div key={i} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    isCompleted
                      ? 'bg-[var(--accent)] text-white'
                      : isCurrent
                      ? 'border-2 border-[var(--accent)] text-[var(--accent)]'
                      : 'border-2 border-[var(--border)] text-[var(--text-muted)]'
                  )}
                >
                  {isCompleted ? <CheckCircle size={14} /> : stepNum}
                </div>
                {i < TOTAL_STEPS - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-1',
                      isCompleted ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="px-6 pb-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  {t('onboarding.bienvenido')}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {t('onboarding.subtitulo')}
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-raised)]">
                  <span className="text-2xl" aria-hidden="true">💰</span>
                  <p className="text-sm text-[var(--text-primary)]">
                    Registra ingresos y egresos
                  </p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-raised)]">
                  <Target size={22} className="text-[var(--accent)]" aria-hidden="true" />
                  <p className="text-sm text-[var(--text-primary)]">
                    Establece metas de ahorro
                  </p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-raised)]">
                  <BarChart2 size={22} className="text-[var(--success)]" aria-hidden="true" />
                  <p className="text-sm text-[var(--text-primary)]">
                    Visualiza tu salud financiera
                  </p>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors"
              >
                {t('onboarding.empezar')}
              </button>
            </div>
          )}

          {/* STEP 2 */}
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
                  onClick={handleSkip}
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

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <p className="text-xl font-bold text-[var(--text-primary)] mb-1">
                  {t('onboarding.paso3')}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  Registra tu primer ingreso (opcional)
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <div>
                  <label
                    htmlFor="onboarding-categoria"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                  >
                    Categoria
                  </label>
                  <select
                    id="onboarding-categoria"
                    value={step3Form.categoria_id}
                    onChange={(e) =>
                      setStep3Form((f) => ({ ...f, categoria_id: e.target.value }))
                    }
                    className="finza-input w-full"
                  >
                    <option value="">Selecciona una categoria...</option>
                    {categoriasIngreso.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icono ? `${cat.icono} ` : ''}
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="onboarding-monto"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                  >
                    Monto
                  </label>
                  <input
                    id="onboarding-monto"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={step3Form.monto}
                    onChange={(e) =>
                      setStep3Form((f) => ({ ...f, monto: e.target.value }))
                    }
                    className="finza-input w-full"
                  />
                </div>
                <div>
                  <label
                    htmlFor="onboarding-descripcion"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                  >
                    Descripcion (opcional)
                  </label>
                  <input
                    id="onboarding-descripcion"
                    type="text"
                    placeholder="Ej: Salario quincenal"
                    value={step3Form.descripcion}
                    onChange={(e) =>
                      setStep3Form((f) => ({ ...f, descripcion: e.target.value }))
                    }
                    className="finza-input w-full"
                  />
                </div>
                <div>
                  <label
                    htmlFor="onboarding-fecha"
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                  >
                    Fecha
                  </label>
                  <input
                    id="onboarding-fecha"
                    type="date"
                    value={step3Form.fecha}
                    onChange={(e) =>
                      setStep3Form((f) => ({ ...f, fecha: e.target.value }))
                    }
                    className="finza-input w-full"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)] hover:bg-[var(--surface-raised)] transition-colors"
                >
                  {t('onboarding.omitir')}
                </button>
                <button
                  onClick={handleRegisterIngreso}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--success)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {t('onboarding.registrarIngreso')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
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
                {salario && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle size={14} className="text-[var(--success)]" />
                    <span>Salario configurado: RD$ {parseFloat(salario).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle size={14} className="text-[var(--success)]" />
                  <span>Perfil listo para usar</span>
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
  )
}
