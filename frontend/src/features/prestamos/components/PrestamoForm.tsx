import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/DatePicker'
import type { Prestamo } from '@/types/prestamo'
import { useMonedas, useBancos } from '@/hooks/useCatalogos'
import { useAuthStore } from '@/store/authStore'

/** Add N months to a 'yyyy-MM-dd' string, clamping the day to the last day of the target month. */
function addMonthsToDateStr(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const targetYear = y + Math.floor((m - 1 + months) / 12)
  const targetMonth = ((m - 1 + months) % 12 + 12) % 12  // 0-based
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  const clampedDay = Math.min(d, lastDay)
  const mm = String(targetMonth + 1).padStart(2, '0')
  const dd = String(clampedDay).padStart(2, '0')
  return `${targetYear}-${mm}-${dd}`
}

/** Returns true if the date string is before the start of the current month */
function isBeforeCurrentMonth(dateStr: string): boolean {
  if (!dateStr) return false
  const [y, m] = dateStr.split('-').map(Number)
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return new Date(y, m - 1, 1) < startOfMonth
}

const prestamoSchema = z
  .object({
    tipo: z.enum(['me_deben', 'yo_debo']),
    acreedor_tipo: z.enum(['persona', 'banco']).default('persona'),
    persona: z.string().max(100, 'Maximo 100 caracteres').optional().default(''),
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
    monto_ya_pagado: z
      .number({ invalid_type_error: 'Ingresa un monto valido' })
      .min(0, 'El monto no puede ser negativo')
      .optional()
      .default(0),
  })
  .refine(
    (data) => data.persona != null && data.persona.trim().length > 0,
    {
      message: 'El acreedor es requerido',
      path: ['persona'],
    }
  )
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
  const { user } = useAuthStore()
  const userPais = (user?.user_metadata?.pais_codigo as string | undefined) ?? 'DO'
  const { data: monedas = [] } = useMonedas()
  const { data: bancos = [] } = useBancos(userPais)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<PrestamoFormData>({
    resolver: zodResolver(prestamoSchema),
    defaultValues: {
      tipo: 'me_deben',
      acreedor_tipo: 'persona',
      moneda: 'DOP',
      fecha_prestamo: new Date().toISOString().split('T')[0],
      monto_ya_pagado: 0,
      ...defaultValues,
    },
  })

  const acreedorTipo = watch('acreedor_tipo')
  const fechaPrestamo = watch('fecha_prestamo')
  const plazoMeses = watch('plazo_meses')
  const showMontoPagado = isBeforeCurrentMonth(fechaPrestamo)

  // Fix #3 — Auto-calculate fecha_vencimiento from fecha_prestamo + plazo_meses
  useEffect(() => {
    if (fechaPrestamo && plazoMeses && plazoMeses > 0) {
      const calculated = addMonthsToDateStr(fechaPrestamo, plazoMeses)
      setValue('fecha_vencimiento', calculated, { shouldValidate: false })
    }
  }, [fechaPrestamo, plazoMeses, setValue])

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

      {/* Fix #1 — Acreedor tipo toggle */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--text-primary)]">Tipo de acreedor</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setValue('acreedor_tipo', 'persona'); setValue('persona', '') }}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors',
              acreedorTipo === 'persona'
                ? 'bg-finza-blue text-white border-finza-blue'
                : 'bg-transparent text-[var(--text-secondary)] border-border hover:bg-gray-50 dark:hover:bg-white/5'
            )}
          >
            Persona
          </button>
          <button
            type="button"
            onClick={() => { setValue('acreedor_tipo', 'banco'); setValue('persona', '') }}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors',
              acreedorTipo === 'banco'
                ? 'bg-finza-blue text-white border-finza-blue'
                : 'bg-transparent text-[var(--text-secondary)] border-border hover:bg-gray-50 dark:hover:bg-white/5'
            )}
          >
            Banco
          </button>
        </div>
        <input type="hidden" {...register('acreedor_tipo')} />
      </div>

      {/* Fix #1 — Conditional acreedor field */}
      {acreedorTipo === 'persona' ? (
        <Input
          label="Nombre del acreedor"
          type="text"
          placeholder="Nombre de la persona"
          error={errors.persona?.message}
          {...register('persona')}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="banco-select" className="text-sm font-medium text-[var(--text-primary)]">
            Banco
          </label>
          <select
            id="banco-select"
            className={cn(
              'finza-input w-full',
              errors.persona && 'border-alert-red focus:ring-alert-red/30 focus:border-alert-red'
            )}
            value={watch('persona') ?? ''}
            onChange={(e) => setValue('persona', e.target.value, { shouldValidate: true })}
            aria-label="Banco"
          >
            <option value="">Selecciona un banco...</option>
            {bancos.map((b) => (
              <option key={b.id} value={b.nombre}>
                {b.nombre}
              </option>
            ))}
          </select>
          {errors.persona && (
            <p className="text-xs text-alert-red" role="alert">{errors.persona.message}</p>
          )}
        </div>
      )}

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

      {/* Fix #2 — DatePicker for fecha_prestamo */}
      <Controller
        name="fecha_prestamo"
        control={control}
        render={({ field }) => (
          <DatePicker
            label="Fecha del prestamo"
            value={field.value}
            onChange={field.onChange}
            error={errors.fecha_prestamo?.message}
          />
        )}
      />

      {/* Fix #2 — DatePicker for fecha_vencimiento (Fix #3: auto-filled) */}
      <Controller
        name="fecha_vencimiento"
        control={control}
        render={({ field }) => (
          <DatePicker
            label="Fecha de vencimiento (opcional)"
            value={field.value}
            onChange={field.onChange}
            error={errors.fecha_vencimiento?.message}
          />
        )}
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

      {/* Fix #4 — monto_ya_pagado for historical loans */}
      {showMontoPagado && (
        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Este préstamo es anterior al mes en curso
          </p>
          <Input
            label="Monto ya pagado"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.monto_ya_pagado?.message}
            {...register('monto_ya_pagado', { valueAsNumber: true })}
          />
          <p className="text-xs text-gray-400">
            Ingresa el monto que ya fue pagado antes de registrar este préstamo
          </p>
        </div>
      )}

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

