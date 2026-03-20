import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Plus, CreditCard, Info, Pencil, Trash2, X, ShoppingCart, CreditCard as PayIcon, Search, Lock, Unlock } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/ui/DatePicker'
import { cn, formatMoney, formatDate } from '@/lib/utils'
import {
  useTarjetas,
  useCreateTarjeta,
  useUpdateTarjeta,
  useDeleteTarjeta,
  useBloquearTarjeta,
} from '@/hooks/useTarjetas'
import {
  useMovimientosTarjeta,
  useRegistrarMovimiento,
  useEliminarMovimiento,
} from '@/hooks/useMovimientosTarjeta'
import { useCategorias } from '@/hooks/useCategorias'
import { useBancos, usePaises } from '@/hooks/useCatalogos'
import { useAuthStore } from '@/store/authStore'
import type { Tarjeta, TarjetaCreate, TarjetaUpdate, MovimientoTarjetaCreate } from '@/types/tarjeta'

// ─── Constants ─────────────────────────────────────────────────────────────────

const CARD_COLORS = [
  { hex: '#1E3A5F', label: 'Navy' },
  { hex: '#366092', label: 'Finza Blue' },
  { hex: '#5B9BD5', label: 'Sky' },
  { hex: '#7C3AED', label: 'Violet' },
  { hex: '#059669', label: 'Emerald' },
  { hex: '#D97706', label: 'Amber' },
  { hex: '#DC2626', label: 'Ruby' },
  { hex: '#1F2937', label: 'Slate' },
]

const REDES_PAGO: { value: Tarjeta['red']; label: string }[] = [
  { value: 'visa', label: 'VISA' },
  { value: 'mastercard', label: 'MASTERCARD' },
  { value: 'amex', label: 'AMEX' },
  { value: 'discover', label: 'DISCOVER' },
  { value: 'otro', label: 'OTRO' },
]

// Pais por defecto — República Dominicana


// ─── Zod schema ────────────────────────────────────────────────────────────────

const preprocessNumber = (v: unknown) => {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return isNaN(n) ? null : n
}

const tarjetaBaseFields = {
  banco: z.string().max(100).default(''),
  banco_id: z.string().optional().nullable(),
  banco_custom: z.string().optional().nullable(),
  tipo: z.enum(['credito', 'debito'] as const),
  red: z.enum(['visa', 'mastercard', 'amex', 'discover', 'otro'] as const),
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
}

