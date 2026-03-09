import { PrestamoForm } from './PrestamoForm'
import type { PrestamoFormData } from './PrestamoForm'
import type { Prestamo } from '@/types/prestamo'

interface PrestamoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PrestamoFormData) => Promise<void>
  isLoading?: boolean
  prestamo?: Prestamo
}

export function PrestamoModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  prestamo,
}: PrestamoModalProps): JSX.Element | null {
  if (!isOpen) return null

  const title = prestamo ? 'Editar prestamo' : 'Nuevo prestamo'

  const defaultValues: Partial<PrestamoFormData> | undefined = prestamo
    ? ({
        tipo: prestamo.tipo,
        persona: prestamo.persona,
        monto_original: prestamo.monto_original,
        moneda: prestamo.moneda,
        fecha_prestamo: prestamo.fecha_prestamo,
        fecha_vencimiento: prestamo.fecha_vencimiento ?? '',
        descripcion: prestamo.descripcion ?? '',
        notas: prestamo.notas ?? '',
      } as Partial<PrestamoFormData>)
    : undefined

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
      <div className="relative bg-white rounded-card shadow-card-hover w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
        <PrestamoForm
          defaultValues={defaultValues}
          prestamo={prestamo}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
