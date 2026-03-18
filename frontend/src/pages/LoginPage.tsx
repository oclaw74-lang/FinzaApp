import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, TrendingUp, Shield, Zap, Lock, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Seguimiento en tiempo real',
    desc: 'Visualiza tus ingresos y egresos al instante con reportes actualizados.',
  },
  {
    icon: Shield,
    title: 'Privacidad y seguridad',
    desc: 'Tus datos financieros cifrados y protegidos con los mas altos estándares.',
  },
  {
    icon: Zap,
    title: 'Metas inteligentes',
    desc: 'Define objetivos de ahorro y recibe sugerencias para alcanzarlos antes.',
  },
] as const

function BrandPanel(): JSX.Element {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden bg-gradient-to-br from-[#020812] via-[#04080f] to-[#080f1e]">
      {/* Blobs */}
      <div
        className="absolute -top-32 -left-20 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: '#3d8ef8', filter: 'blur(100px)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-15 pointer-events-none"
        style={{ background: '#9768ff', filter: 'blur(80px)' }}
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="flex items-center gap-3 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0d2a52, #1a5cad)' }}
        >
          <img src="/logo.svg" alt="Finza" className="w-7 h-7 object-contain" />
        </div>
        <span className="font-bold text-2xl tracking-tight text-[#e8f0ff]">Finza</span>
      </div>

      {/* Content */}
      <div className="space-y-8 relative z-10">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.06] text-xs text-[#3d8ef8] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3d8ef8] animate-pulse" />
          Finanzas personales con claridad y control
        </div>

        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4 text-[#e8f0ff]">
            Gestiona tus finanzas con claridad total
          </h2>
          <p className="text-[#657a9e] text-base">
            Controla ingresos, egresos, metas y presupuestos — todo en un solo lugar.
          </p>
        </div>

        <div className="space-y-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-8 h-8 bg-[#3d8ef8]/10 border border-[#3d8ef8]/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={15} className="text-[#3d8ef8]" />
              </div>
              <div>
                <p className="text-[#e8f0ff] text-sm font-semibold">{title}</p>
                <p className="text-[#657a9e] text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[#657a9e]/60 text-sm italic relative z-10">
        "Fluye hacia tu libertad financiera"
      </p>
    </div>
  )
}

function LoginFormCard({
  onSubmit,
  serverError,
  showPassword,
  onTogglePassword,
  isSubmitting,
  register,
  errors,
  t,
}: {
  onSubmit: (e: React.FormEvent) => void
  serverError: string | null
  showPassword: boolean
  onTogglePassword: () => void
  isSubmitting: boolean
  register: ReturnType<typeof useForm<LoginForm>>['register']
  errors: ReturnType<typeof useForm<LoginForm>>['formState']['errors']
  t: (key: string) => string
}): JSX.Element {
  return (
    <div className="w-full max-w-md space-y-6">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0d2a52, #1a5cad)' }}
        >
          <img src="/logo.svg" alt="Finza" className="w-6 h-6 object-contain" />
        </div>
        <span className="font-bold text-xl text-[var(--text-primary)]">Finza</span>
      </div>

      {/* Acceso seguro badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: 'rgba(61,142,248,0.1)',
          border: '1px solid rgba(61,142,248,0.2)',
          color: '#3d8ef8',
        }}
      >
        <Lock size={12} />
        Acceso seguro
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] dark:text-[#e8f0ff]">
          Bienvenido de vuelta
        </h1>
        <p className="text-sm text-[var(--text-muted)] dark:text-[#657a9e] mt-1">
          Inicia sesion para continuar gestionando tus finanzas
        </p>
      </div>

      {/* Glass card form */}
      <div className="finza-card dark:card-glass dark:!bg-[rgba(8,15,30,0.7)] dark:!border-white/[0.08] dark:!rounded-2xl dark:!p-8 space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)] dark:text-[#e8f0ff]">
              {t('auth.email')}
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              className="finza-input w-full dark:bg-white/[0.05] dark:border-white/[0.08] dark:text-[#e8f0ff] dark:placeholder:text-[#657a9e] dark:focus:border-[#3d8ef8]/50 dark:rounded-xl"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-alert-red dark:text-[#ff4060]">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-primary)] dark:text-[#e8f0ff]">
                {t('auth.password')}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-finza-blue dark:text-[#3d8ef8] hover:underline"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="finza-input w-full pr-10 dark:bg-white/[0.05] dark:border-white/[0.08] dark:text-[#e8f0ff] dark:placeholder:text-[#657a9e] dark:focus:border-[#3d8ef8]/50 dark:rounded-xl"
                {...register('password')}
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] dark:text-[#657a9e] hover:text-[var(--text-primary)] dark:hover:text-[#e8f0ff]"
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-alert-red dark:text-[#ff4060]">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[var(--border)] dark:border-white/20 accent-[#3d8ef8] cursor-pointer"
                {...register('rememberMe')}
              />
              <span className="text-sm text-[var(--text-muted)] dark:text-[#657a9e]">Recordarme</span>
            </label>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] dark:text-[#657a9e]">
              <CheckCircle2 size={12} className="text-prosperity-green" />
              Sesion protegida
            </div>
          </div>

          {serverError && (
            <p className="text-sm text-alert-red bg-red-50 dark:bg-[#ff4060]/10 border border-red-200 dark:border-[#ff4060]/20 rounded-lg p-3 dark:text-[#ff4060]">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full dark:!bg-gradient-to-r dark:!from-[#3d8ef8] dark:!to-[#9768ff] dark:!rounded-xl dark:!py-3 dark:!font-semibold dark:!text-white dark:!border-0"
          >
            {t('auth.login')}
          </Button>
        </form>

        {/* Social divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border)] dark:bg-white/[0.08]" />
          <span className="text-xs text-[var(--text-muted)] dark:text-[#657a9e] shrink-0">o continua con</span>
          <div className="flex-1 h-px bg-[var(--border)] dark:bg-white/[0.08]" />
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-primary)] dark:text-[#e8f0ff] transition-colors"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
          >
            {/* Google icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-primary)] dark:text-[#e8f0ff] transition-colors"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
          >
            {/* Apple icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
            </svg>
            Apple
          </button>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] dark:text-[#657a9e]">
          {t('auth.noAccount')}{' '}
          <Link
            to="/register"
            className="text-finza-blue dark:text-[#3d8ef8] font-medium hover:underline"
          >
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}

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
    <div className="min-h-screen flex bg-[var(--bg)] dark:bg-[#04080f]">
      <BrandPanel />

      {/* Right form panel */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8 bg-background dark:bg-[#04080f]">
        <LoginFormCard
          onSubmit={handleSubmit(onSubmit)}
          serverError={serverError}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          isSubmitting={isSubmitting}
          register={register}
          errors={errors}
          t={t}
        />
      </div>
    </div>
  )
}
