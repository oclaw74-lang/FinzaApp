import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  useNotificaciones,
  useMarcarLeida,
  useMarcarTodasLeidas,
  useGenerarNotificaciones,
} from '@/hooks/useNotificaciones'

const TIPO_COLOR: Record<string, string> = {
  urgente: 'var(--danger)',
  logro: 'var(--success)',
  informativa: 'var(--accent)',
}

export function NotificacionBadge(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: notificaciones = [] } = useNotificaciones()
  const marcarLeida = useMarcarLeida()
  const marcarTodas = useMarcarTodasLeidas()
  const generarNotificaciones = useGenerarNotificaciones()

  const noLeidas = notificaciones.filter((n) => !n.leida)
  const count = noLeidas.length
  const recientes = notificaciones.slice(0, 5)

  // Generate notifications on mount
  useEffect(() => {
    generarNotificaciones.mutate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const handleItemClick = async (id: string) => {
    await marcarLeida.mutateAsync(id)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-surface-raised hover:text-[var(--text-primary)] transition-colors relative"
        aria-label={t('notificaciones.title')}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center px-0.5">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 bg-surface border border-border rounded-xl shadow-glass animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {t('notificaciones.title')}
            </span>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={() => marcarTodas.mutate()}
                  className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1"
                  title={t('notificaciones.markAllRead')}
                >
                  <CheckCheck size={12} />
                  {t('notificaciones.markAllRead')}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {recientes.length === 0 ? (
              <p className="text-center text-sm text-[var(--text-muted)] py-8">
                {t('notificaciones.noNotificaciones')}
              </p>
            ) : (
              recientes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-border/50 last:border-0',
                    'hover:bg-surface-raised transition-colors',
                    !n.leida && 'bg-[var(--accent)]/5'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: n.leida ? 'transparent' : TIPO_COLOR[n.tipo] ?? 'var(--accent)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs font-semibold truncate',
                          n.leida ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                        )}
                      >
                        {n.titulo}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5">
                        {n.mensaje}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border">
            <button
              onClick={() => {
                setOpen(false)
                navigate('/notificaciones')
              }}
              className="text-xs text-[var(--accent)] hover:underline w-full text-center font-medium"
            >
              {t('notificaciones.verTodas')} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
