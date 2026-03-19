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

const DOT_COLOR: Record<string, string> = {
  urgente: '#ff4060',
  logro: '#00dfa2',
  informativa: '#3d8ef8',
  advertencia: '#ffb340',
}

const SECTION_CONFIG: Record<
  string,
  { icon: typeof AlertTriangle; label: string; textColor: string }
> = {
  urgente: {
    icon: AlertTriangle,
    label: 'notificaciones.urgente',
    textColor: 'var(--danger)',
  },
  informativa: {
    icon: Info,
    label: 'notificaciones.informativa',
    textColor: 'var(--accent)',
  },
  logro: {
    icon: Trophy,
    label: 'notificaciones.logro',
    textColor: 'var(--success)',
  },
  advertencia: {
    icon: Bell,
    label: 'notificaciones.advertencia',
    textColor: '#E65100',
  },
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
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
  const dotColor = DOT_COLOR[notificacion.tipo] ?? '#3d8ef8'
  const timeAgo = formatTimeAgo(notificacion.created_at)

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-[14px] rounded-xl border border-[rgba(255,255,255,0.06)]',
        'bg-[rgba(8,15,30,0.4)] hover:bg-[rgba(8,15,30,0.7)] hover:border-[rgba(255,255,255,0.1)]',
        'transition-all duration-150 cursor-pointer mb-2',
        notificacion.leida && 'opacity-60'
      )}
    >
      {/* Dot 8px */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 mt-[3px]"
        style={{ backgroundColor: dotColor }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-[2px]">
          {notificacion.titulo}
        </p>
        <p className="text-[12px] text-[#657a9e] leading-[1.5]">
          {notificacion.mensaje}
        </p>
      </div>

      {/* Timestamp + actions */}
      <div className="flex items-start gap-1 flex-shrink-0">
        <span className="text-[11px] text-[#657a9e]">{timeAgo}</span>
        {!notificacion.leida && (
          <button
            onClick={(e) => { e.stopPropagation(); onLeer(notificacion.id) }}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--success)] hover:bg-surface-raised transition-colors"
            title={t('notificaciones.markRead')}
          >
            <CheckCheck size={12} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onEliminar(notificacion.id) }}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-surface-raised transition-colors"
          title={t('common.delete')}
        >
          <Trash2 size={12} />
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
    <div className="animate-fade-in p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title-premium dark:text-[#e8f0ff]">
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
        <div className="card-glass p-12 text-center">
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
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
            style={{ color: SECTION_CONFIG.urgente.textColor }}
          >
            <AlertTriangle size={12} />
            {t(SECTION_CONFIG.urgente.label)}
          </h2>
          <div>
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
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
            style={{ color: SECTION_CONFIG.advertencia.textColor }}
          >
            <Bell size={12} />
            {t(SECTION_CONFIG.advertencia.label)}
          </h2>
          <div>
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
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
            style={{ color: SECTION_CONFIG.logro.textColor }}
          >
            <Trophy size={12} />
            {t(SECTION_CONFIG.logro.label)}
          </h2>
          <div>
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
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
            style={{ color: SECTION_CONFIG.informativa.textColor }}
          >
            <Info size={12} />
            {t(SECTION_CONFIG.informativa.label)}
          </h2>
          <div>
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
