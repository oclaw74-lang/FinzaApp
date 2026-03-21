import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Camera, DollarSign, Clock, Tag, Trash2, Plus, Globe, X, AlertTriangle, Zap, Sun, Moon, Monitor } from 'lucide-react'
import * as Icons from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { usePaises, useMonedas } from '@/hooks/useCatalogos'
import {
  useCategorias,
  useCreateCategoria,
  useDeleteCategoria,
} from '@/hooks/useCategorias'
import { useMetas } from '@/hooks/useMetas'
import { useFondoEmergencia } from '@/hooks/useFondoEmergencia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { CategoriaResponse } from '@/types/transacciones'
import type { FrecuenciaPago } from '@/types/profile'

type Tab = 'profile' | 'appearance' | 'security' | 'categorias'

// TODO: i18n when zod supports dynamic messages
const profileSchema = z.object({
  fullName: z.string().min(2, 'Nombre requerido'),
  phone: z.string().optional(),
  currency: z.string(),
  country: z.string().optional(),
})

// TODO: i18n when zod supports dynamic messages
const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Minimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    // TODO: i18n when zod supports dynamic messages
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

// ─── CategoriasTab ─────────────────────────────────────────────────────────────

interface CategoriasTabProps {
  navigate: ReturnType<typeof useNavigate>
}

function getCategoryIcon(icono: string | null): React.FC<{ size?: number; className?: string }> {
  if (!icono) return Tag as React.FC<{ size?: number; className?: string }>
  const IconComp = (Icons as Record<string, unknown>)[icono]
  if (typeof IconComp === 'function') {
    return IconComp as React.FC<{ size?: number; className?: string }>
  }
  return Tag as React.FC<{ size?: number; className?: string }>
}

function getTipoBadge(tipo: CategoriaResponse['tipo'], t: (key: string) => string): JSX.Element {
  const styles: Record<CategoriaResponse['tipo'], string> = {
    ingreso: 'bg-emerald-500/20 text-emerald-400',
    egreso: 'bg-red-500/20 text-red-400',
    ambos: 'bg-blue-500/20 text-blue-400',
  }
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', styles[tipo])}>
      {t(`categorias.${tipo}`)}
    </span>
  )
}

interface NuevaCategoriaFormProps {
  onDone: () => void
}

function NuevaCategoriaForm({ onDone }: NuevaCategoriaFormProps): JSX.Element {
  const { t } = useTranslation()
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'ingreso' | 'egreso' | 'ambos'>('egreso')
  const createCategoria = useCreateCategoria()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!nombre.trim()) return
    try {
      await createCategoria.mutateAsync({ nombre: nombre.trim(), tipo })
      toast.success(t('categorias.created'))
      setNombre('')
      onDone()
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-glass rounded-xl p-4 space-y-3 border border-[var(--border)]">
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{t('categorias.nueva')}</p>
      <div className="flex flex-col xs:flex-row gap-2">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={t('categorias.nombre')}
          className="finza-input flex-1 text-sm"
          autoFocus
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as typeof tipo)}
          className="finza-input text-sm xs:w-auto"
        >
          <option value="egreso">{t('categorias.egreso')}</option>
          <option value="ingreso">{t('categorias.ingreso')}</option>
          <option value="ambos">{t('categorias.ambos')}</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="md" isLoading={createCategoria.isPending} className="flex-1">
          {t('common.save')}
        </Button>
        <Button type="button" size="md" variant="secondary" onClick={onDone} className="flex-1">
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}

