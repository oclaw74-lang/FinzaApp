import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCategorias } from '@/hooks/useCategorias'

const ingresoSchema = z.object({
  categoria_id: z.string().uuid('Selecciona una categoria'),
  monto: z
    .number({ invalid_type_error: 'Ingresa un monto valido' })
    .positive('El monto debe ser mayor a 0'),
  moneda: z.enum(['DOP', 'USD']).default('DOP'),
  descripcion: z.string().optional(),
  fuente: z.string().optional(),
  fecha: z.string().min(1, 'La fecha es requerida'),
  notas: z.string().optional(),
})

const egresoSchema = z.object({
  categoria_id: z.string().uuid('Selecciona una categoria'),
  monto: z
    .number({ invalid_type_error: 'Ingresa un monto valido' })
    .positive('El monto debe ser mayor a 0'),
  moneda: z.enum(['DOP', 'USD']).default('DOP'),
  descripcion: z.string().optional(),
  metodo_pago: z
    .enum(['efectivo', 'tarjeta', 'transferencia', 'otro'])
    .default('efectivo'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  notas: z.string().optional(),
})

export type IngresoFormData = z.infer<typeof ingresoSchema>
export type EgresoFormData = z.infer<typeof egresoSchema>

interface TransaccionFormProps {
  tipo: 'ingreso' | 'egreso'
  defaultValues?: Partial<IngresoFormData | EgresoFormData>
  onSubmit: (data: IngresoFormData | EgresoFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
}

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro', label: 'Otro' },
]

export function TransaccionForm({
  tipo,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: TransaccionFormProps): JSX.Element {
  const schema = tipo === 'ingreso' ? ingresoSchema : egresoSchema
  const { data: categorias = [], isLoading: loadingCategorias } = useCategorias()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      moneda: 'DOP',
      fecha: new Date().toISOString().split('T')[0],
      ...(tipo === 'egreso' && { metodo_pago: 'efectivo' }),
      ...defaultValues,
    },
  })

  const handleFormSubmit = handleSubmit((data) =>
    onSubmit(data as IngresoFormData | EgresoFormData)
  )

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      {/* Categoria */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoria_id" className="text-sm font-medium text-[var(--text-secondary)]">
          Categoria
        </label>
        <select
          id="categoria_id"
          {...register('categoria_id')}
          className="finza-input w-full"
          disabled={loadingCategorias}
          aria-label="Categoria"
        >
          <option value="">Selecciona una categoria...</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
        {errors.categoria_id && (
          <p className="text-xs text-alert-red" role="alert">
            {errors.categoria_id.message as string}
          </p>
        )}
      </div>

      {/* Monto + Moneda */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Monto"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.monto?.message as string | undefined}
          {...register('monto', { valueAsNumber: true })}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="moneda" className="text-sm font-medium text-[var(--text-secondary)]">
            Moneda
          </label>
          <select id="moneda" {...register('moneda')} className="finza-input w-full" aria-label="Moneda">
            <option value="DOP">DOP</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* Fecha */}
      <Input
        label="Fecha"
        type="date"
        error={errors.fecha?.message as string | undefined}
        {...register('fecha')}
      />

      {/* Descripcion */}
      <Input
        label="Descripcion (opcional)"
        type="text"
        placeholder={
          tipo === 'ingreso' ? 'Ej: Salario quincenal' : 'Ej: Supermercado La Sirena'
        }
        {...register('descripcion')}
      />

      {/* Fuente — solo ingreso */}
      {tipo === 'ingreso' && (
        <Input
          label="Fuente (opcional)"
          type="text"
          placeholder="Ej: Empresa, Cliente..."
          {...(register as (name: string) => object)('fuente')}
        />
      )}

      {/* Metodo de pago — solo egreso */}
      {tipo === 'egreso' && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="metodo_pago" className="text-sm font-medium text-[var(--text-secondary)]">
            Metodo de pago
          </label>
          <select
            id="metodo_pago"
            {...(register as (name: string) => object)('metodo_pago')}
            className="finza-input w-full"
            aria-label="Metodo de pago"
          >
            {METODOS_PAGO.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notas */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notas" className="text-sm font-medium text-[var(--text-secondary)]">
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
        <Button
          type="submit"
          variant={tipo === 'ingreso' ? 'success' : 'default'}
          isLoading={isLoading}
        >
          {submitLabel ?? (tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar egreso')}
        </Button>
      </div>
    </form>
  )
}
