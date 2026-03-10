import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, TrendingUp, Shield, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage(): JSX.Element {
  const navigate = useNavigate()
  const { session, isLoading, setSession } = useAuthStore()
  const { t } = useTranslation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/', { replace: true })
    }
  }, [session, isLoading, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm): Promise<void> => {
    setServerError(null)
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError(t('auth.invalidCredentials'))
      return
    }

    if (authData.session) {
      setSession(authData.session)
    }
    navigate('/')
  }

  if (!isLoading && session) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f2544] via-[#1a3a6b] to-[#2563eb] flex-col justify-between p-12 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-golden-flow rounded-xl flex items-center justify-center">
            <span className="font-bold text-[#0f2544] text-lg">F</span>
          </div>
          <span className="font-bold text-2xl tracking-tight">Finza</span>
        </div>

        {/* Tagline */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Gestiona tus finanzas con claridad
            </h2>
            <p className="text-white/70 text-lg">
              Controla ingresos, egresos, metas y mas — todo en un solo lugar.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-4">
            {[
              { icon: TrendingUp, text: 'Seguimiento de ingresos y egresos en tiempo real' },
              { icon: Shield, text: 'Tus datos financieros protegidos y privados' },
              { icon: Zap, text: 'Metas de ahorro y presupuestos inteligentes' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-golden-flow" />
                </div>
                <span className="text-white/80 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative quote */}
        <p className="text-white/40 text-sm italic">
          "Fluye hacia tu libertad financiera"
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#0f2544] rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 bg-golden-flow rounded-md flex items-center justify-center">
                <span className="font-bold text-[#0f2544] text-xs">F</span>
              </div>
            </div>
            <span className="font-bold text-xl text-[var(--text-primary)]">Finza</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {t('auth.loginTitle')}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">{t('auth.loginSubtitle')}</p>
          </div>

          <div className="finza-card space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="finza-input w-full"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-alert-red">{errors.email.message}</p>
                )}
              </div>

              {/* Password with show/hide */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    {t('auth.password')}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-finza-blue hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="..."
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

              {serverError && (
                <p className="text-sm text-alert-red bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  {serverError}
                </p>
              )}

              <Button type="submit" isLoading={isSubmitting} className="w-full">
                {t('auth.login')}
              </Button>
            </form>

            <p className="text-center text-sm text-[var(--text-muted)]">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-finza-blue font-medium hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
