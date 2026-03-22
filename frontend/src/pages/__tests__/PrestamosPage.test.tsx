import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrestamosPage } from '@/pages/PrestamosPage'

vi.mock('@/hooks/usePrestamos', () => ({
  usePrestamos: vi.fn(),
  useCreatePrestamo: vi.fn(),
  useUpdatePrestamo: vi.fn(),
  useDeletePrestamo: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

vi.mock('@/features/prestamos/components/PrestamoResumenCards', () => ({
  PrestamoResumenCards: () => <div data-testid="resumen-cards" />,
}))

vi.mock('@/features/prestamos/components/PrestamoRow', () => ({
  PrestamoRow: (props: any) => (
    <div data-testid="prestamo-row" onClick={() => props.onClick(props.prestamo)}>
      {props.prestamo.persona}
    </div>
  ),
}))

vi.mock('@/features/prestamos/components/PrestamoModal', () => ({
  PrestamoModal: (props: any) => props.isOpen ? <div data-testid="prestamo-modal" /> : null,
}))

vi.mock('@/features/prestamos/components/PrestamoDetail', () => ({
  PrestamoDetail: () => null,
}))

vi.mock('@/components/dashboard/ComparativaCard', () => ({
  ComparativaCard: () => <div data-testid="comparativa-card" />,
}))

import { usePrestamos, useCreatePrestamo, useUpdatePrestamo, useDeletePrestamo } from '@/hooks/usePrestamos'

const mockPrestamos = [
  { id: 'p-1', tipo: 'me_deben' as const, acreedor_tipo: 'persona' as const, persona: 'Juan', monto_original: 5000, monto_pendiente: 5000, monto_ya_pagado: 0, moneda: 'DOP', fecha_prestamo: '2024-01-01', estado: 'activo' as const, created_at: '2024-01-01T00:00:00Z' },
  { id: 'p-2', tipo: 'yo_debo' as const, acreedor_tipo: 'persona' as const, persona: 'Maria', monto_original: 10000, monto_pendiente: 10000, monto_ya_pagado: 0, moneda: 'DOP', fecha_prestamo: '2024-01-01', estado: 'activo' as const, created_at: '2024-01-01T00:00:00Z' },
]

function setup({ data = mockPrestamos, isLoading = false } = {}) {
  vi.mocked(usePrestamos).mockReturnValue({
    data,
    isLoading,
    isError: false,
    error: null,
  } as ReturnType<typeof usePrestamos>)

  vi.mocked(useCreatePrestamo).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as unknown as ReturnType<typeof useCreatePrestamo>)

  vi.mocked(useUpdatePrestamo).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdatePrestamo>)

  vi.mocked(useDeletePrestamo).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useDeletePrestamo>)
}

describe('PrestamosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setup()
  })

  it('renders loading skeleton when isLoading', () => {
    setup({ data: [], isLoading: true })
    render(<PrestamosPage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows empty state when no prestamos', () => {
    setup({ data: [], isLoading: false })
    render(<PrestamosPage />)
    expect(screen.getByText('prestamos.noPrestamos')).toBeInTheDocument()
  })

  it('shows prestamo rows when data loaded', () => {
    render(<PrestamosPage />)
    expect(screen.getByText('Juan')).toBeInTheDocument()
    expect(screen.getByText('Maria')).toBeInTheDocument()
  })

  it('shows nuevo prestamo button', () => {
    render(<PrestamosPage />)
    const buttons = screen.getAllByRole('button')
    const newButton = buttons.find(b => b.textContent?.includes('common.new'))
    expect(newButton).toBeDefined()
  })

  it('renders ComparativaCard', () => {
    render(<PrestamosPage />)
    expect(screen.getByTestId('comparativa-card')).toBeInTheDocument()
  })
})
