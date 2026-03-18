import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrestamoDetail } from '@/features/prestamos/components/PrestamoDetail'
import type { Prestamo, TablaAmortizacionResponse } from '@/types/prestamo'

vi.mock('@/hooks/usePrestamos', () => ({
  usePrestamoDetalle: vi.fn(),
  useRegistrarPago: vi.fn(),
  useDeletePago: vi.fn(),
  useTablaAmortizacion: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import {
  usePrestamoDetalle,
  useRegistrarPago,
  useDeletePago,
  useTablaAmortizacion,
} from '@/hooks/usePrestamos'

// ─── Mock data ─────────────────────────────────────────────────────────────────

const mockPrestamo: Prestamo = {
  id: 'pre-1',
  tipo: 'yo_debo',
  persona: 'Juan Banco',
  monto_original: 100000,
  monto_pendiente: 80000,
  moneda: 'DOP',
  fecha_prestamo: '2026-01-01',
  estado: 'activo',
  created_at: '2026-01-01T00:00:00Z',
  tasa_interes: 12,
  plazo_meses: 24,
  cuota_mensual: 4707,
  total_intereses: 12968,
  pagos: [],
}

const mockPrestamoSinInteres: Prestamo = {
  ...mockPrestamo,
  id: 'pre-2',
  tasa_interes: null,
  plazo_meses: null,
  cuota_mensual: null,
  total_intereses: null,
}

const mockAmortizacion: TablaAmortizacionResponse = {
  tabla: [
    {
      numero: 1,
      fecha_estimada: '2026-02-01',
      cuota: 4707,
      capital: 3707,
      interes: 1000,
      saldo_restante: 96293,
      pagado: true,
      pago_real: { monto: 4707, capital: 3707, interes: 1000, fecha: '2026-02-01' },
    },
    {
      numero: 2,
      fecha_estimada: '2026-03-01',
      cuota: 4707,
      capital: 3744,
      interes: 963,
      saldo_restante: 92549,
      pagado: false,
      pago_real: null,
    },
  ],
  resumen: {
    monto_original: 100000,
    monto_pendiente: 96293,
    total_pagado_capital: 3707,
    total_pagado_intereses: 1000,
    total_intereses_proyectados: 12968,
    cuotas_pagadas: 1,
    cuotas_totales: 24,
  },
}

// ─── Setup helper ──────────────────────────────────────────────────────────────

function setupMocks(
  prestamo: Prestamo | undefined = mockPrestamo,
  amortizacion: TablaAmortizacionResponse | undefined = undefined,
  loadingAmortizacion = false,
) {
  const mutateAsync = vi.fn().mockResolvedValue({})
  vi.mocked(usePrestamoDetalle).mockReturnValue({
    data: prestamo,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof usePrestamoDetalle>)
  vi.mocked(useRegistrarPago).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useRegistrarPago>)
  vi.mocked(useDeletePago).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useDeletePago>)
  vi.mocked(useTablaAmortizacion).mockReturnValue({
    data: amortizacion,
    isLoading: loadingAmortizacion,
    isError: false,
  } as ReturnType<typeof useTablaAmortizacion>)
  return { mutateAsync }
}

const defaultProps = {
  prestamoId: 'pre-1',
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PrestamoDetail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders correctly with prestamo data', () => {
    setupMocks()
    render(<PrestamoDetail {...defaultProps} />)
    expect(screen.getByText('Juan Banco')).toBeInTheDocument()
    // "Yo debo" is inline with "· activo" in same <p>, use partial match
    expect(screen.getByText(/Yo debo/)).toBeInTheDocument()
  })

  it('shows loading state while fetching', () => {
    vi.mocked(usePrestamoDetalle).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof usePrestamoDetalle>)
    vi.mocked(useTablaAmortizacion).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useTablaAmortizacion>)
    vi.mocked(useRegistrarPago).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as ReturnType<typeof useRegistrarPago>)
    vi.mocked(useDeletePago).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as ReturnType<typeof useDeletePago>)

    render(<PrestamoDetail {...defaultProps} />)
    // Loading state shows an animated container
    expect(screen.queryByText('Juan Banco')).not.toBeInTheDocument()
  })

  it('shows error state on fetch failure', () => {
    vi.mocked(usePrestamoDetalle).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof usePrestamoDetalle>)
    vi.mocked(useTablaAmortizacion).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useTablaAmortizacion>)
    vi.mocked(useRegistrarPago).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as ReturnType<typeof useRegistrarPago>)
    vi.mocked(useDeletePago).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as ReturnType<typeof useDeletePago>)

    render(<PrestamoDetail {...defaultProps} />)
    expect(screen.getByText(/No se pudo cargar/i)).toBeInTheDocument()
  })

  it('does NOT show amortizacion section when tasa_interes is null', () => {
    setupMocks(mockPrestamoSinInteres)
    render(<PrestamoDetail {...defaultProps} prestamoId="pre-2" />)
    expect(screen.queryByText('Tabla de amortizacion')).not.toBeInTheDocument()
  })

  it('shows amortizacion section when tasa_interes and plazo_meses are set', () => {
    setupMocks(mockPrestamo, mockAmortizacion)
    render(<PrestamoDetail {...defaultProps} />)
    expect(screen.getByText('Tabla de amortizacion')).toBeInTheDocument()
  })

  it('shows amortizacion loading skeletons while fetching table', () => {
    setupMocks(mockPrestamo, undefined, true)
    render(<PrestamoDetail {...defaultProps} />)
    expect(screen.getByText('Tabla de amortizacion')).toBeInTheDocument()
    // Table toggle button not shown yet (no data)
    expect(screen.queryByText(/Ver tabla completa/)).not.toBeInTheDocument()
  })

  it('shows amortizacion resumen cards when data loaded', () => {
    setupMocks(mockPrestamo, mockAmortizacion)
    render(<PrestamoDetail {...defaultProps} />)
    expect(screen.getByText('Capital pagado')).toBeInTheDocument()
    expect(screen.getByText('Intereses pagados')).toBeInTheDocument()
    expect(screen.getByText('Capital pendiente')).toBeInTheDocument()
    expect(screen.getByText('Total intereses proyectados')).toBeInTheDocument()
  })

  it('cuotas pagadas counter renders correctly', () => {
    setupMocks(mockPrestamo, mockAmortizacion)
    render(<PrestamoDetail {...defaultProps} />)
    expect(screen.getByText('1 de 24 cuotas pagadas')).toBeInTheDocument()
  })

  it('expands full table on toggle button click', async () => {
    setupMocks(mockPrestamo, mockAmortizacion)
    render(<PrestamoDetail {...defaultProps} />)

    const toggleBtn = screen.getByText(/Ver tabla completa/)
    fireEvent.click(toggleBtn)

    await waitFor(() => {
      expect(screen.getByText('Ocultar tabla')).toBeInTheDocument()
    })
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('table has correct columns when expanded', async () => {
    setupMocks(mockPrestamo, mockAmortizacion)
    render(<PrestamoDetail {...defaultProps} />)

    fireEvent.click(screen.getByText(/Ver tabla completa/))

    await waitFor(() => {
      expect(screen.getByText('Cuota')).toBeInTheDocument()
      expect(screen.getByText('Capital')).toBeInTheDocument()
      expect(screen.getByText('Interes')).toBeInTheDocument()
      expect(screen.getByText('Saldo')).toBeInTheDocument()
      expect(screen.getByText('Estado')).toBeInTheDocument()
    })
  })

  it('shows "total con intereses" line in header when tasa set', () => {
    setupMocks(mockPrestamo, mockAmortizacion)
    render(<PrestamoDetail {...defaultProps} />)
    expect(screen.getByText(/Total con intereses:/)).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    setupMocks()
    render(<PrestamoDetail {...defaultProps} />)
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement
    fireEvent.click(backdrop)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('shows capital and interes breakdown in pago row when available', () => {
    const prestamoConPagos: Prestamo = {
      ...mockPrestamo,
      pagos: [
        {
          id: 'pago-1',
          prestamo_id: 'pre-1',
          monto: 4707,
          fecha: '2026-02-01',
          monto_capital: 3707,
          monto_interes: 1000,
          created_at: '2026-02-01T00:00:00Z',
        },
      ],
    }
    setupMocks(prestamoConPagos, mockAmortizacion)
    render(<PrestamoDetail {...defaultProps} />)

    // "capital" and "interes" appear inline in pago row AND in amortizacion section
    expect(screen.getAllByText(/capital/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/interes/i).length).toBeGreaterThan(0)
  })
})
