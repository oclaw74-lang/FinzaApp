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
      <div className="relative z-10">
        <img src="/logo-full.png" alt="Finza" className="h-12 object-contain mb-6" />
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
        <img src="/logo-full.png" alt="Finza" className="h-9 object-contain" />
      </div>

      {/* Glass card form */}
      <div className="finza-card dark:card-glass dark:!bg-[rgba(8,15,30,0.7)] dark:!border-white/[0.08] dark:!rounded-2xl dark:!p-8 space-y-5">
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
