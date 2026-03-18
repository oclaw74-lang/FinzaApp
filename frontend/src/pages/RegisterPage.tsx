import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'Nombre requerido'),
    lastName: z.string().min(1, 'Apellido requerido'),
    email: z.string().email('Email invalido'),
    password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
    currency: z.string().default('DOP'),
    country: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage(): JSX.Element {
  const { t } = useTranslation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { currency: 'DOP' },
  })

  const onSubmit = async (data: RegisterForm): Promise<void> => {
    setServerError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: `${data.firstName} ${data.lastName}`,
          currency: data.currency,
          country: data.country ?? '',
        },
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md finza-card text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle size={48} className="text-prosperity-green" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('auth.checkEmail')}</h2>
          <p className="text-sm text-[var(--text-muted)]">{t('auth.checkEmailDesc')}</p>
          <Link to="/login" className="text-finza-blue font-medium hover:underline text-sm">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 shrink-0 flex items-center justify-center">
              <img src="/logo.svg" alt="Finza" className="w-full h-full" />
            </div>
            <span className="font-bold text-xl text-[var(--text-primary)]">Finza</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('auth.registerTitle')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t('auth.registerSubtitle')}</p>
        </div>

        <div className="finza-card space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('auth.firstName')}
                placeholder="Juan"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label={t('auth.lastName')}
                placeholder="Perez"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label={t('auth.email')}
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Password with show/hide */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimo 8 caracteres"
                  className="finza-input w-full pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-alert-red">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite tu contrasena"
                  className="finza-input w-full pr-10"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showConfirm ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-alert-red">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                {t('auth.currency')}
              </label>
              <select className="finza-input w-full" {...register('currency')}>
                <option value="DOP">Peso Dominicano (RD$)</option>
                <option value="USD">Dolar Americano ($)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <Input
              label={t('auth.country')}
              placeholder="Republica Dominicana"
              {...register('country')}
            />

            {serverError && (
              <p className="text-sm text-alert-red bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                {serverError}
              </p>
            )}

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              {t('auth.register')}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)]">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-finza-blue font-medium hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
