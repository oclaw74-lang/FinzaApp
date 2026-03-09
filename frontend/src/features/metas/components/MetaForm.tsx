import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MetaAhorro } from '@/types/meta_ahorro'

const metaSchema = z
  .object({
    nombre: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(100, 'Maximo 100 caracteres'),
    descripcion: z.string().optional(),
    monto_objetivo: z
      .number({ invalid_type_error: 'Ingresa un monto valido' })
      .positive('El monto objetivo debe ser mayor a 0'),
    fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
    fecha_objetivo: z.string().optional(),
    color: z.string().optional(),
    icono: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.fecha_objetivo || data.fecha_objetivo === '') return true
      return data.fecha_objetivo >= data.fecha_inicio
    },
    {
      message:
        'La fecha objetivo debe ser igual o posterior a la fecha de inicio',
      path: ['fecha_objetivo'],
    }
  )

export type MetaFormData = z.infer<typeof metaSchema>

interface MetaFormProps {
  meta?: MetaAhorro
  onSubmit: (data: MetaFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function MetaForm({
  meta,
  onSubmit,
  onCancel,
  isLoading,
}: MetaFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      nombre: meta?.nombre ?? '',
      descripcion: meta?.descripcion ?? '',
      monto_objetivo: meta?.monto_objetivo ?? undefined,
      fecha_inicio:
        meta?.fecha_inicio ?? new Date().toISOString().split('T')[0],
      fecha_objetivo: meta?.fecha_objetivo ?? '',
      color: meta?.color ?? '#366092',
      icono: meta?.icono ?? '',
    },
  })

  const handleFormSubmit = handleSubmit((data) => onSubmit(data))

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      {/* Nombre */}
      <Input
        label="Nombre de la meta"
        type="text"
        placeholder="Ej: Fondo de emergencia"
        error={errors.nombre?.message}
        {...register('nombre')}
      />

      {/* Descripcion */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="meta-descripcion"
          className="text-sm font-medium text-gray-700"
        >
          Descripcion (opcional)
        </label>
        <textarea
          id="meta-descripcion"
          {...register('descripcion')}
          rows={2}
          placeholder="Describe el proposito de esta meta..."
          className="finza-input w-full resize-none"
        />
      </div>

      {/* Monto objetivo */}
      <Input
        label="Monto objetivo"
        type="number"
        step="0.01"
        placeholder="0.00"
        error={errors.monto_objetivo?.message}
        {...register('monto_objetivo', { valueAsNumber: true })}
      />

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha de inicio"
          type="date"
          error={errors.fecha_inicio?.message}
          {...register('fecha_inicio')}
        />
        <Input
          label="Fecha objetivo (opcional)"
          type="date"
          error={errors.fecha_objetivo?.message}
          {...register('fecha_objetivo')}
        />
      </div>

      {/* Color e Icono */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="meta-color"
            className="text-sm font-medium text-gray-700"
          >
            Color
          </label>
          <input
            id="meta-color"
            type="color"
            {...register('color')}
            className="h-10 w-full rounded-lg border border-gray-300 cursor-pointer px-1"
            aria-label="Color de la meta"
          />
        </div>
        <Input
          label="Icono (emoji, opcional)"
          type="text"
          placeholder="Ej: 🏦"
          {...register('icono')}
        />
      </div>

      <div className="flex gap-3 justify-end mt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="default" isLoading={isLoading}>
          {meta ? 'Guardar cambios' : 'Crear meta'}
        </Button>
      </div>
    </form>
  )
}
