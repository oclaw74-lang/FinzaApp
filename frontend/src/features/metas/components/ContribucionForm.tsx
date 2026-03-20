import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ContribucionFormProps {
  montoActual: number
  onSubmit: (data: ContribucionFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function buildContribucionSchema(montoActual: number) {
  return z
    .object({
      tipo: z.enum(['deposito', 'retiro']),
      monto: z
        .number({ invalid_type_error: 'Ingresa un monto valido' })
        .positive('El monto debe ser mayor a 0'),
      fecha: z.string().min(1, 'La fecha es requerida'),
      notas: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.tipo === 'retiro' && data.monto > montoActual) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: montoActual,
          type: 'number',
          inclusive: true,
          message: `No puedes retirar mas de lo ahorrado (${(montoActual ?? 0).toFixed(2)})`,
          path: ['monto'],
        })
      }
    })
}

export type ContribucionFormData = {
  tipo: 'deposito' | 'retiro'
  monto: number
  fecha: string
  notas?: string
}

export function ContribucionForm({
  montoActual,
  onSubmit,
  onCancel,
  isLoading,
}: ContribucionFormProps): JSX.Element {
  const { t } = useTranslation()
  const schema = buildContribucionSchema(montoActual)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContribucionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'deposito',
      fecha: new Date().toISOString().split('T')[0],
    },
  })

  const tipoSeleccionado = watch('tipo')
  const handleFormSubmit = handleSubmit((data) => onSubmit(data))

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      {/* Tipo */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contribucion-tipo" className="text-sm font-medium text-gray-700">
          {t('metas.contribucion.tipo')}
        </label>
        <select
          id="contribucion-tipo"
          {...register('tipo')}
          className="finza-input w-full"
          aria-label={t('metas.contribucion.tipoLabel')}
        >
          <option value="deposito">{t('metas.contribucion.deposito')}</option>
          <option value="retiro">{t('metas.contribucion.retiro')}</option>
        </select>
        {errors.tipo && (
          <p className="text-xs text-alert-red" role="alert">
            {errors.tipo.message}
          </p>
        )}
      </div>

      {/* Monto */}
      <div>
        <Input
          label={t('metas.contribucion.monto')}
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.monto?.message}
          {...register('monto', { valueAsNumber: true })}
        />
        {tipoSeleccionado === 'retiro' && (
          <p className="text-xs text-gray-400 mt-1">
            {t('metas.contribucion.maximoRetirar', { monto: (montoActual ?? 0).toFixed(2) })}
          </p>
        )}
      </div>

      {/* Fecha */}
      <Input
        label={t('common.date')}
        type="date"
        error={errors.fecha?.message}
        {...register('fecha')}
      />

      {/* Notas */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="contribucion-notas"
          className="text-sm font-medium text-gray-700"
        >
          {t('metas.contribucion.notas')}
        </label>
        <textarea
          id="contribucion-notas"
          {...register('notas')}
          rows={2}
          placeholder={t('metas.contribucion.notasPlaceholder')}
          className="finza-input w-full resize-none"
        />
      </div>

      <div className="flex gap-3 justify-end mt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant={tipoSeleccionado === 'deposito' ? 'success' : 'default'}
          isLoading={isLoading}
        >
          {tipoSeleccionado === 'deposito' ? t('metas.contribucion.depositar') : t('metas.contribucion.retirar')}
        </Button>
      </div>
    </form>
  )
}

