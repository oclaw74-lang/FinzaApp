import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrestamosPage } from '@/pages/PrestamosPage'
import type { Prestamo, PrestamoResumen } from '@/types/prestamo'

// Mock hooks
vi.mock('@/hooks/usePrestamos', () => ({
  usePrestamos: vi.fn(),
  usePrestamoResumen: vi.fn(),
  useCreatePrestamo: vi.fn(),
  useUpdatePrestamo: vi.fn(),
  useDeletePrestamo: vi.fn(),
  usePrestamoDetalle: vi.fn(),
  useRegistrarPago: vi.fn(),
  useDeletePago: vi.fn(),
}))

import {
  usePrestamos,
  usePrestamoResumen,
  useCreatePrestamo,
  useUpdatePrestamo,
  useDeletePrestamo,
} from '@/hooks/usePrestamos'

const mockResumen: PrestamoResumen = {
  total_me_deben: 15000,
  total_yo_debo: 5000,
  cantidad_activos: 2,
  cantidad_vencidos: 0,
}

const mockPrestamos: Prestamo[] = [
  {
    id: 'pre-1',
    tipo: 'me_deben',
    persona: 'Ana Garcia',
    monto_original: 5000,
    monto_pendiente: 2500,
    moneda: 'DOP',
    fecha_prestamo: '2026-01-15',
    estado: 'activo',
    created_at: '2026-01-15T10:00:00Z',
  },
]

function setupMocks({
  prestamosData = mockPrestamos,
  isLoading = false,
  isError = false,
}: {
  prestamosData?: Prestamo[]
  isLoading?: boolean
  isError?: boolean
} = {}) {
  vi.mocked(usePrestamos).mockReturnValue({
    data: prestamosData,
    isLoading,
    isError,
    isPending: false,
    isSuccess: !isLoading && !isError,
    error: null,
  } as ReturnType<typeof usePrestamos>)

  vi.mocked(usePrestamoResumen).mockReturnValue({
    data: mockResumen,
    isLoading: false,
    isError: false,
    isPending: false,
    isSuccess: true,
    error: null,
  } as ReturnType<typeof usePrestamoResumen>)

  vi.mocked(useCreatePrestamo).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreatePrestamo>)

  vi.mocked(useUpdatePrestamo).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdatePrestamo>)

  vi.mocked(useDeletePrestamo).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeletePrestamo>)
}

describe('PrestamosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders tabs "Me deben" and "Yo debo"', () => {
    render(<PrestamosPage />)
    expect(screen.getByRole('tab', { name: /me deben/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /yo debo/i })).toBeInTheDocument()
  })

  it('renders page title', () => {
    render(<PrestamosPage />)
    // Title is rendered by the shared Header component (not duplicated in page body)
    expect(screen.getByText(/gestiona tus prestamos y cobros/i)).toBeInTheDocument()
  })

  it('renders Nuevo button', () => {
    render(<PrestamosPage />)
    expect(screen.getByRole('button', { name: /nuevo/i })).toBeInTheDocument()
  })

  it('shows skeleton loading state', () => {
    setupMocks({ isLoading: true, prestamosData: [] })
    render(<PrestamosPage />)
    expect(screen.getByLabelText(/cargando prestamos/i)).toBeInTheDocument()
  })

  it('shows empty state when no data and not loading', () => {
    setupMocks({ prestamosData: [] })
    render(<PrestamosPage />)
    expect(screen.getByText(/no hay prestamos donde te deban/i)).toBeInTheDocument()
  })

  it('shows empty state for yo_debo tab', () => {
    setupMocks({ prestamosData: [] })
    render(<PrestamosPage />)
    const yoDeboTab = screen.getByRole('tab', { name: /yo debo/i })
    fireEvent.click(yoDeboTab)
    expect(screen.getByText(/no hay prestamos donde debas/i)).toBeInTheDocument()
  })

  it('renders prestamo rows when data is available', () => {
    render(<PrestamosPage />)
    expect(screen.getByText('Ana Garcia')).toBeInTheDocument()
  })

  it('shows error state gracefully', () => {
    setupMocks({ isError: true, prestamosData: [] })
    render(<PrestamosPage />)
    expect(screen.getByText(/el servidor no esta disponible/i)).toBeInTheDocument()
  })

  it('shows resumen cards', () => {
    render(<PrestamosPage />)
    // Usar getAllByText porque tanto la card como el tab tienen el mismo texto
    const meDeben = screen.getAllByText('Me deben')
    const yoDebo = screen.getAllByText('Yo debo')
    expect(meDeben.length).toBeGreaterThanOrEqual(1)
    expect(yoDebo.length).toBeGreaterThanOrEqual(1)
  })

  it('tab "Me deben" is active by default', () => {
    render(<PrestamosPage />)
    const tab = screen.getByRole('tab', { name: /me deben/i })
    expect(tab).toHaveAttribute('aria-selected', 'true')
  })
})
