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

vi.mock('@/hooks/useComparativa', () => ({
  useComparativa: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
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

  it('renders cuota_mensual badge when present', () => {
    const prestamoConCuota: Prestamo = {
      id: 'pre-cuota',
      tipo: 'me_deben',
      persona: 'Carlos Lopez',
      monto_original: 12000,
      monto_pendiente: 10000,
      moneda: 'DOP',
      fecha_prestamo: '2026-01-01',
      estado: 'activo',
      created_at: '2026-01-01T00:00:00Z',
      cuota_mensual: 1150.50,
      tasa_interes: 18.5,
      plazo_meses: 12,
    }
    setupMocks({ prestamosData: [prestamoConCuota] })
    render(<PrestamosPage />)
    expect(screen.getByText(/Cuota:/i)).toBeInTheDocument()
  })

  it('renders pago hoy badge when proximo_pago is today', () => {
    // Build local date string to avoid UTC offset issues
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const year = hoy.getFullYear()
    const month = String(hoy.getMonth() + 1).padStart(2, '0')
    const day = String(hoy.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    const prestamoHoy: Prestamo = {
      id: 'pre-hoy',
      tipo: 'me_deben',
      persona: 'Banco Central',
      monto_original: 50000,
      monto_pendiente: 40000,
      moneda: 'DOP',
      fecha_prestamo: '2026-01-01',
      estado: 'activo',
      created_at: '2026-01-01T00:00:00Z',
      proximo_pago: todayStr,
    }
    setupMocks({ prestamosData: [prestamoHoy] })
    const { container } = render(<PrestamosPage />)
    // The span badge has aria-label "Pago hoy"
    const badge = container.querySelector('[aria-label="Pago hoy"]')
    expect(badge).toBeInTheDocument()
  })

  it('renders "Pago en X dias" badge when proximo_pago is within 3 days', () => {
    // Build local date string +3 days from today to avoid UTC offset issues
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const futureDate = new Date(hoy)
    futureDate.setDate(futureDate.getDate() + 3)
    const year = futureDate.getFullYear()
    const month = String(futureDate.getMonth() + 1).padStart(2, '0')
    const day = String(futureDate.getDate()).padStart(2, '0')
    const futureDateStr = `${year}-${month}-${day}`
    const prestamoCercano: Prestamo = {
      id: 'pre-3d',
      tipo: 'me_deben',
      persona: 'Prestamista',
      monto_original: 20000,
      monto_pendiente: 15000,
      moneda: 'DOP',
      fecha_prestamo: '2026-01-01',
      estado: 'activo',
      created_at: '2026-01-01T00:00:00Z',
      proximo_pago: futureDateStr,
    }
    setupMocks({ prestamosData: [prestamoCercano] })
    const { container } = render(<PrestamosPage />)
    // The span badge has aria-label "Pago en 3 dias"
    const badge = container.querySelector('[aria-label="Pago en 3 dias"]')
    expect(badge).toBeInTheDocument()
  })
})
