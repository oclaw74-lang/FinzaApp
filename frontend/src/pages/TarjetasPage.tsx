import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Plus, CreditCard, Info, Pencil, Trash2, X, ShoppingCart, CreditCard as PayIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatMoney, formatDate } from '@/lib/utils'
import {
  useTarjetas,
  useCreateTarjeta,
  useUpdateTarjeta,
  useDeleteTarjeta,
} from '@/hooks/useTarjetas'
import {
  useMovimientosTarjeta,
  useRegistrarMovimiento,
  useEliminarMovimiento,
} from '@/hooks/useMovimientosTarjeta'
import { useCategorias } from '@/hooks/useCategorias'
import type { Tarjeta, TarjetaCreate, TarjetaUpdate, MovimientoTarjetaCreate } from '@/types/tarjeta'

// ─── Zod schema ────────────────────────────────────────────────────────────────

const preprocessNumber = (v: unknown) => {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return isNaN(n) ? null : n
}

const TarjetaSchema = z
  .object({
    banco: z.string().min(1, 'Requerido').max(100),
    tipo: z.enum(['credito', 'debito']),
    red: z.enum(['visa', 'mastercard', 'amex', 'discover', 'otro']),
    ultimos_digitos: z
      .string()
      .length(4, 'Debe tener 4 digitos')
      .regex(/^\d{4}$/, 'Solo digitos'),
    saldo_actual: z.coerce.number({ invalid_type_error: 'Ingresa un monto' }).min(0),
    limite_credito: z.preprocess(
      preprocessNumber,
      z.number().positive().nullable().optional(),
    ),
    fecha_corte: z.preprocess(
      preprocessNumber,
      z.number().int().min(1).max(31).nullable().optional(),
    ),
    fecha_pago: z.preprocess(
      preprocessNumber,
      z.number().int().min(1).max(31).nullable().optional(),
    ),
    color: z.string().optional().nullable(),
    activa: z.boolean().default(true),
  })
  .superRefine((val, ctx) => {
    if (val.tipo === 'credito' && (val.limite_credito == null || val.limite_credito <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Requerido para tarjeta de credito',
        path: ['limite_credito'],
      })
    }
  })

type TarjetaFormData = z.infer<typeof TarjetaSchema>

// ─── Card visual component ─────────────────────────────────────────────────────

function getCardGradient(red: Tarjeta['red'], tipo: Tarjeta['tipo'], color: string | null): string {
  if (color) return `linear-gradient(135deg, ${color}dd, ${color}88)`
  if (tipo === 'debito') {
    return 'linear-gradient(135deg, #0e5239 0%, #072b1f 50%, #041610 100%)'
  }
  const gradients: Record<Tarjeta['red'], string> = {
    visa: 'linear-gradient(135deg, #1a3a6b 0%, #0d1e40 50%, #0a1628 100%)',
    mastercard: 'linear-gradient(135deg, #3d1278 0%, #1e0a40 50%, #0f0620 100%)',
    amex: 'linear-gradient(135deg, #0e5239 0%, #072b1f 50%, #041610 100%)',
    discover: 'linear-gradient(135deg, #4a1a00 0%, #2a0e00 50%, #160700 100%)',
    otro: 'linear-gradient(135deg, #3d1278 0%, #1e0a40 50%, #0f0620 100%)',
  }
  return gradients[red]
}

interface CardVisualProps {
  tarjeta: Tarjeta
  onClick?: () => void
}

