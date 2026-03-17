import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Prestamo } from '@/types/prestamo'

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
          Tipo de prestamo
        </label>
        <select
          id="tipo"
          {...register('tipo')}
          className="finza-input w-full"
          aria-label="Tipo de prestamo"
        >
          <option value="me_deben">Me deben (preste dinero)</option>
          <option value="yo_debo">Yo debo (me prestaron)</option>
        </select>
        {errors.tipo && (
          <p className="text-xs text-alert-red" role="alert">{errors.tipo.message}</p>
        )}
      </div>

      {/* Persona */}
      <Input
        label="Persona"
        type="text"
        placeholder="Nombre de la persona"
        error={errors.persona?.message}
        {...register('persona')}
      />

      {/* Monto + Moneda */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Monto original"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.monto_original?.message}
          {...register('monto_original', { valueAsNumber: true })}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="moneda" className="text-sm font-medium text-gray-700">
            Moneda
          </label>
          <select id="moneda" {...register('moneda')} className="finza-input w-full" aria-label="Moneda">
            <option value="DOP">DOP</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* Fecha prestamo */}
      <Input
        label="Fecha del prestamo"
        type="date"
        error={errors.fecha_prestamo?.message}
        {...register('fecha_prestamo')}
      />

      {/* Fecha vencimiento */}
      <Input
        label="Fecha de vencimiento (opcional)"
        type="date"
        error={errors.fecha_vencimiento?.message}
        {...register('fecha_vencimiento')}
      />

      {/* Descripcion */}
      <Input
        label="Descripcion (opcional)"
        type="text"
        placeholder="Ej: Prestamo para reparar carro"
        {...register('descripcion')}
      />

      {/* Tasa de interes + Plazo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tasa_interes" className="text-sm font-medium text-gray-700">
            Tasa de interes (%)
          </label>
          <Input
            id="tasa_interes"
            type="number"
            step="0.01"
            placeholder="Ej: 18.5"
            error={errors.tasa_interes?.message}
            {...register('tasa_interes', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
          />
          <p className="text-xs text-gray-400">Opcional — tasa anual en %</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="plazo_meses" className="text-sm font-medium text-gray-700">
            Plazo (meses)
          </label>
          <Input
            id="plazo_meses"
            type="number"
            step="1"
            placeholder="Ej: 24"
            error={errors.plazo_meses?.message}
            {...register('plazo_meses', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
          />
          <p className="text-xs text-gray-400">Opcional — numero de cuotas</p>
        </div>
      </div>

      {/* Notas */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notas" className="text-sm font-medium text-gray-700">
          Notas (opcional)
        </label>
        <textarea
          id="notas"
          {...register('notas')}
          rows={2}
          placeholder="Notas adicionales..."
          className="finza-input w-full resize-none"
        />
      </div>

      <div className="flex gap-3 justify-end mt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="default" isLoading={isLoading}>
          Guardar prestamo
        </Button>
      </div>
    </form>
  )
}
