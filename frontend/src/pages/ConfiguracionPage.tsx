import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Sun, Moon, Camera, DollarSign, Clock, Tag, Trash2, Plus } from 'lucide-react'
import * as Icons from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import {
  useCategorias,
  useCreateCategoria,
  useDeleteCategoria,
} from '@/hooks/useCategorias'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import type { CategoriaResponse } from '@/types/transacciones'

type Tab = 'profile' | 'appearance' | 'language' | 'security' | 'finances' | 'categorias'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Nombre requerido'),
  phone: z.string().optional(),
  currency: z.string(),
  country: z.string().optional(),
})

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Minimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
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

function getTipoBadge(tipo: CategoriaResponse['tipo']): JSX.Element {
  const styles: Record<CategoriaResponse['tipo'], string> = {
    ingreso: 'bg-emerald-500/20 text-emerald-400',
    egreso: 'bg-red-500/20 text-red-400',
    ambos: 'bg-blue-500/20 text-blue-400',
  }
  const labels: Record<CategoriaResponse['tipo'], string> = {
    ingreso: 'Ingreso',
    egreso: 'Egreso',
    ambos: 'Ambos',
  }
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', styles[tipo])}>
      {labels[tipo]}
    </span>
  )
}

interface NuevaCategoriaFormProps {
  onDone: () => void
}

