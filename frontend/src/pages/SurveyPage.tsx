import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Star, Send, MessageSquare, DollarSign, Lightbulb, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'

const surveySchema = z.object({
  usaria_app: z.number().min(1).max(5),
  precio_mensual: z.string().optional(),
  que_mejorar: z.string().optional(),
  que_agregar: z.string().optional(),
  experiencia_general: z.number().min(1).max(5).optional(),
  comentario: z.string().optional(),
  email_contacto: z.string().email().optional().or(z.literal('')),
})

type SurveyForm = z.infer<typeof surveySchema>

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={cn(
                'transition-colors',
                (hover || value) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-[var(--text-muted)] fill-none'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function SurveyPage(): JSX.Element {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)
  const [usariaApp, setUsariaApp] = useState(0)
  const [experiencia, setExperiencia] = useState(0)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<SurveyForm>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      usaria_app: 0,
      experiencia_general: 0,
    },
  })

  const onSubmit = async (data: SurveyForm) => {
    try {
      await apiClient.post('/surveys', {
        ...data,
        usaria_app: usariaApp,
        experiencia_general: experiencia || undefined,
      })
      setSubmitted(true)
      toast.success(t('survey.thanks'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="card-glass rounded-2xl p-8 text-center max-w-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <MessageSquare size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('survey.thanksTitle')}</h2>
          <p className="text-sm text-[var(--text-muted)]">{t('survey.thanksDesc')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('survey.title')}</h1>
        <p className="text-sm text-[var(--text-muted)]">{t('survey.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Rating section */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Star size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">{t('survey.section1')}</h3>
          </div>
          <StarRating
            value={usariaApp}
            onChange={setUsariaApp}
            label={t('survey.usariaApp')}
          />
          <StarRating
            value={experiencia}
            onChange={setExperiencia}
            label={t('survey.experiencia')}
          />
        </div>

        {/* Pricing */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <DollarSign size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">{t('survey.section2')}</h3>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">{t('survey.precio')}</label>
            <select className="finza-input w-full" {...register('precio_mensual')}>
              <option value="">{t('survey.selectOption')}</option>
              <option value="gratis">{t('survey.free')}</option>
              <option value="1-3">$1 - $3 USD</option>
              <option value="3-5">$3 - $5 USD</option>
              <option value="5-10">$5 - $10 USD</option>
              <option value="10+">$10+ USD</option>
            </select>
          </div>
        </div>

        {/* Improvements */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-orange-400">
            <Wrench size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">{t('survey.section3')}</h3>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">{t('survey.queMejorar')}</label>
            <textarea
              className="finza-input w-full min-h-[80px] resize-y"
              placeholder={t('survey.queMejorarPlaceholder')}
              {...register('que_mejorar')}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">{t('survey.queAgregar')}</label>
            <textarea
              className="finza-input w-full min-h-[80px] resize-y"
              placeholder={t('survey.queAgregarPlaceholder')}
              {...register('que_agregar')}
            />
          </div>
        </div>

        {/* Comments */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-purple-400">
            <Lightbulb size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">{t('survey.section4')}</h3>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">{t('survey.comentario')}</label>
            <textarea
              className="finza-input w-full min-h-[80px] resize-y"
              placeholder={t('survey.comentarioPlaceholder')}
              {...register('comentario')}
            />
          </div>
          <Input
            label={t('survey.emailContacto')}
            type="email"
            placeholder="tu@email.com"
            {...register('email_contacto')}
          />
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={usariaApp === 0}
          className="w-full"
        >
          <Send size={16} />
          {t('survey.submit')}
        </Button>
      </form>
    </div>
  )
}
