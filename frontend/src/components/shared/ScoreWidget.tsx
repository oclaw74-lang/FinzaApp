import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useScore } from '@/hooks/useScore'
import { Skeleton } from '@/components/ui/skeleton'

function getScoreColor(score: number): string {
  if (score <= 40) return 'var(--danger)'
  if (score <= 65) return '#F5C542'
  if (score <= 80) return 'var(--success)'
  return '#00d060'
}

function getEstadoLabel(estado: string, t: (k: string) => string): string {
  const map: Record<string, string> = {
    critico: t('score.critico'),
    en_riesgo: t('score.en_riesgo'),
    bueno: t('score.bueno'),
    excelente: t('score.excelente'),
  }
  return map[estado] ?? estado
}

interface ScoreWidgetProps {
  collapsed?: boolean
}

export function ScoreWidget({ collapsed = false }: ScoreWidgetProps): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading } = useScore()
  const [showTooltip, setShowTooltip] = useState(false)

  if (isLoading) {
    return (
      <div className={cn('px-3 py-2', collapsed && 'flex justify-center')}>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    )
  }

  if (!data) return <></>

  const color = getScoreColor(data.score)
  const estadoLabel = getEstadoLabel(data.estado, t)

  return (
    <div
      className={cn(
        'relative mx-2 mb-2 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors',
        collapsed ? 'p-2 flex justify-center' : 'px-3 py-2.5'
      )}
      onClick={() => navigate('/score')}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate('/score') }}
    >
      {collapsed ? (
        /* Collapsed: just the number */
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {data.score}
        </span>
      ) : (
        /* Expanded */
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {t('score.title')}
            </p>
            <p className="text-xl font-bold tabular-nums leading-none mt-0.5" style={{ color }}>
              {data.score}
              <span className="text-xs text-white/30 font-normal">/100</span>
            </p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color, backgroundColor: `${color}22` }}
          >
            {estadoLabel}
          </span>
        </div>
      )}

      {/* Tooltip with breakdown */}
      {showTooltip && (
        <div
          className={cn(
            'absolute z-50 bottom-full mb-2 bg-[#1a1f2e] border border-white/10 rounded-xl p-3 shadow-xl text-xs w-48',
            collapsed ? 'left-12' : 'left-0 right-0'
          )}
        >
          <p className="text-white/60 font-semibold mb-2 uppercase tracking-wider text-[10px]">
            {t('score.title')}
          </p>
          {Object.entries(data.breakdown).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center mb-1.5">
              <span className="text-white/60 capitalize">{key}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(val / 25) * 100}%`,
                      backgroundColor: getScoreColor(val * 4),
                    }}
                  />
                </div>
                <span className="text-white font-bold w-4 text-right">{val}</span>
              </div>
            </div>
          ))}
          <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
            <span className="text-white/60">{t('common.total')}</span>
            <span className="font-bold" style={{ color }}>
              {data.score}/100
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