function NuevaCategoriaForm({ onDone }: NuevaCategoriaFormProps): JSX.Element {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'ingreso' | 'egreso' | 'ambos'>('egreso')
  const createCategoria = useCreateCategoria()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!nombre.trim()) return
    try {
      await createCategoria.mutateAsync({ nombre: nombre.trim(), tipo })
      toast.success('Categoria creada')
      setNombre('')
      onDone()
    } catch {
      toast.error('Error al crear la categoria')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-glass rounded-xl p-4 space-y-3 border border-white/[0.12]">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Nueva categoria</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la categoria"
          className="finza-input flex-1 text-sm"
          autoFocus
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as typeof tipo)}
          className="finza-input text-sm"
        >
          <option value="egreso">Egreso</option>
          <option value="ingreso">Ingreso</option>
          <option value="ambos">Ambos</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="md" isLoading={createCategoria.isPending} className="flex-1">
          Guardar
        </Button>
        <Button type="button" size="md" variant="secondary" onClick={onDone} className="flex-1">
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function CategoriasTab({ navigate }: CategoriasTabProps): JSX.Element {
  const { data: categorias = [], isLoading, isError } = useCategorias()
  const deleteCategoria = useDeleteCategoria()
  const [showForm, setShowForm] = useState(false)

  const handleDelete = async (cat: CategoriaResponse): Promise<void> => {
    if (cat.es_sistema) {
      toast.error('No se pueden eliminar categorias del sistema')
      return
    }
    if (window.confirm(`Eliminar categoria "${cat.nombre}"?`)) {
      try {
        await deleteCategoria.mutateAsync(cat.id)
        toast.success('Categoria eliminada')
      } catch {
        toast.error('Error al eliminar la categoria')
      }
    }
  }

  return (
    <div className="card-glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Gestiona tus categorias</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Categorias del sistema no pueden eliminarse
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/categorias')}
          >
            Ver todas
          </Button>
          <Button
            variant="default"
            size="md"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} />
            Nueva
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
          No se pudieron cargar las categorias.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="space-y-1.5">
          {categorias.map((cat) => {
            const IconComp = getCategoryIcon(cat.icono)
            return (
              <div
                key={cat.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <IconComp size={15} className="text-white/50" />
                </div>
                <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{cat.nombre}</span>
                {getTipoBadge(cat.tipo)}
                {cat.es_sistema && (
                  <span className="text-[10px] text-white/20 px-1.5 py-0.5 rounded bg-white/[0.04]">
                    Sistema
                  </span>
                )}
                {!cat.es_sistema && (
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                    aria-label={`Eliminar ${cat.nombre}`}
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

export function ConfiguracionPage(): JSX.Element {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { theme, setTheme, language, setLanguage } = useThemeStore()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const [salarioValue, setSalarioValue] = useState('')
  const [mostrarHoras, setMostrarHoras] = useState(false)

  // Sync profile data when loaded (useEffect avoids stale state from render-time mutation)
  useEffect(() => {
    if (profile) {
      setSalarioValue(profile.salario_mensual_neto != null ? String(profile.salario_mensual_neto) : '')
      setMostrarHoras(profile.mostrar_horas_trabajo ?? false)
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

  const onProfileSubmit = async (data: ProfileForm): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: data.fullName,
        phone: data.phone,
        currency: data.currency,
        country: data.country,
      },
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(t('settings.profileSaved'))
  }

  const onPasswordSubmit = async (data: PasswordForm): Promise<void> => {
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

  const handleSaveFinances = async () => {
    try {
      await updateProfile.mutateAsync({
        salario_mensual_neto: salarioValue ? parseFloat(salarioValue) : undefined,
        mostrar_horas_trabajo: mostrarHoras,
      })
      toast.success(t('profile.saved'))
    } catch {
      toast.error('Error al guardar perfil financiero')
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: t('settings.profile') },
    { id: 'finances', label: t('profile.title') },
    { id: 'appearance', label: t('settings.appearance') },
    { id: 'language', label: t('settings.language') },
    { id: 'security', label: t('settings.security') },
    { id: 'categorias', label: 'Categorias' },
  ]

  const userName = metadata.full_name ?? user?.email?.split('@')[0] ?? 'Usuario'

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6 md:p-8">
      <h1 className="page-title-premium dark:text-[#e8f0ff]">{t('settings.title')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150',
              activeTab === id
                ? 'bg-finza-blue text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-raised'
            )}
          >
            {label}
          </button>
        ))}
      </div>

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

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
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
                <option value="DOP">Peso Dominicano (RD$)</option>
                <option value="USD">Dolar Americano ($)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <Input
              label={t('auth.country')}
              placeholder="Republica Dominicana"
              {...profileForm.register('country')}
            />

            <Button
              type="submit"
              isLoading={profileForm.formState.isSubmitting}
              className="w-full"
            >
              {t('common.save')}
            </Button>
          </form>
        </div>
      )}

      {/* Tab: Appearance */}
      {activeTab === 'appearance' && (
        <div className="card-glass p-6 space-y-4">
          <p className="text-sm text-[var(--text-muted)]">{t('settings.currentTheme')}</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Light mode card */}
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 text-left space-y-2',
                theme === 'light'
                  ? 'border-finza-blue bg-finza-blue/5'
                  : 'border-border hover:border-finza-blue/40'
              )}
            >
              <div className="w-full h-16 bg-[#f0f4f8] rounded-lg flex items-center justify-center border border-[#e2e8f0]">
                <div className="w-8 h-8 bg-white rounded-md shadow-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-golden-flow" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t('settings.lightMode')}
                </span>
              </div>
              {theme === 'light' && (
                <div className="w-2 h-2 rounded-full bg-finza-blue ml-auto" />
              )}
            </button>

            {/* Dark mode card */}
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 text-left space-y-2',
                theme === 'dark'
                  ? 'border-finza-blue bg-finza-blue/5'
                  : 'border-border hover:border-finza-blue/40'
              )}
            >
              <div className="w-full h-16 bg-[#0f172a] rounded-lg flex items-center justify-center border border-[#334155]">
                <div className="w-8 h-8 bg-[#1e293b] rounded-md shadow-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Moon size={14} className="text-finza-blue-light" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t('settings.darkMode')}
                </span>
              </div>
              {theme === 'dark' && (
                <div className="w-2 h-2 rounded-full bg-finza-blue ml-auto" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Language */}
      {activeTab === 'language' && (
        <div className="card-glass p-6 space-y-4">
          <p className="text-sm text-[var(--text-muted)]">{t('settings.changeLanguage')}</p>
          <div className="space-y-3">
            {[
              { code: 'es', label: 'Espanol', flag: 'ES' },
              { code: 'en', label: 'English', flag: 'EN' },
            ].map(({ code, label, flag }) => (
              <button
                key={code}
                onClick={() => handleLangChange(code as 'es' | 'en')}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200',
                  language === code
                    ? 'border-finza-blue bg-finza-blue/5'
                    : 'border-border hover:border-finza-blue/40'
                )}
              >
                <span className="text-xl font-bold text-[var(--text-muted)] w-8">{flag}</span>
                <span className="font-medium text-[var(--text-primary)]">{label}</span>
                {language === code && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-finza-blue" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Finances */}
      {activeTab === 'finances' && (
        <div className="card-glass p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
              <DollarSign size={15} className="text-[var(--accent)]" />
              {t('profile.salario')}
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
                'w-11 h-6 rounded-full transition-colors relative',
                mostrarHoras ? 'bg-[var(--accent)] dark:bg-finza-blue' : 'bg-[var(--border)]'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  mostrarHoras ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          <Button
            onClick={handleSaveFinances}
            isLoading={updateProfile.isPending}
            className="w-full"
          >
            {t('common.save')}
          </Button>
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
                  placeholder="Minimo 8 caracteres"
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword')}
                />
                <Input
                  label={t('auth.confirmPassword')}
                  type="password"
                  placeholder="Repite tu contrasena"
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
    </div>
  )
}