function CategoriasTab({ navigate }: CategoriasTabProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const getCatNombre = (cat: { nombre: string; nombre_en?: string }) =>
    i18n.language.startsWith('en') && cat.nombre_en ? cat.nombre_en : cat.nombre
  const { data: categorias = [], isLoading, isError } = useCategorias()
  const deleteCategoria = useDeleteCategoria()
  const [showForm, setShowForm] = useState(false)

  const handleDelete = async (cat: CategoriaResponse): Promise<void> => {
    if (cat.es_sistema) {
      toast.error(t('categorias.systemDeleteError'))
      return
    }
    if (window.confirm(t('categorias.deleteConfirm'))) {
      try {
        await deleteCategoria.mutateAsync(cat.id)
        toast.success(t('categorias.deleted'))
      } catch {
        toast.error(t('categorias.deleteError'))
      }
    }
  }

  return (
    <div className="card-glass p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">{t('categorias.manage')}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {t('categorias.systemNote')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/categorias')}
          >
            {t('common.viewAll')}
          </Button>
          <Button
            variant="default"
            size="md"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} />
            {t('common.new')}
          </Button>
        </div>
      </div>

      {showForm && (
        <NuevaCategoriaForm onDone={() => setShowForm(false)} />
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4">
          {t('categorias.loadError')}
        </p>
      )}

      {!isLoading && !isError && (
        <div className="space-y-1.5">
          {categorias.map((cat) => {
            const IconComp = getCategoryIcon(cat.icono)
            return (
              <div
                key={cat.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-raised)] dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] flex items-center justify-center flex-shrink-0">
                  <IconComp size={15} className="text-[var(--text-muted)]" />
                </div>
                <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{getCatNombre(cat)}</span>
                {getTipoBadge(cat.tipo, t)}
                {cat.es_sistema && (
                  <span className="text-[10px] text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--surface-raised)]">
                    {t('common.system')}
                  </span>
                )}
                {!cat.es_sistema && (
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                    aria-label={`Eliminar ${getCatNombre(cat)}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── PaisModal ─────────────────────────────────────────────────────────────────

interface PaisModalProps {
  currentPaisCodigo: string
  onClose: () => void
  onSave: (paisCodigo: string, monedaCodigo: string, nombrePais: string) => Promise<void>
  isSaving: boolean
}

function PaisModal({ currentPaisCodigo, onClose, onSave, isSaving }: PaisModalProps): JSX.Element {
  const { t } = useTranslation()
  const { data: paises = [], isLoading } = usePaises()
  const [selected, setSelected] = useState(currentPaisCodigo)

  const handleSave = async (): Promise<void> => {
    const pais = paises.find((p) => p.codigo === selected)
    if (!pais) return
    await onSave(pais.codigo, pais.moneda_codigo, pais.nombre)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-[#0d1520] dark:border dark:border-white/[0.08] rounded-xl shadow-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{t('settings.cambiarPais')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {isLoading ? (
            <div className="h-36 flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">{t('settings.cargandoPaises')}</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border border-[var(--border)]">
              {paises.map((pais) => (
                <button
                  key={pais.codigo}
                  type="button"
                  onClick={() => setSelected(pais.codigo)}
                  className={cn(
                    'w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                    selected === pais.codigo
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'hover:bg-[var(--surface-raised)] text-[var(--text-primary)]'
                  )}
                >
                  {pais.bandera_emoji && (
                    <span className="text-lg" aria-hidden="true">{pais.bandera_emoji}</span>
                  )}
                  <span className="flex-1">{pais.nombre}</span>
                  <span className="text-xs text-[var(--text-muted)]">{pais.moneda_codigo}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? t('settings.guardando') : t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export function ConfiguracionPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const { theme, setTheme, language, setLanguage } = useThemeStore()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const [salarioValue, setSalarioValue] = useState('')
  const [mostrarHoras, setMostrarHoras] = useState(false)
  const [paisModalOpen, setPaisModalOpen] = useState(false)
  const [savingPais, setSavingPais] = useState(false)
  // Extended salary fields
  const [salarioBruto, setSalarioBruto] = useState('')
  const [descuentosAdicionales, setDescuentosAdicionales] = useState('')
  const [frecuenciaPago, setFrecuenciaPago] = useState<FrecuenciaPago>('mensual')
  // Auto savings fields
  const [asignacionActiva, setAsignacionActiva] = useState(false)
  const [pctMetas, setPctMetas] = useState('')
  const [pctFondo, setPctFondo] = useState('')

  const { data: metas = [] } = useMetas()
  const { data: fondo } = useFondoEmergencia()
  const { data: monedas = [] } = useMonedas()
  const tieneSavingsTarget = metas.some((m) => m.estado === 'activa') || !!fondo

  // Sync profile data when loaded (useEffect avoids stale state from render-time mutation)
  useEffect(() => {
    if (profile) {
      setSalarioValue(profile.salario_mensual_neto != null ? String(profile.salario_mensual_neto) : '')
      setMostrarHoras(profile.mostrar_horas_trabajo ?? false)
      setSalarioBruto(profile.salario_bruto != null ? String(profile.salario_bruto) : '')
      setDescuentosAdicionales(profile.descuentos_adicionales != null ? String(profile.descuentos_adicionales) : '')
      setFrecuenciaPago(profile.frecuencia_pago ?? 'mensual')
      setAsignacionActiva(profile.asignacion_automatica_activa ?? false)
      setPctMetas(profile.porcentaje_ahorro_metas != null ? String(profile.porcentaje_ahorro_metas) : '')
      setPctFondo(profile.porcentaje_ahorro_fondo != null ? String(profile.porcentaje_ahorro_fondo) : '')
    }
  }, [profile])
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const metadata = user?.user_metadata ?? {}

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: metadata.full_name ?? '',
      phone: metadata.phone ?? '',
      currency: metadata.currency ?? 'DOP',
      country: metadata.country ?? '',
    },
  })

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const onPasswordSubmit= async (data: PasswordForm): Promise<void> => {
    setPasswordError(null)
    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    if (error) {
      setPasswordError(error.message)
      return
    }
    toast.success(t('settings.passwordUpdated'))
    setPasswordModalOpen(false)
    passwordForm.reset()
  }

  const handleLangChange = (lang: 'es' | 'en') => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
    toast.success(t('settings.languageSaved'))
  }

  const handleSaveAll = async () => {
    try {
      // Save profile metadata (name, phone, currency, country)
      const profileData = profileForm.getValues()
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          phone: profileData.phone,
          currency: profileData.currency,
          country: profileData.country,
        },
      })
      if (error) {
        toast.error(error.message)
        return
      }
      // Save finances (salary + work hours)
      await updateProfile.mutateAsync({
        salario_mensual_neto: salarioValue ? parseFloat(salarioValue) : undefined,
        mostrar_horas_trabajo: mostrarHoras,
        salario_bruto: salarioBruto ? parseFloat(salarioBruto) : undefined,
        descuentos_adicionales: descuentosAdicionales ? parseFloat(descuentosAdicionales) : undefined,
        frecuencia_pago: frecuenciaPago,
        asignacion_automatica_activa: asignacionActiva,
        porcentaje_ahorro_metas: pctMetas ? parseFloat(pctMetas) : undefined,
        porcentaje_ahorro_fondo: pctFondo ? parseFloat(pctFondo) : undefined,
      })
      toast.success(t('settings.profileSaved'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleSavePais = async (paisCodigo: string, monedaCodigo: string, nombrePais: string): Promise<void> => {
    setSavingPais(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          country: nombrePais,
          currency: monedaCodigo,
          pais_codigo: paisCodigo,
        },
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(t('settings.paisActualizado'))
      setPaisModalOpen(false)
    } catch {
      toast.error(t('settings.errorPais'))
    } finally {
      setSavingPais(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: t('settings.profile') },
    { id: 'appearance', label: t('settings.appearance') },
    { id: 'security', label: t('settings.security') },
    { id: 'categorias', label: t('settings.categorias') },
  ]

  const userName = metadata.full_name ?? user?.email?.split('@')[0] ?? 'Usuario'

  return (
    <div className="p-4 md:p-6">
      <h1 className="page-title-premium dark:text-[#e8f0ff] mb-6">{t('settings.title')}</h1>

      {/* Two-column layout: nav left + content right */}
      <div className="flex flex-col lg:grid lg:grid-cols-[200px_1fr] gap-6 items-start">

        {/* Left nav */}
        <nav className="card-glass rounded-[20px] p-2 flex flex-col gap-0.5 w-full lg:sticky lg:top-4">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                activeTab === id
                  ? 'bg-[#3d8ef8] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] dark:hover:bg-white/[0.04]'
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right content */}
        <div className="flex-1 min-w-0 space-y-6">

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="card-glass p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar name={userName} src={avatarPreview ?? undefined} size="lg" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-finza-blue text-white rounded-full flex items-center justify-center shadow-md hover:bg-finza-blue-dark transition-colors"
                aria-label={t('settings.uploadAvatar')}
              >
                <Camera size={12} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">{userName}</p>
              <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>

          <form className="space-y-4">
            <Input
              label={t('settings.fullName')}
              placeholder="Juan Perez"
              error={profileForm.formState.errors.fullName?.message}
              {...profileForm.register('fullName')}
            />

            {/* Email readonly */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="finza-input w-full opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-[var(--text-muted)]">{t('settings.emailReadOnly')}</p>
            </div>

            <Input
              label={t('auth.phone')}
              type="tel"
              placeholder="+1 809 000 0000"
              {...profileForm.register('phone')}
            />

            {/* Currency select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                {t('settings.preferredCurrency')}
              </label>
              <select
                className="finza-input w-full"
                {...profileForm.register('currency')}
              >
                {monedas.length > 0
                  ? monedas.map((m) => (
                      <option key={m.codigo} value={m.codigo}>
                        {m.codigo} — {m.nombre}
                      </option>
                    ))
                  : (
                    <>
                      <option value="DOP">DOP — Peso Dominicano</option>
                      <option value="USD">USD — Dólar Americano</option>
                      <option value="EUR">EUR — Euro</option>
                    </>
                  )}
              </select>
            </div>

            {/* Pais y moneda — display + boton cambiar */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                <Globe size={14} className="text-[var(--accent)]" />
                {t('settings.paisYMoneda')}
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] dark:border-white/[0.08] bg-[var(--surface-raised)]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {metadata.country || t('settings.noConfigurado')}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t('settings.moneda')}: {metadata.currency || 'DOP'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setPaisModalOpen(true)}
                >
                  {t('settings.cambiar')}
                </Button>
              </div>
            </div>

          </form>

          {/* Salary information section */}
          <div className="border-t border-[var(--border)] pt-6 space-y-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={13} className="text-[var(--accent)]" />
              {t('profile.infoSalarial')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                  <DollarSign size={14} className="text-[var(--accent)]" />
                  {t('profile.salarioNeto')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={salarioValue}
                  onChange={(e) => setSalarioValue(e.target.value)}
                  className="finza-input w-full"
                />
                <p className="text-xs text-[var(--text-muted)]">{t('profile.salarioHint')}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  {t('profile.salarioBruto')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={salarioBruto}
                  onChange={(e) => setSalarioBruto(e.target.value)}
                  className="finza-input w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  {t('profile.descuentosAdicionales')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={descuentosAdicionales}
                  onChange={(e) => setDescuentosAdicionales(e.target.value)}
                  className="finza-input w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  {t('profile.frecuenciaPago')}
                </label>
                <select
                  value={frecuenciaPago}
                  onChange={(e) => setFrecuenciaPago(e.target.value as FrecuenciaPago)}
                  className="finza-input w-full"
                >
                  <option value="mensual">{t('profile.frecMensual')}</option>
                  <option value="quincenal">{t('profile.frecQuincenal')}</option>
                  <option value="bisemanal">{t('profile.frecBisemanal')}</option>
                </select>
              </div>
            </div>

            {/* Mostrar horas de trabajo — dentro de información salarial */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] dark:border-white/[0.08] dark:bg-white/[0.05]">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{t('profile.mostrarHoras')}</p>
                  {profile?.horas_por_peso != null && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {t('profile.horasPorPeso')}: {profile.horas_por_peso.toFixed(4)} h/$
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMostrarHoras((v) => !v)}
                className={cn(
                  'relative w-[42px] h-6 rounded-full transition-colors duration-200 flex-shrink-0',
                  mostrarHoras ? 'bg-[#3d8ef8]' : 'bg-[var(--border-strong)]'
                )}
              >
                <span
                  className={cn(
                    'absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-200',
                    mostrarHoras ? 'left-[21px]' : 'left-[3px]'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Auto savings allocation section — only shown when user has active goals or emergency fund */}
          {tieneSavingsTarget && (
            <div className="border-t border-[var(--border)] pt-6 space-y-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Zap size={13} className="text-[var(--accent)]" />
                {t('profile.asignacionAutomatica')}
              </p>

              {/* Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] dark:border-white/[0.08] dark:bg-white/[0.05]">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{t('profile.asignacionActivar')}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-xs">{t('profile.asignacionDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAsignacionActiva((v) => !v)}
                  className={cn(
                    'relative w-[42px] h-6 rounded-full transition-colors duration-200 flex-shrink-0',
                    asignacionActiva ? 'bg-[#3d8ef8]' : 'bg-[var(--border-strong)]'
                  )}
                  aria-label="Toggle asignacion automatica"
                >
                  <span
                    className={cn(
                      'absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-200',
                      asignacionActiva ? 'left-[21px]' : 'left-[3px]'
                    )}
                  />
                </button>
              </div>

              {/* Percentage inputs, only shown when active */}
              {asignacionActiva && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--text-primary)]">
                        {t('profile.pctAhorroMetas')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="0"
                          value={pctMetas}
                          onChange={(e) => setPctMetas(e.target.value)}
                          className="finza-input w-full pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--text-primary)]">
                        {t('profile.pctAhorroFondo')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="0"
                          value={pctFondo}
                          onChange={(e) => setPctFondo(e.target.value)}
                          className="finza-input w-full pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Total summary */}
                  {(() => {
                    const total = (parseFloat(pctMetas) || 0) + (parseFloat(pctFondo) || 0)
                    const excede = total > 100
                    return (
                      <div className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                        excede
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-[var(--surface-raised)] text-[var(--text-muted)]'
                      )}>
                        {excede && <AlertTriangle size={14} className="flex-shrink-0" />}
                        <span>
                          {t('profile.totalAhorro')}: <strong>{total.toFixed(1)}%</strong>
                          {excede && ` — ${t('profile.advertenciaPct')}`}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Single save button for all profile + finances */}
          <Button
            onClick={handleSaveAll}
            isLoading={profileForm.formState.isSubmitting || updateProfile.isPending}
            className="w-full"
          >
            {t('common.save')}
          </Button>
        </div>
      )}

      {/* Modal de cambio de pais */}
      {paisModalOpen && (
        <PaisModal
          currentPaisCodigo={metadata.pais_codigo ?? 'DO'}
          onClose={() => setPaisModalOpen(false)}
          onSave={handleSavePais}
          isSaving={savingPais}
        />
      )}

      {/* Tab: Appearance (theme + language) */}
      {activeTab === 'appearance' && (
        <div className="space-y-4">
          {/* Theme ToggleGroup */}
          <div className="card-glass p-6 space-y-4">
            <div>
              <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">
                {t('settings.theme')}
              </h4>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                {t('settings.themeDesc')}
              </p>
            </div>
            <ToggleGroup
              value={theme}
              onValueChange={(val) => setTheme(val as 'light' | 'dark' | 'system')}
              options={[
                {
                  value: 'light',
                  label: t('settings.lightMode'),
                  icon: <Sun size={15} />,
                  title: t('settings.lightMode'),
                },
                {
                  value: 'dark',
                  label: t('settings.darkMode'),
                  icon: <Moon size={15} />,
                  title: t('settings.darkMode'),
                },
                {
                  value: 'system',
                  label: t('settings.systemMode'),
                  icon: <Monitor size={15} />,
                  title: t('settings.systemMode'),
                },
              ]}
              className="w-full"
              size="md"
            />
          </div>

          {/* Language ToggleGroup */}
          <div className="card-glass p-6 space-y-4">
            <div>
              <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">
                {t('settings.changeLanguage')}
              </h4>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                {t('settings.changeLanguageDesc')}
              </p>
            </div>
            <ToggleGroup
              value={language}
              onValueChange={(val) => handleLangChange(val as 'es' | 'en')}
              options={[
                { value: 'es', label: 'Español', title: 'Español' },
                { value: 'en', label: 'English', title: 'English' },
              ]}
              className="w-full"
              size="md"
            />
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <div className="card-glass p-6 space-y-4">
          <p className="text-sm text-[var(--text-muted)]">{t('settings.changePassword')}</p>
          <Button variant="secondary" onClick={() => setPasswordModalOpen(true)} className="w-full">
            {t('settings.changePassword')}
          </Button>
        </div>
      )}

      {/* Tab: Categorias */}
      {activeTab === 'categorias' && (
        <CategoriasTab navigate={navigate} />
      )}

      {/* Password Modal */}
      {passwordModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setPasswordModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-surface border border-border rounded-xl shadow-glass p-6 space-y-4 animate-slide-up">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {t('settings.changePassword')}
              </h2>

              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <Input
                  label={t('auth.newPassword')}
                  type="password"
                  placeholder={t('settings.minChars')}
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword')}
                />
                <Input
                  label={t('auth.confirmPassword')}
                  type="password"
                  placeholder={t('settings.repeatPassword')}
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register('confirmPassword')}
                />

                {passwordError && (
                  <p className="text-sm text-alert-red bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    {passwordError}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setPasswordModalOpen(false)
                      setPasswordError(null)
                      passwordForm.reset()
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    isLoading={passwordForm.formState.isSubmitting}
                    className="flex-1"
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

        </div>{/* end right content */}
      </div>{/* end grid */}
    </div>
  )
}