// TODO: i18n when zod supports dynamic messages
const TarjetaCreateSchema = z
  .object({ ...tarjetaBaseFields, banco: z.string().min(1, 'Requerido').max(100) })
  .superRefine((val, ctx) => {
    if (val.tipo === 'credito' && (val.limite_credito == null || val.limite_credito <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Requerido para tarjeta de credito', path: ['limite_credito'] })
    }
  })

const TarjetaUpdateSchema = z
  .object(tarjetaBaseFields)
  .superRefine((val, ctx) => {
    if (val.tipo === 'credito' && (val.limite_credito == null || val.limite_credito <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Requerido para tarjeta de credito', path: ['limite_credito'] })
    }
  })

type TarjetaFormData = z.infer<typeof TarjetaCreateSchema>

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

function NetworkLogo({ red }: { red: Tarjeta['red'] }): JSX.Element | null {
  if (red === 'visa') {
    return (
      <svg width="52" height="18" viewBox="0 0 52 18" aria-label="Visa" fill="none">
        <text
          x="2" y="15"
          fontFamily="'Times New Roman', Georgia, serif"
          fontStyle="italic"
          fontWeight="900"
          fontSize="18"
          fill="white"
          letterSpacing="-0.5"
        >VISA</text>
      </svg>
    )
  }
  if (red === 'mastercard') {
    return (
      <svg width="42" height="26" viewBox="0 0 42 26" aria-label="Mastercard">
        <circle cx="15" cy="13" r="13" fill="#EB001B" />
        <circle cx="27" cy="13" r="13" fill="#F79E1B" />
        <path
          d="M21 4.8a13 13 0 0 1 0 16.4A13 13 0 0 1 21 4.8z"
          fill="#FF5F00"
        />
      </svg>
    )
  }
  if (red === 'amex') {
    return (
      <svg width="62" height="30" viewBox="0 0 62 30" aria-label="American Express" fill="none">
        <text
          x="1" y="13"
          fontFamily="'Arial', sans-serif"
          fontWeight="700"
          fontSize="12"
          fill="white"
          letterSpacing="0.5"
        >AMERICAN</text>
        <text
          x="1" y="27"
          fontFamily="'Arial', sans-serif"
          fontWeight="700"
          fontSize="12"
          fill="white"
          letterSpacing="1.5"
        >EXPRESS</text>
      </svg>
    )
  }
  if (red === 'discover') {
    return (
      <svg width="72" height="20" viewBox="0 0 72 20" aria-label="Discover" fill="none">
        <text
          x="1" y="15"
          fontFamily="'Arial', sans-serif"
          fontWeight="700"
          fontSize="13"
          fill="white"
          letterSpacing="0.5"
        >DISCOVER</text>
        <circle cx="66" cy="10" r="9" fill="#F76F20" />
      </svg>
    )
  }
  return null
}

interface CardVisualProps {
  tarjeta: Tarjeta
  onClick?: () => void
}

function CardVisual({ tarjeta, onClick }: CardVisualProps): JSX.Element {
  const { t } = useTranslation()
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

  const isCredit = tarjeta.tipo === 'credito'
  const disponible = isCredit
    ? (tarjeta.limite_credito ?? 0) - tarjeta.saldo_actual
    : tarjeta.saldo_actual
  const pct = tarjeta.limite_credito
    ? Math.min(100, (tarjeta.saldo_actual / tarjeta.limite_credito) * 100)
    : 0

  // Nombre del banco: preferir banco_custom o nombre del catálogo (banco field)
  const nombreBanco = tarjeta.banco_custom ?? tarjeta.banco

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
      aria-label={`Tarjeta ${nombreBanco}${tarjeta.bloqueada ? ' (bloqueada)' : ''}`}
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

      {/* Bloqueada overlay */}
      {tarjeta.bloqueada && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.45)', borderRadius: '22px' }}
          aria-hidden="true"
        >
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 text-white text-xs font-bold uppercase tracking-widest">
            <Lock size={12} />
            BLOQUEADA
          </span>
        </div>
      )}

      {/* Row 1: Chip (izq) + Red logo (der) */}
      <div className="flex items-start justify-between">
        <svg width="38" height="28" viewBox="0 0 40 30" aria-hidden="true">
          <rect x="2" y="2" width="36" height="26" rx="4" fill="#d4a017" stroke="#b8860b" strokeWidth="0.5" />
          <rect x="2" y="11" width="36" height="8" fill="#b8860b" opacity="0.7" />
          <rect x="15" y="2" width="10" height="26" fill="#b8860b" opacity="0.7" />
          <rect x="8" y="2" width="2" height="26" fill="#b8860b" opacity="0.4" />
          <rect x="30" y="2" width="2" height="26" fill="#b8860b" opacity="0.4" />
        </svg>
        <div className="text-right flex flex-col items-end gap-1">
          <p className="font-semibold" style={{ fontSize: '11px', opacity: 0.9, letterSpacing: '0.05em' }}>
            {isCredit ? t('tarjetas.card.credito') : t('tarjetas.card.debito')}
          </p>
          <NetworkLogo red={tarjeta.red} />
        </div>
      </div>

      {/* Row 2: Numero */}
      <p
        className="font-mono text-white/90"
        style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.2em', marginTop: '4px' }}
      >
        &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {tarjeta.ultimos_digitos}
      </p>

      {/* Row 3: Banco */}
      <p className="uppercase tracking-widest text-white/50" style={{ fontSize: '10px' }}>
        {nombreBanco}
      </p>

      {/* Row 4: Disponible */}
      <div>
        <p className="uppercase text-white/45" style={{ fontSize: '10px', letterSpacing: '0.08em', marginBottom: '2px' }}>
          {isCredit ? t('tarjetas.card.disponible') : t('tarjetas.card.saldo')}
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
            {t('tarjetas.card.disponibleDe', { limite: fmt(tarjeta.limite_credito ?? 0) })}
          </p>
        )}
      </div>

      {/* Row 5: Titular / Corte / Saldo */}
      <div className="flex gap-4 mt-auto">
        {tarjeta.titular && (
          <div>
            <p className="text-white/35 uppercase" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>{t('tarjetas.card.titular')}</p>
            <p className="text-white/75 font-medium truncate max-w-[100px]" style={{ fontSize: '11px' }}>{tarjeta.titular}</p>
          </div>
        )}
        {tarjeta.fecha_corte && (
          <div>
            <p className="text-white/35 uppercase" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>{t('tarjetas.card.corte')}</p>
            <p className="text-white/75 font-medium" style={{ fontSize: '11px' }}>{t('tarjetas.card.diaPrefix', { dia: tarjeta.fecha_corte })}</p>
          </div>
        )}
        {isCredit && (
          <div>
            <p className="text-white/35 uppercase" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>{t('tarjetas.card.saldo')}</p>
            <p className="font-medium tabular-nums" style={{ fontSize: '11px', color: '#ff8080' }}>{fmt(tarjeta.saldo_actual)}</p>
          </div>
        )}
      </div>

      {/* Row 6: Progress bar (credit only) */}
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
            <span>{t('tarjetas.card.utilizado', { pct: pct.toFixed(0) })}</span>
            <span>{t('tarjetas.card.usado', { monto: fmt(tarjeta.saldo_actual) })}</span>
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
  const { t } = useTranslation()
  const pct = Math.min((saldo / limite) * 100, 100)
  const colorClass =
    pct > 70 ? 'bg-red-500 dark:bg-finza-red' : pct > 40 ? 'bg-yellow-500 dark:bg-finza-yellow' : 'bg-green-500 dark:bg-finza-green'

  return (
    <div>
      <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>{t('tarjetas.card.utilizacion')}</span>
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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="card-glass p-3 sm:p-5">
          <p className="kpi-label dark:text-finza-t2 mb-1">{s.label}</p>
          <p className={`kpi-value mt-2`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Bank selector combobox ────────────────────────────────────────────────────

interface BancoSelectorProps {
  paisCodigo: string
  value: { banco_id: string | null; banco_custom: string | null; banco: string }
  onChange: (v: { banco_id: string | null; banco_custom: string | null; banco: string }) => void
}

function BancoSelector({ paisCodigo, value, onChange }: BancoSelectorProps): JSX.Element {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [showOtro, setShowOtro] = useState(value.banco_id === null && !!value.banco_custom)

  const { data: bancos = [], isLoading } = useBancos(paisCodigo)

  const filtered = useMemo(() => {
    if (!search.trim()) return bancos
    const lower = search.toLowerCase()
    return bancos.filter(
      (b) =>
        b.nombre.toLowerCase().includes(lower) ||
        (b.nombre_corto ?? '').toLowerCase().includes(lower)
    )
  }, [bancos, search])

  const handleSelectBanco = (bancoId: string, bancoNombre: string): void => {
    setShowOtro(false)
    onChange({ banco_id: bancoId, banco_custom: null, banco: bancoNombre })
  }

  const handleSelectOtro = (): void => {
    setShowOtro(true)
    onChange({ banco_id: null, banco_custom: value.banco_custom ?? '', banco: value.banco_custom ?? '' })
  }

  const handleCustomChange = (text: string): void => {
    onChange({ banco_id: null, banco_custom: text, banco: text })
  }

  const handleClearBanco = (): void => {
    setSearch('')
    setShowOtro(false)
    onChange({ banco_id: null, banco_custom: null, banco: '' })
  }

  const selectedBanco = value.banco_id ? bancos.find((b) => b.id === value.banco_id) : null

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[var(--text-muted)]">
        {t('tarjetas.form.buscarBanco').replace('...', '')}
      </label>

      {isLoading ? (
        <Skeleton className="h-9 w-full rounded-lg" />
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={t('tarjetas.form.buscarBanco')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="finza-input w-full pl-8"
            />
          </div>

          {/* Selected indicator */}
          {selectedBanco && !showOtro && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)]/10 rounded-lg border border-[var(--accent)]/30">
              {selectedBanco.logo_url && (
                <img src={selectedBanco.logo_url} alt="" className="w-5 h-5 object-contain rounded" aria-hidden="true" />
              )}
              <span className="text-xs font-medium text-[var(--accent)]">
                {selectedBanco.nombre_corto ?? selectedBanco.nombre}
              </span>
              <button
                type="button"
                onClick={handleClearBanco}
                className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Limpiar seleccion"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Bank list — only show when no bank is selected or user is searching */}
          {(!selectedBanco || search.trim()) && !showOtro && (
            <div className="max-h-36 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
              {/* Sin banco asignado option */}
              <button
                type="button"
                onClick={handleClearBanco}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-raised)] transition-colors',
                  !value.banco_id && !value.banco_custom && 'bg-[var(--accent)]/10 text-[var(--accent)]'
                )}
              >
                — Sin banco asignado
              </button>
              {filtered.map((banco) => (
                <button
                  key={banco.id}
                  type="button"
                  onClick={() => {
                    setSearch('')
                    handleSelectBanco(banco.id, banco.nombre)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-raised)] transition-colors flex items-center gap-2',
                    value.banco_id === banco.id && 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  )}
                >
                  {banco.logo_url && (
                    <img src={banco.logo_url} alt="" className="w-5 h-5 object-contain rounded shrink-0" aria-hidden="true" />
                  )}
                  <span className="font-medium">{banco.nombre_corto ?? banco.nombre}</span>
                  {banco.nombre_corto && (
                    <span className="text-[var(--text-muted)] ml-1">{banco.nombre}</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={handleSelectOtro}
                className="w-full text-left px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-raised)] transition-colors italic"
              >
                {t('tarjetas.form.otroBanco')}
              </button>
            </div>
          )}

          {/* Custom bank input */}
          {showOtro && (
            <div className="space-y-1">
              <input
                type="text"
                placeholder={t('tarjetas.form.nombreBanco')}
                value={value.banco_custom ?? ''}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="finza-input w-full"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setShowOtro(false)
                  onChange({ banco_id: null, banco_custom: null, banco: '' })
                }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {t('tarjetas.form.volverLista')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Red selector (pill buttons) ──────────────────────────────────────────────

interface RedSelectorProps {
  value: Tarjeta['red']
  onChange: (v: Tarjeta['red']) => void
}

function RedSelector({ value, onChange }: RedSelectorProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">{t('tarjetas.form.redPago')}</label>
      <div className="flex flex-wrap gap-2">
        {REDES_PAGO.map((red) => (
          <button
            key={red.value}
            type="button"
            onClick={() => onChange(red.value)}
            className={cn(
              'px-3 py-2 rounded-lg border-2 transition-all duration-150 flex items-center justify-center',
              'min-w-[64px] min-h-[36px]',
              value === red.value
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--border)] hover:border-[var(--accent)]/40'
            )}
            aria-pressed={value === red.value}
            aria-label={red.label}
            title={red.label}
          >
            {red.value !== 'otro' ? (
              <span style={{ filter: value === red.value ? 'none' : 'grayscale(0.4) opacity(0.7)' }}>
                <NetworkLogo red={red.value} />
              </span>
            ) : (
              <span className="text-xs font-semibold text-[var(--text-muted)]">OTRO</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Color selector ────────────────────────────────────────────────────────────

interface ColorSelectorProps {
  value: string | null | undefined
  onChange: (color: string | null) => void
}

function ColorSelector({ value, onChange }: ColorSelectorProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
        {t('tarjetas.form.colorTarjeta')}
      </label>
      <div className="flex flex-wrap gap-2">
        {CARD_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            onClick={() => onChange(value === c.hex ? null : c.hex)}
            className={cn(
              'w-7 h-7 rounded-full border-2 transition-all duration-150',
              value === c.hex
                ? 'border-white scale-110 shadow-md'
                : 'border-transparent hover:scale-105'
            )}
            style={{ backgroundColor: c.hex }}
            aria-label={`Color ${c.label}`}
            aria-pressed={value === c.hex}
            title={c.label}
          />
        ))}
        {value && !CARD_COLORS.find((c) => c.hex === value) && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="w-7 h-7 rounded-full border-2 border-white scale-110 shadow-md"
            style={{ backgroundColor: value }}
            aria-label="Color personalizado"
          />
        )}
      </div>
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
  const { user } = useAuthStore()
  const userPais = (user?.user_metadata?.pais_codigo as string | undefined) ?? 'DO'
  const [formPaisCodigo, setFormPaisCodigo] = useState(userPais)
  const { data: paises = [] } = usePaises()
  const isEditing = !!tarjeta
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<TarjetaFormData>({
    resolver: zodResolver(isEditing ? TarjetaUpdateSchema : TarjetaCreateSchema),
    defaultValues: tarjeta
      ? {
          banco: tarjeta.banco,
          banco_id: tarjeta.banco_id ?? null,
          banco_custom: tarjeta.banco_custom ?? null,
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
      : { tipo: 'credito', red: 'visa', activa: true, banco_id: null, banco_custom: null, banco: '' },
  })

  const tipo = watch('tipo')
  const colorValue = watch('color')
  const redValue = watch('red')

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
            {tarjeta ? t('tarjetas.editarTarjeta') : t('tarjetas.nuevaTarjeta')}
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
          {/* País para filtrar bancos */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              {t('tarjetas.form.paisBanco')}
            </label>
            <select
              className="finza-input w-full text-sm"
              value={formPaisCodigo}
              onChange={(e) => {
                setFormPaisCodigo(e.target.value)
                setValue('banco', '', { shouldValidate: false })
                setValue('banco_id', null)
                setValue('banco_custom', null)
              }}
              aria-label="País del banco"
            >
              {paises.length > 0
                ? paises.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.nombre} ({p.moneda_codigo})
                    </option>
                  ))
                : <option value="DO">República Dominicana (DOP)</option>
              }
            </select>
          </div>

          {/* Banco selector */}
          <Controller
            name="banco"
            control={control}
            render={() => (
              <BancoSelector
                paisCodigo={formPaisCodigo}
                value={{
                  banco_id: watch('banco_id') ?? null,
                  banco_custom: watch('banco_custom') ?? null,
                  banco: watch('banco') ?? '',
                }}
                onChange={(v) => {
                  setValue('banco', v.banco, { shouldValidate: true })
                  setValue('banco_id', v.banco_id)
                  setValue('banco_custom', v.banco_custom)
                }}
              />
            )}
          />
          {errors.banco && <p className="text-xs text-red-500 -mt-2">{errors.banco.message}</p>}

          {/* Red de pago */}
          <Controller
            name="red"
            control={control}
            render={({ field }) => (
              <RedSelector value={redValue ?? field.value} onChange={field.onChange} />
            )}
          />

          {/* Color */}
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <ColorSelector
                value={colorValue ?? field.value}
                onChange={field.onChange}
              />
            )}
          />

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('tarjetas.form.tipo')}</label>
            <select {...register('tipo')} className="finza-input w-full">
              <option value="credito">{t('tarjetas.card.credito')}</option>
              <option value="debito">{t('tarjetas.card.debito')}</option>
            </select>
          </div>

          {/* Ultimos digitos */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('tarjetas.form.ultimosDigitos')}</label>
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
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('tarjetas.form.saldoActual')}</label>
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

          {/* Limite credito */}
          {tipo === 'credito' && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('tarjetas.form.limiteCredito')}</label>
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
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('tarjetas.form.diaCorte')}</label>
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
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('tarjetas.form.diaPago')}</label>
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

          {/* Activa */}
          <div className="flex items-center gap-2">
            <input
              {...register('activa')}
              id="activa-check"
              type="checkbox"
              className="rounded"
            />
            <label htmlFor="activa-check" className="text-sm text-[var(--text-primary)]">{t('tarjetas.form.tarjetaActiva')}</label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? t('tarjetas.form.guardando') : tarjeta ? t('tarjetas.form.actualizar') : t('tarjetas.form.crear')}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ─── Movimiento modal ──────────────────────────────────────────────────────────

