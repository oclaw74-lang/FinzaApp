import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { MetaForm } from './MetaForm'
import type { MetaFormData } from './MetaForm'
import type { MetaAhorro } from '@/types/meta_ahorro'

interface MetaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MetaFormData) => Promise<void>
  isLoading?: boolean
  meta?: MetaAhorro
}

export function MetaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  meta,
}: MetaModalProps): JSX.Element | null {
  if (!isOpen) return null

  const title = meta ? 'Editar meta' : 'Nueva meta de ahorro'

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-card shadow-card-hover w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <MetaForm
          meta={meta}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </div>
    </div>,
    document.body
  )
}
