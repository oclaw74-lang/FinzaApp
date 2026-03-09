import { Trash2, X } from 'lucide-react'
import { PresupuestoForm } from './PresupuestoForm'
import type { PresupuestoFormData } from './PresupuestoForm'

interface PresupuestoModalProps {
  isOpen: boolean
  mes: number
  year: number
  categoriaIdInicial?: string
  montoLimiteInicial?: number
  isEditing?: boolean
  errorMessage?: string | null
  onClose: () => void
  onSubmit: (data: PresupuestoFormData) => Promise<void>
  onDelete?: () => void
  isLoading?: boolean
}

export function PresupuestoModal({
  isOpen,
  mes,
  year,
  categoriaIdInicial,
  montoLimiteInicial,
  isEditing = false,
  errorMessage,
  onClose,
  onSubmit,
  onDelete,
  isLoading,
}: PresupuestoModalProps): JSX.Element | null {
  if (!isOpen) return null

  const title = isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-card shadow-card-hover w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-gray-400 hover:text-alert-red transition-colors"
                aria-label="Eliminar presupuesto"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <PresupuestoForm
          mes={mes}
          year={year}
          categoriaIdInicial={categoriaIdInicial}
          montoLimiteInicial={montoLimiteInicial}
          isEditing={isEditing}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
