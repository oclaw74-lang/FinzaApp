import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IngresosPage } from '@/pages/IngresosPage'
import type { IngresoResponse, PaginatedResponse } from '@/types/transacciones'
import type { CategoriaResponse } from '@/types/transacciones'

vi.mock('@/hooks/useIngresos', () => ({
  useIngresos: vi.fn(),
  useCreateIngreso: vi.fn(),
  useUpdateIngreso: vi.fn(),
  useDeleteIngreso: vi.fn(),
}))

vi.mock('@/hooks/useCategorias', () => ({
  useCategorias: vi.fn(),
}))

// TransaccionForm imports useTarjetas → api.ts → supabase.ts (throws without env vars)
vi.mock('@/hooks/useTarjetas', () => ({
  useTarjetas: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateTarjeta: vi.fn(),
  useUpdateTarjeta: vi.fn(),
  useDeleteTarjeta: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { useIngresos, useCreateIngreso, useUpdateIngreso, useDeleteIngreso } from '@/hooks/useIngresos'
import { useCategorias } from '@/hooks/useCategorias'
import { toast } from 'sonner'

const mockCategorias: CategoriaResponse[] = [
  { id: 'cat-1', nombre: 'Salario', tipo: 'ingreso', icono: null, color: null, es_sistema: true },
]

// Helper to build a date in current month/year for local timezone
function currentMonthDate(day: number): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  // Use T12:00:00 to avoid UTC date edge issues
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`
}

const mockIngresos: IngresoResponse[] = [
  {
    id: 'ing-1',
    categoria_id: 'cat-1',
    subcategoria_id: null,
    monto: '5000.00',
    moneda: 'DOP',
    descripcion: 'Salario mensual',
    fuente: null,
    fecha: currentMonthDate(1),
    notas: null,
  },
  {
    id: 'ing-2',
    categoria_id: 'cat-1',
    subcategoria_id: null,
    monto: '1200.00',
    moneda: 'DOP',
    descripcion: 'Freelance Extra',
    fuente: null,
    fecha: currentMonthDate(15),
    notas: null,
  },
]

const mockPaginatedData: PaginatedResponse<IngresoResponse> = {
  items: mockIngresos,
  total: 2,
  page: 1,
  page_size: 200,
  has_next: false,
}

function setupMocks({
  data = mockPaginatedData,
  isLoading = false,
}: {
  data?: PaginatedResponse<IngresoResponse> | undefined
  isLoading?: boolean
} = {}) {
  vi.mocked(useIngresos).mockReturnValue({
    data,
    isLoading,
    isPending: isLoading,
    isSuccess: !isLoading,
    isError: false,
    error: null,
  } as ReturnType<typeof useIngresos>)

  vi.mocked(useCategorias).mockReturnValue({
    data: mockCategorias,
    isLoading: false,
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
  } as ReturnType<typeof useCategorias>)

  vi.mocked(useCreateIngreso).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateIngreso>)

  vi.mocked(useUpdateIngreso).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateIngreso>)

  vi.mocked(useDeleteIngreso).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteIngreso>)
}

describe('IngresosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders correctly with default props', () => {
    render(<IngresosPage />)
    // Title is rendered by the shared Header component (not duplicated in page body)
    expect(screen.getByLabelText('Mes')).toBeInTheDocument()
  })

  it('shows loading state while fetching', () => {
    setupMocks({ isLoading: true, data: undefined })
    render(<IngresosPage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows empty state when no data', () => {
    setupMocks({
      data: { items: [], total: 0, page: 1, page_size: 200, has_next: false },
    })
    render(<IngresosPage />)
    expect(screen.getByText(/no hay ingresos registrados este mes/i)).toBeInTheDocument()
  })

  it('displays data correctly when loaded', () => {
    render(<IngresosPage />)
    expect(screen.getByText('Salario mensual')).toBeInTheDocument()
    expect(screen.getByText('Freelance Extra')).toBeInTheDocument()
  })

  it('renders stats cards', () => {
    render(<IngresosPage />)
    expect(screen.getByText('Total del mes')).toBeInTheDocument()
    expect(screen.getByText('Transacciones')).toBeInTheDocument()
  })

  it('renders nuevo ingreso button in header', () => {
    render(<IngresosPage />)
    const buttons = screen.getAllByRole('button', { name: /nuevo ingreso/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders month filter selector', () => {
    render(<IngresosPage />)
    expect(screen.getByLabelText('Mes')).toBeInTheDocument()
  })

  it('handles user interaction: search filter filters by description', () => {
    render(<IngresosPage />)
    const searchInput = screen.getByPlaceholderText(/buscar/i)
    // 'mensual' is unique to 'Salario mensual' — does not match 'Freelance Extra'
    fireEvent.change(searchInput, { target: { value: 'mensual' } })
    expect(screen.getByText('Salario mensual')).toBeInTheDocument()
    expect(screen.queryByText('Freelance Extra')).not.toBeInTheDocument()
  })

  it('shows delete buttons for each row', () => {
    render(<IngresosPage />)
    const deleteButtons = screen.getAllByLabelText('Eliminar')
    expect(deleteButtons).toHaveLength(2)
  })

  it('calls delete with correct id on confirmation', async () => {
    const mockDeleteFn = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteIngreso).mockReturnValue({
      mutateAsync: mockDeleteFn,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteIngreso>)

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<IngresosPage />)
    const deleteButtons = screen.getAllByLabelText('Eliminar')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockDeleteFn).toHaveBeenCalledWith('ing-1')
    })
  })

  it('shows toast success on successful delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<IngresosPage />)
    const deleteButtons = screen.getAllByLabelText('Eliminar')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('renders amounts with positive sign in table', () => {
    render(<IngresosPage />)
    // Income amounts show with '+' prefix
    const amountCells = screen.getAllByText(/^\+RD\$/)
    expect(amountCells.length).toBeGreaterThan(0)
  })
})
