import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'

const forgotSchema = z.object({
  email: z.string().email('Email invalido'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export function ForgotPasswordPage(): JSX.Element {
  const { t } = useTranslation()
  const [state, setState] = useState<'form' | 'sent'>('form')
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = async (data: ForgotForm): Promise<void> => {
    setServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: window.location.origin + '/reset-password',
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setState('sent')
  }

  if (state === 'sent') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md finza-card text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle size={48} className="text-prosperity-green" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('auth.checkEmail')}</h2>
          <p className="text-sm text-[var(--text-muted)]">{t('auth.checkEmailDesc')}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-finza-blue font-medium hover:underline"
          >
            <ArrowLeft size={14} />
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('auth.forgotTitle')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t('auth.forgotSubtitle')}</p>
        </div>

        <div className="finza-card space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            {serverError && (
              <p className="text-sm text-alert-red bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                {serverError}
              </p>
            )}

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              {t('auth.sendResetLink')}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)]">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-finza-blue font-medium hover:underline"
            >
              <ArrowLeft size={14} />
              {t('auth.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
