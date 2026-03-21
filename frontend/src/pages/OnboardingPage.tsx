import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Globe, DollarSign, CheckCircle, Sparkles, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateProfile } from '@/hooks/useProfile'
import { usePaises } from '@/hooks/useCatalogos'
import { useCreateTarjeta } from '@/hooks/useTarjetas'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { RedTarjeta, Tarjeta } from '@/types/tarjeta'

const TOTAL_STEPS = 4

interface DebitCardForm {
  banco: string
  ultimos_digitos: string
  red: RedTarjeta
  saldo_actual: string
}

interface DebitCardFormErrors {
  banco?: string
  ultimos_digitos?: string
  saldo_actual?: string
}

const DEFAULT_CARD_FORM: DebitCardForm = {
  banco: '',
  ultimos_digitos: '',
  red: 'visa',
  saldo_actual: '',
}

export function OnboardingPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const updateProfile = useUpdateProfile()
  const createTarjeta = useCreateTarjeta()
  const { data: paises = [], isLoading: paisesLoading } = usePaises()

  const [step, setStep] = useState(1)
  const [selectedPais, setSelectedPais] = useState('DO')
  const [salario, setSalario] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debit card step state
  const [cardForm, setCardForm] = useState<DebitCardForm>(DEFAULT_CARD_FORM)
  const [addedCards, setAddedCards] = useState<Tarjeta[]>([])
  const [cardError, setCardError] = useState('')
  const [formErrors, setFormErrors] = useState<DebitCardFormErrors>({})

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

  const validateCardForm = (): boolean => {
    const errors: DebitCardFormErrors = {}
    if (!cardForm.banco.trim()) {
      errors.banco = 'Requerido'
    }
    if (!/^\d{4}$/.test(cardForm.ultimos_digitos)) {
      errors.ultimos_digitos = 'Debe tener 4 dígitos'
    }
    const saldo = parseFloat(cardForm.saldo_actual)
    if (cardForm.saldo_actual === '' || isNaN(saldo) || saldo < 0) {
      errors.saldo_actual = 'Ingresa un monto válido'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddCard = async () => {
    if (!validateCardForm()) return
    setCardError('')
    try {
      const card = await createTarjeta.mutateAsync({
        banco: cardForm.banco.trim(),
        tipo: 'debito',
        red: cardForm.red,
        ultimos_digitos: cardForm.ultimos_digitos,
        saldo_actual: parseFloat(cardForm.saldo_actual),
      })
      setAddedCards((prev) => [...prev, card])
      setCardForm(DEFAULT_CARD_FORM)
      setFormErrors({})
    } catch {
      setCardError(t('onboarding.tarjetaError'))
    }
  }

  const handleContinueFromCard = () => {
    if (addedCards.length === 0) {
      setCardError(t('onboarding.tarjetaRequerida'))
      return
    }
    setCardError('')
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

  const stepIcons = [Globe, DollarSign, CreditCard, CheckCircle]

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

            {/* STEP 3 — Tarjeta de débito */}
            {step === 3 && (
              <div className="animate-fade-in">
                <div className="text-center mb-5">
                  <CreditCard
                    size={32}
                    className="text-[var(--accent)] mx-auto mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-xl font-bold text-[var(--text-primary)] mb-1">
                    {t('onboarding.tarjetaDebito')}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {t('onboarding.tarjetaDebitoSubtitulo')}
                  </p>
                </div>

                {/* Added cards list */}
                {addedCards.length > 0 && (
                  <div className="space-y-2 mb-4" aria-label="Tarjetas agregadas">
                    {addedCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--success-muted)] border border-[var(--success)]/20"
                      >
                        <CheckCircle
                          size={16}
                          className="text-[var(--success)] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {card.banco}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] ml-2">
                            •••• {card.ultimos_digitos}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] ml-1 uppercase">
                            {card.red}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Card form */}
                <div className="space-y-3 mb-3">
                  {/* Banco */}
                  <div>
                    <label
                      htmlFor="onboarding-banco"
                      className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                    >
                      {t('onboarding.bancoLabel')}
                    </label>
                    <input
                      id="onboarding-banco"
                      type="text"
                      placeholder="Ej: Banco Popular"
                      value={cardForm.banco}
                      onChange={(e) =>
                        setCardForm((f) => ({ ...f, banco: e.target.value }))
                      }
                      className="finza-input w-full"
                    />
                    {formErrors.banco && (
                      <p className="text-xs text-[var(--error)] mt-1" role="alert">
                        {formErrors.banco}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Últimos 4 dígitos */}
                    <div>
                      <label
                        htmlFor="onboarding-digitos"
                        className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                      >
                        {t('onboarding.ultimosDigitosLabel')}
                      </label>
                      <input
                        id="onboarding-digitos"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="1234"
                        value={cardForm.ultimos_digitos}
                        onChange={(e) =>
                          setCardForm((f) => ({
                            ...f,
                            ultimos_digitos: e.target.value.replace(/\D/g, '').slice(0, 4),
                          }))
                        }
                        className="finza-input w-full"
                      />
                      {formErrors.ultimos_digitos && (
                        <p className="text-xs text-[var(--error)] mt-1" role="alert">
                          {formErrors.ultimos_digitos}
                        </p>
                      )}
                    </div>

                    {/* Red */}
                    <div>
                      <label
                        htmlFor="onboarding-red"
                        className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                      >
                        {t('onboarding.redLabel')}
                      </label>
                      <select
                        id="onboarding-red"
                        value={cardForm.red}
                        onChange={(e) =>
                          setCardForm((f) => ({ ...f, red: e.target.value as RedTarjeta }))
                        }
                        className="finza-input w-full"
                      >
                        <option value="visa">VISA</option>
                        <option value="mastercard">MASTERCARD</option>
                        <option value="amex">AMEX</option>
                        <option value="discover">DISCOVER</option>
                        <option value="otro">OTRO</option>
                      </select>
                    </div>
                  </div>

                  {/* Saldo actual */}
                  <div>
                    <label
                      htmlFor="onboarding-saldo"
                      className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                    >
                      {t('onboarding.saldoLabel')}
                    </label>
                    <input
                      id="onboarding-saldo"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={cardForm.saldo_actual}
                      onChange={(e) =>
                        setCardForm((f) => ({ ...f, saldo_actual: e.target.value }))
                      }
                      className="finza-input w-full"
                    />
                    {formErrors.saldo_actual && (
                      <p className="text-xs text-[var(--error)] mt-1" role="alert">
                        {formErrors.saldo_actual}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tipo locked badge */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-raised)] mb-4">
                  <CreditCard size={13} className="text-[var(--text-muted)]" aria-hidden="true" />
                  <span className="text-xs text-[var(--text-muted)]">
                    {t('onboarding.tipoDebitoLocked')}
                  </span>
                </div>

                {/* Global card error */}
                {cardError && (
                  <p
                    className="text-sm text-[var(--error)] mb-3 text-center"
                    role="alert"
                  >
                    {cardError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddCard}
                    disabled={createTarjeta.isPending}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--accent)] text-sm text-[var(--accent)] font-semibold hover:bg-[var(--accent)]/5 transition-colors disabled:opacity-50"
                  >
                    {createTarjeta.isPending
                      ? t('onboarding.agregando')
                      : addedCards.length > 0
                      ? t('onboarding.agregarOtra')
                      : t('onboarding.agregarTarjeta')}
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueFromCard}
                    aria-disabled={addedCards.length === 0}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                      addedCards.length === 0
                        ? 'bg-[var(--accent)]/40 text-white cursor-not-allowed'
                        : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                    )}
                  >
                    {t('onboarding.continuar')}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — Listo */}
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
                  {addedCards.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle size={14} className="text-[var(--success)]" />
                      <span>
                        {addedCards.length === 1
                          ? t('onboarding.tarjetaVinculada')
                          : t('onboarding.tarjetasVinculadas', { count: addedCards.length })}
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
