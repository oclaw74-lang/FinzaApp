import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EgresosPage } from '@/pages/EgresosPage'
import type { EgresoResponse, PaginatedResponse, CategoriaResponse } from '@/types/transacciones'

vi.mock('@/hooks/useEgresos', () => ({
  useEgresos: vi.fn(),
  useCreateEgreso: vi.fn(),
  useDeleteEgreso: vi.fn(),
}))

vi.mock('@/hooks/useCategorias', () => ({
  useCategorias: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { useEgresos, useCreateEgreso, useDeleteEgreso } from '@/hooks/useEgresos'
import { useCategorias } from '@/hooks/useCategorias'
import { toast } from 'sonner'

const mockCategorias: CategoriaResponse[] = [
  { id: 'cat-1', nombre: 'Alimentacion', tipo: 'egreso', icono: null, color: null, es_sistema: true },
]

// Helper to build a date in current month/year for local timezone
function currentMonthDate(day: number): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`
}

const mockEgresos: EgresoResponse[] = [
  {
    id: 'egr-1',
    categoria_id: 'cat-1',
    subcategoria_id: null,
    monto: '3000.00',
    moneda: 'DOP',
    descripcion: 'Supermercado',
    metodo_pago: 'efectivo',
    fecha: currentMonthDate(5),
    notas: null,
  },
  {
    id: 'egr-2',
    categoria_id: 'cat-1',
    subcategoria_id: null,
    monto: '500.00',
    moneda: 'DOP',
    descripcion: 'Farmacia Local',
    metodo_pago: 'tarjeta',
    fecha: currentMonthDate(10),
    notas: null,
  },
]

const mockPaginatedData: PaginatedResponse<EgresoResponse> = {
  items: mockEgresos,
  total: 2,
  page: 1,
  page_size: 200,
  has_next: false,
}

function setupMocks({
  data = mockPaginatedData,
  isLoading = false,
}: {
  data?: PaginatedResponse<EgresoResponse> | undefined
  isLoading?: boolean
} = {}) {
  vi.mocked(useEgresos).mockReturnValue({
    data,
    isLoading,
    isPending: isLoading,
    isSuccess: !isLoading,
    isError: false,
    error: null,
  } as ReturnType<typeof useEgresos>)

  vi.mocked(useCategorias).mockReturnValue({
    data: mockCategorias,
    isLoading: false,
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
  } as ReturnType<typeof useCategorias>)

  vi.mocked(useCreateEgreso).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateEgreso>)

  vi.mocked(useDeleteEgreso).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteEgreso>)
}

describe('EgresosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders correctly with default props', () => {
    render(<EgresosPage />)
    // Title is rendered by the shared Header component (not duplicated in page body)
    expect(screen.getByLabelText('Mes')).toBeInTheDocument()
  })

  it('shows loading state while fetching', () => {
    setupMocks({ isLoading: true, data: undefined })
    render(<EgresosPage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows empty state when no data', () => {
    setupMocks({
      data: { items: [], total: 0, page: 1, page_size: 200, has_next: false },
    })
    render(<EgresosPage />)
    expect(screen.getByText(/no hay egresos registrados este mes/i)).toBeInTheDocument()
  })

  it('displays data correctly when loaded', () => {
    render(<EgresosPage />)
    expect(screen.getByText('Supermercado')).toBeInTheDocument()
    expect(screen.getByText('Farmacia Local')).toBeInTheDocument()
  })

  it('renders stats cards', () => {
    render(<EgresosPage />)
    expect(screen.getByText('Total del mes')).toBeInTheDocument()
    expect(screen.getByText('Transacciones')).toBeInTheDocument()
  })

  it('renders nuevo egreso button', () => {
    render(<EgresosPage />)
    const buttons = screen.getAllByRole('button', { name: /nuevo egreso/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('handles user interaction: search filter filters by description', () => {
    render(<EgresosPage />)
    const searchInput = screen.getByPlaceholderText(/buscar/i)
    fireEvent.change(searchInput, { target: { value: 'Supermercado' } })
    expect(screen.getByText('Supermercado')).toBeInTheDocument()
    expect(screen.queryByText('Farmacia Local')).not.toBeInTheDocument()
  })

  it('calls callbacks with correct arguments on delete', async () => {
    const mockDeleteFn = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteEgreso).mockReturnValue({
      mutateAsync: mockDeleteFn,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteEgreso>)

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<EgresosPage />)
    const deleteButtons = screen.getAllByLabelText('Eliminar')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockDeleteFn).toHaveBeenCalledWith('egr-1')
    })
  })

  it('shows toast success on delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<EgresosPage />)
    const deleteButtons = screen.getAllByLabelText('Eliminar')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('renders amounts with negative sign for expenses', () => {
    render(<EgresosPage />)
    const negativeAmounts = screen.getAllByText(/^-RD\$/)
    expect(negativeAmounts.length).toBeGreaterThan(0)
  })

  it('renders month filter selector', () => {
    render(<EgresosPage />)
    expect(screen.getByLabelText('Mes')).toBeInTheDocument()
  })
})
