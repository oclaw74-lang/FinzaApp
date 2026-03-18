import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'

const resetSchema = z
  .object({
    password: z.string().min(8, 'Minimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

type ResetForm = z.infer<typeof resetSchema>

export function ResetPasswordPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    // Supabase envía el token en el hash — onAuthStateChange detecta PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  const onSubmit = async (data: ResetForm): Promise<void> => {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError(error.message)
      return
    }
    toast.success(t('auth.passwordChanged'))
    navigate('/login')
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('auth.resetTitle')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t('auth.resetSubtitle')}</p>
        </div>

        <div className="finza-card space-y-4">
          {!ready && (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--text-muted)]">{t('common.loading')}</p>
            </div>
          )}

          {ready && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label={t('auth.newPassword')}
                type="password"
                placeholder="Minimo 8 caracteres"
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                placeholder="Repite tu contrasena"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              {serverError && (
                <p className="text-sm text-alert-red bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  {serverError}
                </p>
              )}

              <Button type="submit" isLoading={isSubmitting} className="w-full">
                {t('auth.resetPassword')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
