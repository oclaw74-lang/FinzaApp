import { useTranslation } from 'react-i18next'
import { Trophy, CheckCircle2, XCircle, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  useCatalogoRetos,
  useMisRetos,
  useAceptarReto,
  useCheckinReto,
  useAbandonarReto,
} from '@/hooks/useRetos'
import type { UserRetoData, RetoData } from '@/types/retos'

function SkeletonCard(): JSX.Element {
  return (
    <div className="finza-card p-4 animate-pulse space-y-2">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-8 w-24 mt-2" />
    </div>
  )
}

function TipoBadge({ tipo }: { tipo: 'semanal' | 'mensual' }): JSX.Element {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        tipo === 'semanal'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      )}
    >
      {tipo === 'semanal' ? t('retos.semanal') : t('retos.mensual')}
    </span>
  )
}

interface UserRetoCardProps {
  reto: UserRetoData
  onCheckin: (id: string) => void
  onAbandonar: (id: string) => void
  isCheckinLoading: boolean
  isAbandonarLoading: boolean
}

function UserRetoCard({
  reto,
  onCheckin,
  onAbandonar,
  isCheckinLoading,
  isAbandonarLoading,
}: UserRetoCardProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="finza-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {reto.icono && (
            <span className="text-xl shrink-0" aria-hidden="true">
              {reto.icono}
            </span>
          )}
          {!reto.icono && (
            <Trophy size={20} className="text-[var(--text-muted)] shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm text-[var(--text-primary)] truncate">{reto.titulo}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{reto.descripcion}</p>
          </div>
        </div>
        <TipoBadge tipo={reto.tipo} />
      </div>

      <div className="flex items-center gap-1.5 text-sm">
        <Flame size={16} className="text-orange-500" aria-hidden="true" />
        <span className="font-semibold text-[var(--text-primary)]">{reto.racha_dias}</span>
        <span className="text-[var(--text-muted)]">{t('retos.racha')}</span>
      </div>

      {reto.ahorro_estimado !== null && (
        <p className="text-xs text-[var(--text-muted)]">
          {t('retos.ahorroEstimado')}:{' '}
          <span className="font-medium text-[var(--text-primary)]">
            {formatCurrency(reto.ahorro_estimado)}
          </span>
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={!reto.puede_checkin_hoy || isCheckinLoading}
          onClick={() => onCheckin(reto.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            reto.puede_checkin_hoy && !isCheckinLoading
              ? 'bg-[var(--success)] text-white hover:opacity-90'
              : 'bg-[var(--surface-raised)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
          )}
          aria-label={reto.puede_checkin_hoy ? t('retos.checkin') : t('retos.checkinHecho')}
        >
          <CheckCircle2 size={14} />
          {reto.puede_checkin_hoy ? t('retos.checkin') : t('retos.checkinHecho')}
        </button>

        <button
          type="button"
          disabled={isAbandonarLoading}
          onClick={() => onAbandonar(reto.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label={t('retos.abandonar')}
        >
          <XCircle size={14} />
          {t('retos.abandonar')}
        </button>
      </div>
    </div>
  )
}

interface CatalogoRetoCardProps {
  reto: RetoData
  onAceptar: (id: string) => void
  isLoading: boolean
}

function CatalogoRetoCard({ reto, onAceptar, isLoading }: CatalogoRetoCardProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="finza-card finza-card-hover p-4 space-y-3">
      <div className="flex items-start gap-2">
        {reto.icono && (
          <span className="text-xl shrink-0" aria-hidden="true">
            {reto.icono}
          </span>
        )}
        {!reto.icono && (
          <Trophy size={20} className="text-[var(--text-muted)] shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm text-[var(--text-primary)]">{reto.titulo}</p>
            <TipoBadge tipo={reto.tipo} />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{reto.descripcion}</p>
        </div>
      </div>

      {reto.ahorro_estimado !== null && (
        <p className="text-xs text-[var(--text-muted)]">
          {t('retos.ahorroEstimado')}:{' '}
          <span className="font-medium text-[var(--text-primary)]">
            {formatCurrency(reto.ahorro_estimado)}
          </span>
        </p>
      )}

      <button
        type="button"
        disabled={isLoading}
        onClick={() => onAceptar(reto.id)}
        className="finza-btn w-full justify-center text-xs py-1.5"
        aria-label={t('retos.aceptar')}
      >
        {t('retos.aceptar')}
      </button>
    </div>
  )
}

export function RetosPage(): JSX.Element {
  const { t } = useTranslation()

  const { data: misRetos = [], isLoading: loadingMisRetos } = useMisRetos()
  const { data: catalogo = [], isLoading: loadingCatalogo } = useCatalogoRetos()

  const aceptarReto = useAceptarReto()
  const checkinReto = useCheckinReto()
  const abandonarReto = useAbandonarReto()

  const misRetosActivos = misRetos.filter((r) => r.estado === 'activo')
  const retoIdsAceptados = new Set(misRetos.map((r) => r.reto_id))
  const catalogoDisponible = catalogo.filter((r) => !retoIdsAceptados.has(r.id))

  const handleAceptar = async (retoId: string): Promise<void> => {
    try {
      await aceptarReto.mutateAsync(retoId)
      toast.success(t('retos.aceptado'))
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleCheckin = async (userRetoId: string): Promise<void> => {
    try {
      await checkinReto.mutateAsync(userRetoId)
      toast.success(t('retos.checkinOk'))
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleAbandonar = async (userRetoId: string): Promise<void> => {
    if (!window.confirm(t('retos.abandonar') + '?')) return
    try {
      await abandonarReto.mutateAsync(userRetoId)
      toast.success(t('retos.abandonado'))
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('retos.title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t('retos.subtitle')}</p>
      </div>

      {/* Mis retos activos */}
      <section aria-label={t('retos.misRetos')}>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          {t('retos.misRetos')}
        </h2>

        {loadingMisRetos && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loadingMisRetos && misRetosActivos.length === 0 && (
          <div className="finza-card p-8 flex flex-col items-center justify-center text-center">
            <Trophy size={36} className="text-[var(--text-muted)] opacity-40 mb-3" aria-hidden="true" />
            <p className="text-sm font-medium text-[var(--text-primary)]">{t('retos.noMisRetos')}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{t('retos.noMisRetosDesc')}</p>
          </div>
        )}

        {!loadingMisRetos && misRetosActivos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {misRetosActivos.map((reto) => (
              <UserRetoCard
                key={reto.id}
                reto={reto}
                onCheckin={handleCheckin}
                onAbandonar={handleAbandonar}
                isCheckinLoading={checkinReto.isPending}
                isAbandonarLoading={abandonarReto.isPending}
              />
            ))}
          </div>
        )}
      </section>

      {/* Retos disponibles */}
      <section aria-label={t('retos.disponibles')}>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          {t('retos.disponibles')}
        </h2>

        {loadingCatalogo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loadingCatalogo && catalogoDisponible.length === 0 && (
          <div className="finza-card p-6 flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={32} className="text-[var(--success)] opacity-60 mb-2" aria-hidden="true" />
            <p className="text-sm text-[var(--text-muted)]">{t('common.noData')}</p>
          </div>
        )}

        {!loadingCatalogo && catalogoDisponible.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogoDisponible.map((reto) => (
              <CatalogoRetoCard
                key={reto.id}
                reto={reto}
                onAceptar={handleAceptar}
                isLoading={aceptarReto.isPending}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
