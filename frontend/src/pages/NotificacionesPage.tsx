import { CheckCheck, Trash2, AlertTriangle, Info, Trophy, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  useNotificaciones,
  useMarcarLeida,
  useMarcarTodasLeidas,
  useEliminarNotificacion,
  useGenerarNotificaciones,
  type NotificacionData,
} from '@/hooks/useNotificaciones'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { getApiErrorMessage } from '@/lib/apiError'

const TIPO_CONFIG: Record<
  string,
  { color: string; bgColor: string; icon: typeof AlertTriangle; label: string }
> = {
  urgente: {
    color: 'var(--danger)',
    bgColor: 'var(--danger)',
    icon: AlertTriangle,
    label: 'notificaciones.urgente',
  },
  informativa: {
    color: 'var(--accent)',
    bgColor: 'var(--accent)',
    icon: Info,
    label: 'notificaciones.informativa',
  },
  logro: {
    color: 'var(--success)',
    bgColor: 'var(--success)',
    icon: Trophy,
    label: 'notificaciones.logro',
  },
  advertencia: {
    color: '#E65100',
    bgColor: '#E65100',
    icon: Bell,
    label: 'notificaciones.advertencia',
  },
}

function NotificacionItem({
  notificacion,
  onLeer,
  onEliminar,
}: {
  notificacion: NotificacionData
  onLeer: (id: string) => void
  onEliminar: (id: string) => void
}): JSX.Element {
  const { t } = useTranslation()
  const config = TIPO_CONFIG[notificacion.tipo] ?? TIPO_CONFIG.informativa
  const Icon = config.icon

  const dateStr = new Date(notificacion.created_at).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={cn(
        'finza-card p-4 flex items-start gap-3 transition-opacity',
        notificacion.leida && 'opacity-60'
      )}
    >
      {/* Tipo icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${config.bgColor}22` }}
      >
        <Icon size={16} style={{ color: config.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={cn(
                'text-sm font-semibold',
                notificacion.leida
                  ? 'text-[var(--text-muted)]'
                  : 'text-[var(--text-primary)]'
              )}
            >
              {notificacion.titulo}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{notificacion.mensaje}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5">{dateStr}</p>
          </div>

          {/* Tipo badge */}
          <span
            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: config.color, backgroundColor: `${config.bgColor}22` }}
          >
            {t(config.label)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!notificacion.leida && (
          <button
            onClick={() => onLeer(notificacion.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--success)] hover:bg-surface-raised transition-colors"
            title={t('notificaciones.markRead')}
          >
            <CheckCheck size={14} />
          </button>
        )}
        <button
          onClick={() => onEliminar(notificacion.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-surface-raised transition-colors"
          title={t('common.delete')}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export function NotificacionesPage(): JSX.Element {
  const { t } = useTranslation()
  const { data: notificaciones = [], isLoading } = useNotificaciones()
  const marcarLeida = useMarcarLeida()
  const marcarTodas = useMarcarTodasLeidas()
  const eliminar = useEliminarNotificacion()
  const generar = useGenerarNotificaciones()

  // Generate on mount to get fresh triggers
  useEffect(() => {
    generar.mutate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLeer = async (id: string) => {
    try {
      await marcarLeida.mutateAsync(id)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleEliminar = async (id: string) => {
    try {
      await eliminar.mutateAsync(id)
      toast.success(t('notificaciones.deleted'))
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleMarcarTodas = async () => {
    try {
      await marcarTodas.mutateAsync()
      toast.success(t('notificaciones.allRead'))
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  // Group by tipo
  const urgentes = notificaciones.filter((n) => n.tipo === 'urgente')
  const advertencias = notificaciones.filter((n) => n.tipo === 'advertencia')
  const logros = notificaciones.filter((n) => n.tipo === 'logro')
  const informativas = notificaciones.filter((n) => n.tipo === 'informativa')

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            {t('notificaciones.title')}
          </h1>
          {noLeidas > 0 && (
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {noLeidas} {t('notificaciones.sinLeer')}
            </p>
          )}
        </div>
        {noLeidas > 0 && (
          <button
            onClick={handleMarcarTodas}
            disabled={marcarTodas.isPending}
            className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
          >
            <CheckCheck size={16} />
            {t('notificaciones.markAllRead')}
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && notificaciones.length === 0 && (
        <div className="finza-card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-3">
            <CheckCheck size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-primary)] font-medium">{t('notificaciones.noNotificaciones')}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t('notificaciones.noNotificacionesDesc')}</p>
        </div>
      )}

      {/* Urgentes */}
      {urgentes.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--danger)] mb-3 flex items-center gap-1.5">
            <AlertTriangle size={12} />
            {t('notificaciones.urgente')}
          </h2>
          <div className="space-y-2">
            {urgentes.map((n) => (
              <NotificacionItem
                key={n.id}
                notificacion={n}
                onLeer={handleLeer}
                onEliminar={handleEliminar}
              />
            ))}
          </div>
        </section>
      )}

      {/* Advertencias */}
      {advertencias.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#E65100' }}>
            <Bell size={12} />
            {t('notificaciones.advertencia')}
          </h2>
          <div className="space-y-2">
            {advertencias.map((n) => (
              <NotificacionItem
                key={n.id}
                notificacion={n}
                onLeer={handleLeer}
                onEliminar={handleEliminar}
              />
            ))}
          </div>
        </section>
      )}

      {/* Logros */}
      {logros.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--success)] mb-3 flex items-center gap-1.5">
            <Trophy size={12} />
            {t('notificaciones.logro')}
          </h2>
          <div className="space-y-2">
            {logros.map((n) => (
              <NotificacionItem
                key={n.id}
                notificacion={n}
                onLeer={handleLeer}
                onEliminar={handleEliminar}
              />
            ))}
          </div>
        </section>
      )}

      {/* Informativas */}
      {informativas.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3 flex items-center gap-1.5">
            <Info size={12} />
            {t('notificaciones.informativa')}
          </h2>
          <div className="space-y-2">
            {informativas.map((n) => (
              <NotificacionItem
                key={n.id}
                notificacion={n}
                onLeer={handleLeer}
                onEliminar={handleEliminar}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
