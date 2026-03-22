import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCategorias } from '@/hooks/useCategorias'
import { useDualMoneda } from '@/hooks/useDualMoneda'

const presupuestoSchema = z.object({
  categoria_id: z.string().min(1, 'Selecciona una categoria'),
  monto_limite: z
    .number({ invalid_type_error: 'Ingresa un monto valido' })
    .positive('El monto limite debe ser mayor a 0'),
  moneda: z.string().default('DOP'),
  aplicar_todos_los_meses: z.boolean().default(false),
})

export type PresupuestoFormData = z.infer<typeof presupuestoSchema>

interface PresupuestoFormProps {
  mes: number
  year: number
  categoriaIdInicial?: string
  montoLimiteInicial?: number
  monedaInicial?: string
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
  monedaInicial,
  isEditing = false,
  errorMessage,
  onSubmit,
  onCancel,
  isLoading,
}: PresupuestoFormProps): JSX.Element {
  const { i18n } = useTranslation()
  const getCatNombre = (cat: { nombre: string; nombre_en?: string }) =>
    i18n.language.startsWith('en') && cat.nombre_en ? cat.nombre_en : cat.nombre
  const { data: categorias = [], isLoading: loadingCategorias } =
    useCategorias()

  const { data: dualMoneda } = useDualMoneda()
  const monedaPrincipal = dualMoneda?.moneda_principal ?? 'DOP'
  const monedaSecundaria = dualMoneda?.moneda_secundaria ?? null

  // Solo categorias de egreso o ambos
  const categoriasEgreso = categorias.filter(
    (c) => c.tipo === 'egreso' || c.tipo === 'ambos'
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PresupuestoFormData>({
    resolver: zodResolver(presupuestoSchema),
    defaultValues: {
      categoria_id: categoriaIdInicial ?? '',
      monto_limite: montoLimiteInicial ?? undefined,
      moneda: monedaInicial ?? 'DOP',
      aplicar_todos_los_meses: false,
    },
  })

  const aplicarTodos = watch('aplicar_todos_los_meses')

  const handleFormSubmit = handleSubmit((data) => onSubmit(data))

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      {/* Periodo — read only */}
      <div className="flex gap-2 p-3 bg-[var(--surface-raised)] rounded-lg">
        <div className="flex-1">
          <p className="text-xs text-[var(--text-muted)] mb-0.5">Mes</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {MESES[mes - 1]}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-[var(--text-muted)] mb-0.5">Año</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{year}</p>
        </div>
      </div>

      {/* Categoria */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="presupuesto-categoria"
          className="text-sm font-medium text-[var(--text-secondary)]"
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
              {getCatNombre(cat)}
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

      {/* Moneda — solo si monedaSecundaria existe */}
      {monedaSecundaria && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="presupuesto-moneda"
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            Moneda
          </label>
          <select
            id="presupuesto-moneda"
            className="finza-input w-full"
            {...register('moneda')}
          >
            <option value={monedaPrincipal}>{monedaPrincipal}</option>
            <option value={monedaSecundaria}>{monedaSecundaria}</option>
          </select>
        </div>
      )}

      {/* Aplicar a todos los meses — solo al crear */}
      {!isEditing && (
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              {...register('aplicar_todos_los_meses')}
            />
            <div
              className="w-10 h-[22px] rounded-full transition-colors duration-200"
              style={{
                background: aplicarTodos ? 'var(--accent, #3d8ef8)' : 'rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: aplicarTodos ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Aplicar a todos los meses de {year}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Crea este presupuesto para enero–diciembre {year}
            </p>
          </div>
        </label>
      )}

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