function CardVisual({ tarjeta, onClick }: CardVisualProps): JSX.Element {
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(v)

  const isCredit = tarjeta.tipo === 'credito'
  const disponible = isCredit
    ? (tarjeta.limite_credito ?? 0) - tarjeta.saldo_actual
    : tarjeta.saldo_actual
  const pct = tarjeta.limite_credito
    ? Math.min(100, (tarjeta.saldo_actual / tarjeta.limite_credito) * 100)
    : 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full text-white overflow-hidden text-left',
        'transition-all duration-250 ease-out',
        'hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        !tarjeta.activa && 'opacity-60'
      )}
      style={{
        background: getCardGradient(tarjeta.red, tarjeta.tipo, tarjeta.color),
        minHeight: 220,
        borderRadius: '22px',
        padding: '24px 28px 20px',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      aria-label={`Tarjeta ${tarjeta.banco}`}
    >
      {/* Glare overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 20% 30%, rgba(255,255,255,0.14), transparent 60%)',
          borderRadius: '22px',
        }}
        aria-hidden="true"
      />

      {/* Row 1: Chip (izq) + Tipo & Red (der) */}
      <div className="flex items-start justify-between">
        <svg width="38" height="28" viewBox="0 0 40 30" aria-hidden="true">
          <rect x="2" y="2" width="36" height="26" rx="4" fill="#d4a017" stroke="#b8860b" strokeWidth="0.5" />
          <rect x="2" y="11" width="36" height="8" fill="#b8860b" opacity="0.7" />
          <rect x="15" y="2" width="10" height="26" fill="#b8860b" opacity="0.7" />
          <rect x="8" y="2" width="2" height="26" fill="#b8860b" opacity="0.4" />
          <rect x="30" y="2" width="2" height="26" fill="#b8860b" opacity="0.4" />
        </svg>
        <div className="text-right">
          <p className="font-semibold" style={{ fontSize: '11px', opacity: 0.9, letterSpacing: '0.05em' }}>
            {isCredit ? 'Crédito' : 'Débito'}
          </p>
          <p className="uppercase tracking-widest" style={{ fontSize: '10px', opacity: 0.45, marginTop: '2px' }}>
            {tarjeta.red}
          </p>
        </div>
      </div>

      {/* Row 2: Número */}
      <p
        className="font-mono text-white/90"
        style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.2em', marginTop: '4px' }}
      >
        •••• •••• •••• {tarjeta.ultimos_digitos}
      </p>

      {/* Row 3: Banco */}
      <p className="uppercase tracking-widest text-white/50" style={{ fontSize: '10px' }}>
        {tarjeta.banco}
      </p>

      {/* Row 4: Disponible */}
      <div>
        <p className="uppercase text-white/45" style={{ fontSize: '10px', letterSpacing: '0.08em', marginBottom: '2px' }}>
          {isCredit ? 'Disponible' : 'Saldo'}
        </p>
        <p
          className="font-bold tabular-nums"
          style={{
            fontSize: '24px',
            letterSpacing: '-0.03em',
            color: isCredit ? '#00dfa2' : '#e8f0ff',
          }}
        >
          {fmt(disponible)}
        </p>
        {isCredit && tarjeta.limite_credito && (
          <p className="text-white/35" style={{ fontSize: '10px', marginTop: '2px' }}>
            Disponible de {fmt(tarjeta.limite_credito)}
          </p>
        )}
      </div>

      {/* Row 5: Campos Titular / Corte / Saldo */}
      <div className="flex gap-4 mt-auto">
        {tarjeta.titular && (
          <div>
            <p className="text-white/35 uppercase" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>Titular</p>
            <p className="text-white/75 font-medium truncate max-w-[100px]" style={{ fontSize: '11px' }}>{tarjeta.titular}</p>
          </div>
        )}
        {tarjeta.fecha_corte && (
          <div>
            <p className="text-white/35 uppercase" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>Corte</p>
            <p className="text-white/75 font-medium" style={{ fontSize: '11px' }}>Día {tarjeta.fecha_corte}</p>
          </div>
        )}
        {isCredit && (
          <div>
            <p className="text-white/35 uppercase" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>Saldo</p>
            <p className="font-medium tabular-nums" style={{ fontSize: '11px', color: '#ff8080' }}>{fmt(tarjeta.saldo_actual)}</p>
          </div>
        )}
      </div>

      {/* Row 6: Progress bar de utilización (credit only) */}
      {isCredit && tarjeta.limite_credito && (
        <div style={{ marginTop: '4px' }}>
          <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                borderRadius: '2px',
                background: pct > 70 ? '#ff4060' : pct > 40 ? '#ffb340' : '#00dfa2',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div className="flex justify-between text-white/30 mt-1" style={{ fontSize: '9px' }}>
            <span>{pct.toFixed(0)}% utilizado</span>
            <span>{fmt(tarjeta.saldo_actual)} usado</span>
          </div>
        </div>
      )}
    </button>
  )
}

