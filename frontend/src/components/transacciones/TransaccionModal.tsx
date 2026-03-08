import { TransaccionForm } from './TransaccionForm'
import type { IngresoFormData, EgresoFormData } from './TransaccionForm'

interface TransaccionModalProps {
  tipo: 'ingreso' | 'egreso'
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: IngresoFormData | EgresoFormData) => Promise<void>
  isLoading?: boolean
  title?: string
}

export function TransaccionModal({
  tipo,
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
}: TransaccionModalProps): JSX.Element | null {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? (tipo === 'ingreso' ? 'Nuevo ingreso' : 'Nuevo egreso')}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-card shadow-card-hover w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {title ?? (tipo === 'ingreso' ? 'Nuevo ingreso' : 'Nuevo egreso')}
        </h2>
        <TransaccionForm
          tipo={tipo}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
