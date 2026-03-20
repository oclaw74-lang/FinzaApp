import { createPortal } from 'react-dom'
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

  // Fix #5 — Ensure all fields (including tasa_interes, cuota_mensual, plazo_meses, acreedor_tipo)
  // are pre-populated when opening in edit mode
  const defaultValues: Partial<PrestamoFormData> | undefined = prestamo
    ? ({
        tipo: prestamo.tipo,
        acreedor_tipo: prestamo.acreedor_tipo ?? 'persona',
        persona: prestamo.persona,
        monto_original: prestamo.monto_original,
        moneda: prestamo.moneda,
        fecha_prestamo: prestamo.fecha_prestamo,
        fecha_vencimiento: prestamo.fecha_vencimiento ?? '',
        descripcion: prestamo.descripcion ?? '',
        notas: prestamo.notas ?? '',
        tasa_interes: prestamo.tasa_interes ?? null,
        plazo_meses: prestamo.plazo_meses ?? null,
        monto_ya_pagado: prestamo.monto_ya_pagado ?? 0,
      } as Partial<PrestamoFormData>)
    : undefined

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
      <div className="relative bg-white dark:bg-[#0d1520] dark:border dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">{title}</h2>
        <PrestamoForm
          defaultValues={defaultValues}
          prestamo={prestamo}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </div>
    </div>,
    document.body
  )
}