// ─── Utilization bar ───────────────────────────────────────────────────────────

interface UtilizationBarProps {
  saldo: number
  limite: number
}

function UtilizationBar({ saldo, limite }: UtilizationBarProps): JSX.Element {
  const pct = Math.min((saldo / limite) * 100, 100)
  const colorClass =
    pct > 70 ? 'bg-red-500 dark:bg-finza-red' : pct > 40 ? 'bg-yellow-500 dark:bg-finza-yellow' : 'bg-green-500 dark:bg-finza-green'

  return (
    <div>
      <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>Utilizacion</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn('h-full rounded-full transition-all', colorClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Stats cards ───────────────────────────────────────────────────────────────

interface StatItem {
  label: string
  value: string
}

function StatsGrid({ stats }: { stats: StatItem[] }): JSX.Element {
  const colorMap: Record<string, string> = {
    'Total saldo': 'dark:text-finza-red',
    'Disponible credito': 'dark:text-finza-green',
    'Tarjetas activas': 'dark:text-finza-blue',
  }
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="card-glass p-5">
          <p className="kpi-label dark:text-finza-t2 mb-1">{s.label}</p>
          <p className={`kpi-value mt-2 ${colorMap[s.label] ?? ''}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Form modal ────────────────────────────────────────────────────────────────

interface TarjetaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TarjetaFormData) => Promise<void>
  isLoading: boolean
  tarjeta?: Tarjeta
}

function TarjetaModal({ isOpen, onClose, onSubmit, isLoading, tarjeta }: TarjetaModalProps): JSX.Element | null {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TarjetaFormData>({
    resolver: zodResolver(TarjetaSchema),
    defaultValues: tarjeta
      ? {
          banco: tarjeta.banco,
          tipo: tarjeta.tipo,
          red: tarjeta.red,
          ultimos_digitos: tarjeta.ultimos_digitos,
          saldo_actual: tarjeta.saldo_actual,
          limite_credito: tarjeta.limite_credito ?? undefined,
          fecha_corte: tarjeta.fecha_corte ?? undefined,
          fecha_pago: tarjeta.fecha_pago ?? undefined,
          color: tarjeta.color ?? undefined,
          activa: tarjeta.activa,
        }
      : { tipo: 'credito', red: 'visa', activa: true },
  })

  const tipo = watch('tipo')

  const handleClose = (): void => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative bg-white dark:bg-[#0d1520] dark:border dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-base font-semibold text-[var(--text-primary)]">
            {tarjeta ? 'Editar tarjeta' : 'Nueva tarjeta'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Banco */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Banco / Nombre</label>
            <input
              {...register('banco')}
              placeholder="Banco Popular, BHD, etc."
              className="finza-input w-full"
            />
            {errors.banco && <p className="text-xs text-red-500 mt-1">{errors.banco.message}</p>}
          </div>

          {/* Tipo / Red */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Tipo</label>
              <select {...register('tipo')} className="finza-input w-full">
                <option value="credito">Credito</option>
                <option value="debito">Debito</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Red</label>
              <select {...register('red')} className="finza-input w-full">
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">Amex</option>
                <option value="discover">Discover</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Ultimos digitos */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Ultimos 4 digitos</label>
            <input
              {...register('ultimos_digitos')}
              placeholder="1234"
              maxLength={4}
              className="finza-input w-full"
            />
            {errors.ultimos_digitos && (
              <p className="text-xs text-red-500 mt-1">{errors.ultimos_digitos.message}</p>
            )}
          </div>

          {/* Saldo */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Saldo actual</label>
            <input
              {...register('saldo_actual')}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="finza-input w-full"
            />
            {errors.saldo_actual && (
              <p className="text-xs text-red-500 mt-1">{errors.saldo_actual.message}</p>
            )}
          </div>

          {/* Limite credito — solo para credito */}
          {tipo === 'credito' && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Limite de credito</label>
              <input
                {...register('limite_credito')}
                type="number"
                step="0.01"
                min="0"
                placeholder="50000.00"
                className="finza-input w-full"
              />
              {errors.limite_credito && (
                <p className="text-xs text-red-500 mt-1">{errors.limite_credito.message}</p>
              )}
            </div>
          )}

          {/* Fechas corte / pago */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Dia de corte</label>
              <input
                {...register('fecha_corte')}
                type="number"
                min="1"
                max="31"
                placeholder="15"
                className="finza-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Dia de pago</label>
              <input
                {...register('fecha_pago')}
                type="number"
                min="1"
                max="31"
                placeholder="5"
                className="finza-input w-full"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Color (opcional)</label>
            <input
              {...register('color')}
              type="color"
              className="h-9 w-full rounded-lg border border-[var(--border)] cursor-pointer bg-transparent"
            />
          </div>

          {/* Activa */}
          <div className="flex items-center gap-2">
            <input
              {...register('activa')}
              id="activa-check"
              type="checkbox"
              className="rounded"
            />
            <label htmlFor="activa-check" className="text-sm text-[var(--text-primary)]">Tarjeta activa</label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Guardando...' : tarjeta ? 'Actualizar' : 'Crear tarjeta'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ─── Movimiento modal ──────────────────────────────────────────────────────────

const MovimientoSchema = z.object({
  tipo: z.enum(['compra', 'pago']),
  monto: z.coerce.number({ invalid_type_error: 'Ingresa un monto' }).positive('Debe ser mayor a 0'),
  descripcion: z.string().optional(),
  fecha: z.string().min(1, 'La fecha es requerida'),
  categoria_id: z.string().optional(),
  notas: z.string().optional(),
})

type MovimientoFormData = z.infer<typeof MovimientoSchema>

interface MovimientoModalProps {
  tarjetaId: string
  tipoInicial: 'compra' | 'pago'
  onClose: () => void
}

function MovimientoModal({ tarjetaId, tipoInicial, onClose }: MovimientoModalProps): JSX.Element {
  const registrar = useRegistrarMovimiento(tarjetaId)
  const { data: todasCategorias = [] } = useCategorias()
  const categoriasEgreso = todasCategorias.filter((c) => c.tipo === 'egreso' || c.tipo === 'ambos')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MovimientoFormData>({
    resolver: zodResolver(MovimientoSchema),
    defaultValues: {
      tipo: tipoInicial,
      fecha: new Date().toISOString().split('T')[0],
    },
  })

  const tipo = watch('tipo')

  const onSubmit = async (data: MovimientoFormData): Promise<void> => {
    try {
      const payload: MovimientoTarjetaCreate = {
        tipo: data.tipo,
        monto: data.monto,
        fecha: data.fecha,
        descripcion: data.descripcion || undefined,
        notas: data.notas || undefined,
        categoria_id: data.tipo === 'compra' ? data.categoria_id : undefined,
      }
      await registrar.mutateAsync(payload)
      toast.success(data.tipo === 'compra' ? 'Compra registrada' : 'Pago registrado')
      onClose()
    } catch {
      toast.error('Error al registrar movimiento')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mov-modal-title"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white dark:bg-[#0d1520] dark:border dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 id="mov-modal-title" className="text-base font-semibold text-[var(--text-primary)]">
            Registrar movimiento
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Tipo</label>
            <select {...register('tipo')} className="finza-input w-full">
              <option value="compra">Compra</option>
              <option value="pago">Pago</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Monto</label>
            <input
              {...register('monto')}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="finza-input w-full"
            />
            {errors.monto && <p className="text-xs text-red-500 mt-1">{errors.monto.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Fecha</label>
            <input {...register('fecha')} type="date" className="finza-input w-full" />
            {errors.fecha && <p className="text-xs text-red-500 mt-1">{errors.fecha.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Descripcion (opcional)
            </label>
            <input
              {...register('descripcion')}
              type="text"
              placeholder="Ej: Supermercado, Pago minimo..."
              className="finza-input w-full"
            />
          </div>

          {tipo === 'compra' && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Categoria (opcional)
              </label>
              <select {...register('categoria_id')} className="finza-input w-full">
                <option value="">Sin categoria</option>
                {categoriasEgreso.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Notas (opcional)
            </label>
            <textarea
              {...register('notas')}
              rows={2}
              placeholder="Notas adicionales..."
              className="finza-input w-full resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={registrar.isPending} className="flex-1">
              {registrar.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ─── Detail modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
  tarjeta: Tarjeta
  onClose: () => void
  onEdit: (t: Tarjeta) => void
  onDelete: (id: string) => void
}

type MovimientoTab = 'todos' | 'compra' | 'pago'

function getNextDayOfMonth(day: number): string {
  const now = new Date()
  const candidate = new Date(now.getFullYear(), now.getMonth(), day)
  if (candidate <= now) {
    candidate.setMonth(candidate.getMonth() + 1)
  }
  return candidate.toLocaleDateString('es-DO', { day: 'numeric', month: 'long' })
}

function DetailModal({ tarjeta, onClose, onEdit, onDelete }: DetailModalProps): JSX.Element {
  const fmt = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 })
  const [movTab, setMovTab] = useState<MovimientoTab>('todos')
  const [movModalTipo, setMovModalTipo] = useState<'compra' | 'pago' | null>(null)

  const tabFiltro = movTab === 'todos' ? undefined : movTab
  const { data: movimientos = [], isLoading: loadingMovs } = useMovimientosTarjeta(tarjeta.id, tabFiltro)
  const eliminarMovimiento = useEliminarMovimiento(tarjeta.id)

  const handleEliminar = async (movimientoId: string): Promise<void> => {
    if (!window.confirm('Eliminar este movimiento?')) return
    try {
      await eliminarMovimiento.mutateAsync(movimientoId)
      toast.success('Movimiento eliminado')
    } catch {
      toast.error('Error al eliminar movimiento')
    }
  }

  return (
    <>
      {createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle ${tarjeta.banco}`}
        >
          <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
          <div className="relative bg-white dark:bg-[#0d1520] dark:border dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{tarjeta.banco}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <CardVisual tarjeta={tarjeta} />

              {/* Resumen financiero */}
              <div className="space-y-2 text-sm">
                {tarjeta.tipo === 'credito' ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[var(--surface-raised)] rounded-xl p-3 text-center">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Deuda</p>
                      <p className="text-sm font-bold text-red-500 dark:text-finza-red tabular-nums">
                        {fmt.format(tarjeta.saldo_actual)}
                      </p>
                    </div>
                    <div className="bg-[var(--surface-raised)] rounded-xl p-3 text-center">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Disponible</p>
                      <p className="text-sm font-bold text-green-500 dark:text-finza-green tabular-nums">
                        {fmt.format(tarjeta.disponible ?? 0)}
                      </p>
                    </div>
                    <div className="bg-[var(--surface-raised)] rounded-xl p-3 text-center">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Limite</p>
                      <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                        {fmt.format(tarjeta.limite_credito ?? 0)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[var(--surface-raised)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Saldo disponible</p>
                    <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                      {fmt.format(tarjeta.saldo_actual)}
                    </p>
                  </div>
                )}

                {tarjeta.tipo === 'credito' && tarjeta.limite_credito && (
                  <UtilizationBar saldo={tarjeta.saldo_actual} limite={tarjeta.limite_credito} />
                )}

                <div className="flex gap-3 pt-1 text-xs text-[var(--text-muted)]">
                  {tarjeta.fecha_corte && (
                    <span>Corte: dia {tarjeta.fecha_corte} ({getNextDayOfMonth(tarjeta.fecha_corte)})</span>
                  )}
                  {tarjeta.fecha_pago && (
                    <span>Pago: dia {tarjeta.fecha_pago} ({getNextDayOfMonth(tarjeta.fecha_pago)})</span>
                  )}
                </div>
              </div>

              {/* Botones de accion rapida */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 gap-1"
                  onClick={() => setMovModalTipo('compra')}
                >
                  <ShoppingCart size={14} />
                  + Registrar compra
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  className="flex-1 gap-1"
                  onClick={() => setMovModalTipo('pago')}
                >
                  <PayIcon size={14} />
                  Registrar pago
                </Button>
              </div>

              {/* Historial de movimientos */}
              <div>
                <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Movimientos</p>

                {/* Tabs */}
                <div className="flex gap-1 mb-3 bg-[var(--surface-raised)] rounded-lg p-1" role="tablist">
                  {(['todos', 'compra', 'pago'] as MovimientoTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={movTab === tab}
                      onClick={() => setMovTab(tab)}
                      className={cn(
                        'flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors',
                        movTab === tab
                          ? 'bg-white dark:bg-[#1a2535] text-[var(--text-primary)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      {tab === 'todos' ? 'Todos' : tab === 'compra' ? 'Compras' : 'Pagos'}
                    </button>
                  ))}
                </div>

                {/* Lista */}
                {loadingMovs ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : movimientos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-[var(--text-muted)]">Sin movimientos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {movimientos.map((mov) => (
                      <div
                        key={mov.id}
                        className="flex items-center justify-between py-2 px-3 bg-[var(--surface-raised)] rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base" aria-hidden="true">
                            {mov.tipo === 'compra' ? '🛒' : '💳'}
                          </span>
                          <div>
                            <p className="text-xs font-medium text-[var(--text-primary)] leading-tight">
                              {mov.descripcion ?? (mov.tipo === 'compra' ? 'Compra' : 'Pago')}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {formatDate(mov.fecha)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-sm font-bold tabular-nums',
                              mov.tipo === 'compra'
                                ? 'text-red-500 dark:text-finza-red'
                                : 'text-green-500 dark:text-finza-green'
                            )}
                          >
                            {mov.tipo === 'compra' ? '-' : '+'}
                            {formatMoney(mov.monto)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEliminar(mov.id)}
                            className="text-[var(--text-subtle)] hover:text-red-500 transition-colors"
                            aria-label="Eliminar movimiento"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => { onClose(); onEdit(tarjeta) }}
                >
                  <Pencil size={14} />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => onDelete(tarjeta.id)}
                >
                  <Trash2 size={14} />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {movModalTipo && (
        <MovimientoModal
          tarjetaId={tarjeta.id}
          tipoInicial={movModalTipo}
          onClose={() => setMovModalTipo(null)}
        />
      )}
    </>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CreditCard size={44} className="text-[var(--text-muted)] opacity-30 mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-[var(--text-primary)]">Sin tarjetas registradas</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">Agrega tu primera tarjeta para hacer seguimiento</p>
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton(): JSX.Element {
  return <Skeleton className="w-full rounded-2xl h-[180px]" />
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function TarjetasPage(): JSX.Element {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tarjetaEditando, setTarjetaEditando] = useState<Tarjeta | null>(null)
  const [tarjetaDetalle, setTarjetaDetalle] = useState<Tarjeta | null>(null)

  const { data: tarjetas = [], isLoading, isError } = useTarjetas()
  const createTarjeta = useCreateTarjeta()
  const updateTarjeta = useUpdateTarjeta()
  const deleteTarjeta = useDeleteTarjeta()

  const activas = tarjetas.filter((t) => t.activa)
  const totalSaldo = activas.reduce((sum, t) => sum + t.saldo_actual, 0)
  const totalDisponible = activas
    .filter((t) => t.tipo === 'credito' && t.disponible !== null)
    .reduce((sum, t) => sum + (t.disponible ?? 0), 0)

  const fmt = (n: number): string =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n)

  const stats = [
    { label: 'Total saldo', value: fmt(totalSaldo) },
    { label: 'Disponible credito', value: fmt(totalDisponible) },
    { label: 'Tarjetas activas', value: String(activas.length) },
  ]

  const credito = tarjetas.filter((t) => t.tipo === 'credito')
  const debito = tarjetas.filter((t) => t.tipo === 'debito')

  const handleCreate = async (data: TarjetaFormData): Promise<void> => {
    try {
      const payload: TarjetaCreate = {
        ...data,
        limite_credito: data.limite_credito ?? null,
        fecha_corte: data.fecha_corte ?? null,
        fecha_pago: data.fecha_pago ?? null,
        color: data.color ?? null,
      }
      await createTarjeta.mutateAsync(payload)
      setIsModalOpen(false)
      toast.success('Tarjeta creada')
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleEdit = async (data: TarjetaFormData): Promise<void> => {
    if (!tarjetaEditando) return
    try {
      const payload: { id: string } & TarjetaUpdate = {
        id: tarjetaEditando.id,
        ...data,
        limite_credito: data.limite_credito ?? null,
        fecha_corte: data.fecha_corte ?? null,
        fecha_pago: data.fecha_pago ?? null,
        color: data.color ?? null,
      }
      await updateTarjeta.mutateAsync(payload)
      setTarjetaEditando(null)
      toast.success('Tarjeta actualizada')
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Eliminar esta tarjeta?')) return
    try {
      await deleteTarjeta.mutateAsync(id)
      setTarjetaDetalle(null)
      toast.success('Tarjeta eliminada')
    } catch {
      toast.error(t('common.error'))
    }
  }

  const renderCardSection = (list: Tarjeta[], title: string): JSX.Element => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex flex-col gap-4 max-w-[520px] mx-auto">
        {list.map((tarjeta) => (
          <div key={tarjeta.id} className="relative group">
            <CardVisual tarjeta={tarjeta} onClick={() => setTarjetaDetalle(tarjeta)} />
            <button
              type="button"
              onClick={() => setTarjetaDetalle(tarjeta)}
              className="absolute top-3 right-14 p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Ver detalle"
            >
              <Info size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title-premium dark:text-[#e8f0ff]">{t('nav.tarjetas')}</h1>
          <p className="text-sm dark:text-finza-t2 mt-1">Gestiona tus tarjetas de credito y debito</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="default"
          className="dark:bg-finza-blue dark:hover:bg-finza-blue/80">
          <Plus size={16} className="mr-1" />
          Nueva tarjeta
        </Button>
      </div>

      {/* Stats */}
      <StatsGrid stats={stats} />

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Cargando tarjetas">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">
          El servidor no esta disponible. La lista se mostrara cuando el backend responda.
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && tarjetas.length === 0 && <EmptyState />}

      {/* Card sections */}
      {!isLoading && !isError && tarjetas.length > 0 && (
        <>
          {credito.length > 0 && renderCardSection(credito, 'Credito')}
          {debito.length > 0 && renderCardSection(debito, 'Debito')}
        </>
      )}

      {/* Create modal */}
      <TarjetaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createTarjeta.isPending}
      />

      {/* Edit modal */}
      {tarjetaEditando && (
        <TarjetaModal
          isOpen={true}
          onClose={() => setTarjetaEditando(null)}
          onSubmit={handleEdit}
          isLoading={updateTarjeta.isPending}
          tarjeta={tarjetaEditando}
        />
      )}

      {/* Detail modal */}
      {tarjetaDetalle && (
        <DetailModal
          tarjeta={tarjetaDetalle}
          onClose={() => setTarjetaDetalle(null)}
          onEdit={(t) => setTarjetaEditando(t)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