// TODO: i18n when zod supports dynamic messages
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
  const { t } = useTranslation()
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
      toast.success(data.tipo === 'compra' ? t('tarjetas.compraRegistrada') : t('tarjetas.pagoRegistrado'))
      onClose()
    } catch {
      toast.error(t('tarjetas.errorMovimiento'))
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
            {t('tarjetas.movimiento.titulo')}
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
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('tarjetas.movimiento.tipo')}</label>
            <select {...register('tipo')} className="finza-input w-full">
              <option value="compra">{t('tarjetas.movimiento.compra')}</option>
              <option value="pago">{t('tarjetas.movimiento.pago')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('tarjetas.movimiento.monto')}</label>
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
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{t('tarjetas.movimiento.fecha')}</label>
            <DatePicker
              {...register('fecha')}
              error={errors.fecha?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              {t('tarjetas.movimiento.descripcion')}
            </label>
            <input
              {...register('descripcion')}
              type="text"
              placeholder={t('tarjetas.movimiento.descripcionPlaceholder')}
              className="finza-input w-full"
            />
          </div>

          {tipo === 'compra' && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                {t('tarjetas.movimiento.categoria')}
              </label>
              <select {...register('categoria_id')} className="finza-input w-full">
                <option value="">{t('tarjetas.movimiento.sinCategoria')}</option>
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
              {t('tarjetas.movimiento.notas')}
            </label>
            <textarea
              {...register('notas')}
              rows={2}
              placeholder={t('tarjetas.movimiento.notasPlaceholder')}
              className="finza-input w-full resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={registrar.isPending} className="flex-1">
              {registrar.isPending ? t('tarjetas.movimiento.guardando') : t('tarjetas.movimiento.registrar')}
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
  const { t } = useTranslation()
  const fmt = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const [movTab, setMovTab] = useState<MovimientoTab>('todos')
  const [movModalTipo, setMovModalTipo] = useState<'compra' | 'pago' | null>(null)

  const tabFiltro = movTab === 'todos' ? undefined : movTab
  const { data: movimientos = [], isLoading: loadingMovs } = useMovimientosTarjeta(tarjeta.id, tabFiltro)
  const eliminarMovimiento = useEliminarMovimiento(tarjeta.id)
  const bloquearTarjeta = useBloquearTarjeta()

  const handleEliminar = async (movimientoId: string): Promise<void> => {
    if (!window.confirm(t('tarjetas.deleteMovimiento'))) return
    try {
      await eliminarMovimiento.mutateAsync(movimientoId)
      toast.success(t('tarjetas.movimientoEliminado'))
    } catch {
      toast.error(t('tarjetas.errorEliminar'))
    }
  }

  const handleToggleBloquear = async (): Promise<void> => {
    try {
      await bloquearTarjeta.mutateAsync(tarjeta.id)
      toast.success(tarjeta.bloqueada ? 'Tarjeta desbloqueada' : 'Tarjeta bloqueada')
    } catch {
      toast.error('Error al cambiar estado de bloqueo')
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
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{tarjeta.banco_custom ?? tarjeta.banco}</h2>
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
                      <p className="text-xs text-[var(--text-muted)] mb-1">{t('tarjetas.detalle.deuda')}</p>
                      <p className="text-sm font-bold text-red-500 dark:text-finza-red tabular-nums">
                        {fmt.format(tarjeta.saldo_actual)}
                      </p>
                    </div>
                    <div className="bg-[var(--surface-raised)] rounded-xl p-3 text-center">
                      <p className="text-xs text-[var(--text-muted)] mb-1">{t('tarjetas.detalle.disponible')}</p>
                      <p className="text-sm font-bold text-green-500 dark:text-finza-green tabular-nums">
                        {fmt.format(tarjeta.disponible ?? 0)}
                      </p>
                    </div>
                    <div className="bg-[var(--surface-raised)] rounded-xl p-3 text-center">
                      <p className="text-xs text-[var(--text-muted)] mb-1">{t('tarjetas.detalle.limite')}</p>
                      <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                        {fmt.format(tarjeta.limite_credito ?? 0)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[var(--surface-raised)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-muted)] mb-1">{t('tarjetas.detalle.saldoDisponible')}</p>
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
                    <span>{t('tarjetas.detalle.cortePrefix')} {tarjeta.fecha_corte} ({getNextDayOfMonth(tarjeta.fecha_corte)})</span>
                  )}
                  {tarjeta.fecha_pago && (
                    <span>{t('tarjetas.detalle.pagoPrefix')} {tarjeta.fecha_pago} ({getNextDayOfMonth(tarjeta.fecha_pago)})</span>
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
                  {t('tarjetas.detalle.registrarCompra')}
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  className="flex-1 gap-1"
                  onClick={() => setMovModalTipo('pago')}
                >
                  <PayIcon size={14} />
                  {t('tarjetas.detalle.registrarPago')}
                </Button>
              </div>

              {/* Historial de movimientos */}
              <div>
                <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">{t('tarjetas.detalle.movimientos')}</p>

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
                      {tab === 'todos' ? t('tarjetas.detalle.todos') : tab === 'compra' ? t('tarjetas.detalle.compras') : t('tarjetas.detalle.pagos')}
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
                    <p className="text-xs text-[var(--text-muted)]">{t('tarjetas.sinMovimientos')}</p>
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
                              {mov.descripcion ?? (mov.tipo === 'compra' ? t('tarjetas.movimiento.compra') : t('tarjetas.movimiento.pago'))}
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
                  {t('tarjetas.detalle.editar')}
                </Button>
                <Button
                  variant={tarjeta.bloqueada ? 'default' : 'outline'}
                  className={cn('flex-1 gap-2', tarjeta.bloqueada ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950')}
                  disabled={bloquearTarjeta.isPending}
                  onClick={handleToggleBloquear}
                >
                  {tarjeta.bloqueada ? <Unlock size={14} /> : <Lock size={14} />}
                  {tarjeta.bloqueada ? 'Desbloquear' : 'Bloquear'}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => onDelete(tarjeta.id)}
                >
                  <Trash2 size={14} />
                  {t('tarjetas.detalle.eliminar')}
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
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CreditCard size={44} className="text-[var(--text-muted)] opacity-30 mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-[var(--text-primary)]">{t('tarjetas.sinTarjetas')}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">{t('tarjetas.agregarPrimera')}</p>
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
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  const stats = [
    { label: t('tarjetas.totalSaldo'), value: fmt(totalSaldo) },
    { label: t('tarjetas.disponibleCredito'), value: fmt(totalDisponible) },
    { label: t('tarjetas.tarjetasActivas'), value: String(activas.length) },
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
        banco_id: data.banco_id ?? null,
        banco_custom: data.banco_custom ?? null,
      }
      await createTarjeta.mutateAsync(payload)
      setIsModalOpen(false)
      toast.success(t('tarjetas.created'))
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
        banco_id: data.banco_id ?? null,
        banco_custom: data.banco_custom ?? null,
      }
      // Don't overwrite banco display name with empty string when clearing banco_id
      if (!data.banco?.trim()) {
        delete payload.banco
      }
      await updateTarjeta.mutateAsync(payload)
      setTarjetaEditando(null)
      toast.success(t('tarjetas.updated'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm(t('tarjetas.deleteTarjeta'))) return
    try {
      await deleteTarjeta.mutateAsync(id)
      setTarjetaDetalle(null)
      toast.success(t('tarjetas.deleted'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const renderCardSection = (list: Tarjeta[], title: string): JSX.Element => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide">
        {list.map((tarjeta) => (
          <div key={tarjeta.id} className="snap-center shrink-0 w-80 relative group">
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
          <p className="text-sm text-[var(--text-muted)] mt-1">{t('tarjetas.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="default"
          className="dark:bg-finza-blue dark:hover:bg-finza-blue/80">
          <Plus size={16} className="mr-1" />
          {t('tarjetas.nuevaTarjeta')}
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
          {t('tarjetas.serverError')}
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && tarjetas.length === 0 && <EmptyState />}

      {/* Card sections */}
      {!isLoading && !isError && tarjetas.length > 0 && (
        <>
          {credito.length > 0 && renderCardSection(credito, t('tarjetas.seccion.credito'))}
          {debito.length > 0 && renderCardSection(debito, t('tarjetas.seccion.debito'))}
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
