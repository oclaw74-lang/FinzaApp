import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Prestamo } from '@/types/prestamo'
import { useMonedas } from '@/hooks/useCatalogos'

const prestamoSchema = z
  .object({
    tipo: z.enum(['me_deben', 'yo_debo']),
    persona: z.string().min(1, 'El nombre es requerido').max(100, 'Maximo 100 caracteres'),
    monto_original: z
      .number({ invalid_type_error: 'Ingresa un monto valido' })
      .positive('El monto debe ser mayor a 0'),
    moneda: z.string().default('DOP'),
    fecha_prestamo: z.string().min(1, 'La fecha es requerida'),
    fecha_vencimiento: z.string().optional(),
    descripcion: z.string().optional(),
    notas: z.string().optional(),
    tasa_interes: z
      .number({ invalid_type_error: 'Ingresa una tasa valida' })
      .min(0, 'La tasa no puede ser negativa')
      .max(1000, 'La tasa parece demasiado alta')
      .optional()
      .nullable(),
    plazo_meses: z
      .number({ invalid_type_error: 'Ingresa un plazo valido' })
      .int('Debe ser un numero entero')
      .min(1, 'El plazo debe ser al menos 1 mes')
      .max(600, 'El plazo maximo es 600 meses')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (!data.fecha_vencimiento || data.fecha_vencimiento === '') return true
      return data.fecha_vencimiento >= data.fecha_prestamo
    },
    {
      message: 'La fecha de vencimiento debe ser igual o posterior a la fecha del prestamo',
      path: ['fecha_vencimiento'],
    }
  )

export type PrestamoFormData = z.infer<typeof prestamoSchema>

interface PrestamoFormProps {
  defaultValues?: Partial<PrestamoFormData>
  prestamo?: Prestamo
  onSubmit: (data: PrestamoFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function PrestamoForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: PrestamoFormProps): JSX.Element {
  const { t } = useTranslation()
  const { data: monedas = [] } = useMonedas()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrestamoFormData>({
    resolver: zodResolver(prestamoSchema),
    defaultValues: {
      tipo: 'me_deben',
      moneda: 'DOP',
      fecha_prestamo: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  })

  const handleFormSubmit = handleSubmit((data) => onSubmit(data))

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      {/* Tipo */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tipo" className="text-sm font-medium text-gray-700">
          {t('prestamos.form.tipoPrestamo')}
        </label>
        <select
          id="tipo"
          {...register('tipo')}
          className="finza-input w-full"
          aria-label={t('prestamos.form.tipoPrestamo')}
        >
          <option value="me_deben">{t('prestamos.form.meDeben')}</option>
          <option value="yo_debo">{t('prestamos.form.yoDebo')}</option>
        </select>
        {errors.tipo && (
          <p className="text-xs text-alert-red" role="alert">{errors.tipo.message}</p>
        )}
      </div>

      {/* Persona */}
      <Input
        label={t('prestamos.form.persona')}
        type="text"
        placeholder={t('prestamos.form.personaPlaceholder')}
        error={errors.persona?.message}
        {...register('persona')}
      />

      {/* Monto + Moneda */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('prestamos.form.montoOriginal')}
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.monto_original?.message}
          {...register('monto_original', { valueAsNumber: true })}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="moneda" className="text-sm font-medium text-gray-700">
            {t('prestamos.form.moneda')}
          </label>
          <select id="moneda" {...register('moneda')} className="finza-input w-full" aria-label={t('prestamos.form.moneda')}>
            {monedas.length > 0
              ? monedas.map((m) => (
                  <option key={m.codigo} value={m.codigo}>
                    {m.simbolo} {m.codigo} — {m.nombre}
                  </option>
                ))
              : (
                <>
                  <option value="DOP">RD$ DOP — Peso Dominicano</option>
                  <option value="USD">$ USD — Dólar Estadounidense</option>
                </>
              )
            }
          </select>
        </div>
      </div>

      {/* Fecha prestamo */}
      <Input
        label={t('prestamos.form.fechaPrestamo')}
        type="date"
        error={errors.fecha_prestamo?.message}
        {...register('fecha_prestamo')}
      />

      {/* Fecha vencimiento */}
      <Input
        label={t('prestamos.form.fechaVencimiento')}
        type="date"
        error={errors.fecha_vencimiento?.message}
        {...register('fecha_vencimiento')}
      />

      {/* Descripcion */}
      <Input
        label={t('prestamos.form.descripcion')}
        type="text"
        placeholder={t('prestamos.form.descripcionPlaceholder')}
        {...register('descripcion')}
      />

      {/* Tasa de interes + Plazo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tasa_interes" className="text-sm font-medium text-gray-700">
            {t('prestamos.form.tasaInteres')}
          </label>
          <Input
            id="tasa_interes"
            type="number"
            step="0.01"
            placeholder="Ej: 18.5"
            error={errors.tasa_interes?.message}
            {...register('tasa_interes', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
          />
          <p className="text-xs text-gray-400">{t('prestamos.form.tasaInteresHint')}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="plazo_meses" className="text-sm font-medium text-gray-700">
            {t('prestamos.form.plazoMeses')}
          </label>
          <Input
            id="plazo_meses"
            type="number"
            step="1"
            placeholder="Ej: 24"
            error={errors.plazo_meses?.message}
            {...register('plazo_meses', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
          />
          <p className="text-xs text-gray-400">{t('prestamos.form.plazoMesesHint')}</p>
        </div>
      </div>

      {/* Notas */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notas" className="text-sm font-medium text-gray-700">
          {t('prestamos.form.notas')}
        </label>
        <textarea
          id="notas"
          {...register('notas')}
          rows={2}
          placeholder={t('prestamos.form.notasPlaceholder')}
          className="finza-input w-full resize-none"
        />
      </div>

      <div className="flex gap-3 justify-end mt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="default" isLoading={isLoading}>
          {t('prestamos.form.guardar')}
        </Button>
      </div>
    </form>
  )
}

