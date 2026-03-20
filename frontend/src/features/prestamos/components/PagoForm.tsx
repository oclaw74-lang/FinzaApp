import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PagoFormProps {
  montoPendiente: number
  onSubmit: (data: PagoFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function buildPagoSchema(montoPendiente: number) {
  return z.object({
    monto: z
      .number({ invalid_type_error: 'Ingresa un monto valido' })
      .positive('El monto debe ser mayor a 0')
      .max(montoPendiente, `El monto no puede superar el pendiente (${montoPendiente})`),
    fecha: z.string().min(1, 'La fecha es requerida'),
    notas: z.string().optional(),
  })
}

export type PagoFormData = {
  monto: number
  fecha: string
  notas?: string
}

export function PagoForm({ montoPendiente, onSubmit, onCancel, isLoading }: PagoFormProps): JSX.Element {
  const { t } = useTranslation()
  const schema = buildPagoSchema(montoPendiente)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PagoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
    },
  })

  const handleFormSubmit = handleSubmit((data) => onSubmit(data))

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      <Input
        label={t('prestamos.pago.monto')}
        type="number"
        step="0.01"
        placeholder="0.00"
        error={errors.monto?.message}
        {...register('monto', { valueAsNumber: true })}
      />
      <p className="text-xs text-[var(--text-muted)] -mt-2">
        {t('prestamos.pago.maximo', { monto: (montoPendiente ?? 0).toFixed(2) })}
      </p>

      <Input
        label={t('common.date')}
        type="date"
        error={errors.fecha?.message}
        {...register('fecha')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notas-pago" className="text-sm font-medium text-[var(--text-primary)]">
          {t('prestamos.pago.notas')}
        </label>
        <textarea
          id="notas-pago"
          {...register('notas')}
          rows={2}
          placeholder={t('prestamos.pago.notasPlaceholder')}
          className="finza-input w-full resize-none"
        />
      </div>

      <div className="flex gap-3 justify-end mt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="success" isLoading={isLoading}>
          {t('prestamos.pago.registrar')}
        </Button>
      </div>
    </form>
  )
}

