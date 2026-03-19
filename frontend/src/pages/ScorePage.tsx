import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Wallet, PiggyBank, ShieldCheck, AlertTriangle, Info } from 'lucide-react'
import { useScore, type ScoreData } from '@/hooks/useScore'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function getScoreColor(score: number): string {
  if (score <= 40) return 'var(--danger)'
  if (score <= 65) return '#F5C542'
  if (score <= 80) return 'var(--success)'
  return '#00d060'
}

function getScoreGradient(score: number): string {
  if (score <= 40) return 'from-red-500/20 to-red-600/5'
  if (score <= 65) return 'from-yellow-500/20 to-yellow-600/5'
  if (score <= 80) return 'from-green-500/20 to-green-600/5'
  return 'from-emerald-400/20 to-emerald-600/5'
}

interface ComponentInfo {
  key: keyof ScoreData['breakdown']
  label: string
  icon: typeof TrendingUp
  max: number
  tips: { condition: (val: number) => boolean; text: string }[]
}

function getComponents(t: (k: string) => string): ComponentInfo[] {
  return [
    {
      key: 'ahorro',
      label: t('score.detail.ahorro'),
      icon: PiggyBank,
      max: 25,
      tips: [
        { condition: (v) => v >= 20, text: t('score.tips.ahorroExcelente') },
        { condition: (v) => v >= 10, text: t('score.tips.ahorroBueno') },
        { condition: () => true, text: t('score.tips.ahorroBajo') },
      ],
    },
    {
      key: 'presupuesto',
      label: t('score.detail.presupuesto'),
      icon: Wallet,
      max: 25,
      tips: [
        { condition: (v) => v >= 20, text: t('score.tips.presupuestoExcelente') },
        { condition: (v) => v >= 10, text: t('score.tips.presupuestoBueno') },
        { condition: () => true, text: t('score.tips.presupuestoBajo') },
      ],
    },
    {
      key: 'deuda',
      label: t('score.detail.deuda'),
      icon: AlertTriangle,
      max: 25,
      tips: [
        { condition: (v) => v >= 20, text: t('score.tips.deudaExcelente') },
        { condition: (v) => v >= 10, text: t('score.tips.deudaBueno') },
        { condition: () => true, text: t('score.tips.deudaBajo') },
      ],
    },
    {
      key: 'emergencia',
      label: t('score.detail.emergencia'),
      icon: ShieldCheck,
      max: 25,
      tips: [
        { condition: (v) => v >= 20, text: t('score.tips.emergenciaExcelente') },
        { condition: (v) => v >= 10, text: t('score.tips.emergenciaBueno') },
        { condition: () => true, text: t('score.tips.emergenciaBajo') },
      ],
    },
  ]
}

function getTipForComponent(component: ComponentInfo, value: number): string {
  for (const tip of component.tips) {
    if (tip.condition(value)) return tip.text
  }
  return ''
}

export function ScorePage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading } = useScore()

  const components = getComponents(t)

  if (isLoading) {
    return (
      <div className="animate-fade-in p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="animate-fade-in p-4 md:p-6">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline mb-4">
          <ArrowLeft size={16} /> {t('common.back')}
        </button>
        <div className="text-center py-20 text-[var(--text-muted)]">
          <Info size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('score.detail.noData')}</p>
        </div>
      </div>
    )
  }

  const color = getScoreColor(data.score)
  const gradient = getScoreGradient(data.score)
  const estadoLabel = t(`score.${data.estado}`)

  // Find weakest component for main recommendation
  const weakest = components.reduce((min, c) =>
    data.breakdown[c.key] < data.breakdown[min.key] ? c : min, components[0])

  return (
    <div className="animate-fade-in p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--surface-raised)] hover:bg-[var(--border)] transition-colors"
        >
          <ArrowLeft size={16} className="text-[var(--text-muted)]" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          {t('score.title')}
        </h1>
      </div>

      {/* Main score card */}
      <div className={cn(
        'card-glass rounded-2xl p-6 sm:p-8 bg-gradient-to-br',
        gradient
      )}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Score circle */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" opacity="0.3" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(data.score / 100) * 327} 327`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl font-bold tabular-nums" style={{ color }}>
                {data.score}
              </span>
              <span className="text-xs text-[var(--text-muted)]">/100</span>
            </div>
          </div>

          {/* Status + summary */}
          <div className="text-center sm:text-left flex-1">
            <span
              className="inline-block text-sm font-bold px-3 py-1 rounded-full mb-3"
              style={{ color, backgroundColor: `${color}22` }}
            >
              {estadoLabel}
            </span>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {t('score.detail.summary', {
                score: data.score,
                estado: estadoLabel.toLowerCase(),
              })}
            </p>
            {data.score < 80 && (
              <div className="mt-3 flex items-start gap-2 bg-[var(--surface-raised)] rounded-xl p-3">
                <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color }} />
                <p className="text-xs text-[var(--text-muted)]">
                  <span className="font-semibold text-[var(--text-primary)]">{t('score.detail.focus')}:</span>{' '}
                  {getTipForComponent(weakest, data.breakdown[weakest.key])}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Components breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
          {t('score.detail.breakdown')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {components.map((comp) => {
            const val = data.breakdown[comp.key]
            const pct = (val / comp.max) * 100
            const compColor = getScoreColor(val * 4)
            const Icon = comp.icon
            const tip = getTipForComponent(comp, val)

            return (
              <div
                key={comp.key}
                className="card-glass rounded-2xl p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${compColor}18` }}
                    >
                      <Icon size={18} style={{ color: compColor }} />
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {comp.label}
                    </span>
                  </div>
                  <span className="text-lg font-bold tabular-nums" style={{ color: compColor }}>
                    {val}<span className="text-xs text-[var(--text-muted)] font-normal">/{comp.max}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[var(--border)] dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: compColor }}
                  />
                </div>

                {/* Tip */}
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {tip}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* How it works section */}
      <div className="card-glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          {t('score.detail.howItWorks')}
        </h2>
        <div className="space-y-2 text-xs text-[var(--text-muted)] leading-relaxed">
          <p>• <strong>{t('score.detail.ahorro')}</strong> (25 pts): {t('score.detail.howAhorro')}</p>
          <p>• <strong>{t('score.detail.presupuesto')}</strong> (25 pts): {t('score.detail.howPresupuesto')}</p>
          <p>• <strong>{t('score.detail.deuda')}</strong> (25 pts): {t('score.detail.howDeuda')}</p>
          <p>• <strong>{t('score.detail.emergencia')}</strong> (25 pts): {t('score.detail.howEmergencia')}</p>
        </div>
      </div>
    </div>
  )
}
