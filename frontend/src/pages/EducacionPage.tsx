import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, CheckCircle2, Clock, X } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiError'
import { useLecciones, useCompletarLeccion } from '@/hooks/useEducacion'
import type { LeccionData } from '@/types/educacion'

type NivelTab = 'fundamentos' | 'control' | 'crecimiento'

function SkeletonLeccion(): JSX.Element {
  return (
    <div className="finza-card p-4 animate-pulse space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

interface LeccionModalProps {
  leccion: LeccionData
  onClose: () => void
  onCompletar: (id: string) => void
  isLoading: boolean
}

function LeccionModal({ leccion, onClose, onCompletar, isLoading }: LeccionModalProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label={leccion.titulo}
    >
      <div className="finza-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Modal header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[var(--border)]">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--text-muted)] mb-1">{leccion.duracion_minutos} {t('educacion.minutos')}</p>
            <h2 className="text-base font-bold text-[var(--text-primary)]">{leccion.titulo}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal content */}
        <div className="p-5 space-y-4">
          {/* Hook */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">
              {t('educacion.hook')}
            </p>
            <p className="text-sm text-[var(--text-primary)]">{leccion.contenido_json.hook}</p>
          </div>

          {/* Concept */}
          <div className="bg-[var(--surface-raised)] rounded-xl p-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wide">
              {t('educacion.concept')}
            </p>
            <p className="text-sm text-[var(--text-primary)]">{leccion.contenido_json.concept}</p>
          </div>

          {/* Action */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1 uppercase tracking-wide">
              {t('educacion.action')}
            </p>
            <p className="text-sm text-[var(--text-primary)]">{leccion.contenido_json.action}</p>
          </div>

          {/* Tip */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wide">
              {t('educacion.tip')}
            </p>
            <p className="text-sm text-[var(--text-primary)]">{leccion.contenido_json.tip}</p>
          </div>
        </div>

        {/* Modal footer */}
        {!leccion.completada && (
          <div className="p-5 border-t border-[var(--border)]">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onCompletar(leccion.id)}
              className="finza-btn w-full justify-center"
            >
              <CheckCircle2 size={16} />
              {t('educacion.marcarCompletada')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface LeccionCardProps {
  leccion: LeccionData
  onClick: (leccion: LeccionData) => void
}

function LeccionCard({ leccion, onClick }: LeccionCardProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={() => !leccion.completada && onClick(leccion)}
      className={cn(
        'finza-card p-4 text-left w-full space-y-2 transition-all',
        leccion.completada
          ? 'opacity-70 cursor-default'
          : 'finza-card-hover cursor-pointer'
      )}
      aria-label={leccion.titulo}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--text-primary)] flex-1">{leccion.titulo}</p>
        {leccion.completada ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 shrink-0">
            <CheckCircle2 size={12} />
            {t('educacion.completada')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[var(--surface-raised)] text-[var(--text-muted)] shrink-0">
            {t('educacion.pendiente')}
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{leccion.descripcion_corta}</p>
      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
        <Clock size={12} aria-hidden="true" />
        <span>{leccion.duracion_minutos} {t('educacion.minutos')}</span>
      </div>
    </button>
  )
}

export function EducacionPage(): JSX.Element {
  const { t } = useTranslation()
  const [tabActiva, setTabActiva] = useState<NivelTab>('fundamentos')
  const [leccionAbierta, setLeccionAbierta] = useState<LeccionData | null>(null)

  const { data: lecciones = [], isLoading } = useLecciones()
  const completar = useCompletarLeccion()

  const totalCompletadas = lecciones.filter((l) => l.completada).length
  const totalLecciones = lecciones.length

  const leccionesFiltradas = lecciones
    .filter((l) => l.nivel === tabActiva)
    .sort((a, b) => a.orden - b.orden)

  const tabs: { value: NivelTab; label: string }[] = [
    { value: 'fundamentos', label: t('educacion.fundamentos') },
    { value: 'control', label: t('educacion.control') },
    { value: 'crecimiento', label: t('educacion.crecimiento') },
  ]

  const handleCompletar = async (leccionId: string): Promise<void> => {
    try {
      await completar.mutateAsync(leccionId)
      toast.success(t('educacion.leccionCompletada'))
      setLeccionAbierta(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('educacion.title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t('educacion.subtitle')}</p>
      </div>

      {/* Progreso global */}
      {!isLoading && totalLecciones > 0 && (
        <div className="finza-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {totalCompletadas} {t('common.of')} {totalLecciones} {t('educacion.progreso')}
            </p>
            <p className="text-sm font-bold text-[var(--accent)]">
              {Math.round((totalCompletadas / totalLecciones) * 100)}%
            </p>
          </div>
          <div className="h-2 bg-[var(--surface-raised)] rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(totalCompletadas / totalLecciones) * 100}%`,
                backgroundColor: 'var(--success)',
              }}
              role="progressbar"
              aria-valuenow={totalCompletadas}
              aria-valuemin={0}
              aria-valuemax={totalLecciones}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="finza-card p-0 overflow-hidden">
        <div className="flex gap-1 border-b border-[var(--border)] px-4 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={tabActiva === tab.value}
              onClick={() => setTabActiva(tab.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                tabActiva === tab.value
                  ? 'border-finza-blue text-finza-blue'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {isLoading && (
            <>
              <SkeletonLeccion />
              <SkeletonLeccion />
              <SkeletonLeccion />
            </>
          )}

          {!isLoading && leccionesFiltradas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen
                size={32}
                className="text-[var(--text-muted)] opacity-40 mb-2"
                aria-hidden="true"
              />
              <p className="text-sm text-[var(--text-muted)]">{t('common.noData')}</p>
            </div>
          )}

          {!isLoading &&
            leccionesFiltradas.map((leccion) => (
              <LeccionCard
                key={leccion.id}
                leccion={leccion}
                onClick={setLeccionAbierta}
              />
            ))}
        </div>
      </div>

      {/* Modal de leccion */}
      {leccionAbierta && (
        <LeccionModal
          leccion={leccionAbierta}
          onClose={() => setLeccionAbierta(null)}
          onCompletar={handleCompletar}
          isLoading={completar.isPending}
        />
      )}
    </div>
  )
}
