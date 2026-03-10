import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCategorias } from '@/hooks/useCategorias'

const presupuestoSchema = z.object({
  categoria_id: z.string().min(1, 'Selecciona una categoria'),
  monto_limite: z
    .number({ invalid_type_error: 'Ingresa un monto valido' })
    .positive('El monto limite debe ser mayor a 0'),
})

export type PresupuestoFormData = z.infer<typeof presupuestoSchema>

interface PresupuestoFormProps {
  mes: number
  year: number
  categoriaIdInicial?: string
  montoLimiteInicial?: number
  isEditing?: boolean
  errorMessage?: string | null
  onSubmit: (data: PresupuestoFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function PresupuestoForm({
  mes,
  year,
  categoriaIdInicial,
  montoLimiteInicial,
  isEditing = false,
  errorMessage,
  onSubmit,
  onCancel,
  isLoading,
}: PresupuestoFormProps): JSX.Element {
  const { data: categorias = [], isLoading: loadingCategorias } =
    useCategorias()

  // Solo categorias de egreso o ambos
  const categoriasEgreso = categorias.filter(
    (c) => c.tipo === 'egreso' || c.tipo === 'ambos'
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PresupuestoFormData>({
    resolver: zodResolver(presupuestoSchema),
    defaultValues: {
      categoria_id: categoriaIdInicial ?? '',
      monto_limite: montoLimiteInicial ?? undefined,
    },
  })

  const handleFormSubmit = handleSubmit((data) => onSubmit(data))

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      {/* Periodo — read only */}
      <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-0.5">Mes</p>
          <p className="text-sm font-medium text-gray-800">
            {MESES[mes - 1]}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-0.5">Año</p>
          <p className="text-sm font-medium text-gray-800">{year}</p>
        </div>
      </div>

      {/* Categoria */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="presupuesto-categoria"
          className="text-sm font-medium text-gray-700"
        >
          Categoria
        </label>
        <select
          id="presupuesto-categoria"
          disabled={isEditing || loadingCategorias}
          className="finza-input w-full disabled:opacity-60 disabled:cursor-not-allowed"
          {...register('categoria_id')}
          aria-describedby={
            errors.categoria_id ? 'categoria-error' : undefined
          }
        >
          {loadingCategorias
            ? <option value="">Cargando categorias...</option>
            : <option value="">Selecciona una categoria...</option>
          }
          {!loadingCategorias && categoriasEgreso.length === 0 && (
            <option value="" disabled>No hay categorias de egreso disponibles</option>
          )}
          {categoriasEgreso.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icono ? `${cat.icono} ` : ''}
              {cat.nombre}
            </option>
          ))}
        </select>
        {errors.categoria_id && (
          <p id="categoria-error" className="text-xs text-alert-red">
            {errors.categoria_id.message}
          </p>
        )}
      </div>

      {/* Monto limite */}
      <Input
        label="Monto limite"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        error={errors.monto_limite?.message}
        {...register('monto_limite', { valueAsNumber: true })}
      />

      {/* Error externo (ej: 409) */}
      {errorMessage && (
        <p className="text-xs text-alert-red bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-3 justify-end mt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="default" isLoading={isLoading}>
          {isEditing ? 'Guardar cambios' : 'Crear presupuesto'}
        </Button>
      </div>
    </form>
  )
}
