import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TarjetasPage } from '@/pages/TarjetasPage'
import type { Tarjeta } from '@/types/tarjeta'

vi.mock('@/hooks/useTarjetas', () => ({
  useTarjetas: vi.fn(),
  useCreateTarjeta: vi.fn(),
  useUpdateTarjeta: vi.fn(),
  useDeleteTarjeta: vi.fn(),
}))
vi.mock('@/hooks/useMovimientosTarjeta', () => ({
  useMovimientosTarjeta: vi.fn(),
  useRegistrarMovimiento: vi.fn(),
  useEliminarMovimiento: vi.fn(),
}))
vi.mock('@/hooks/useCategorias', () => ({
  useCategorias: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import {
  useTarjetas,
  useCreateTarjeta,
  useUpdateTarjeta,
  useDeleteTarjeta,
} from '@/hooks/useTarjetas'
import {
  useMovimientosTarjeta,
  useRegistrarMovimiento,
  useEliminarMovimiento,
} from '@/hooks/useMovimientosTarjeta'
import { useCategorias } from '@/hooks/useCategorias'

// ─── Mock data ─────────────────────────────────────────────────────────────────

const mockCredito: Tarjeta = {
  id: 't-1',
  user_id: 'u-1',
  banco: 'Visa Popular',
  tipo: 'credito',
  red: 'visa',
  ultimos_digitos: '4242',
  saldo_actual: 15000,
  limite_credito: 50000,
  disponible: 35000,
  fecha_corte: 15,
  fecha_pago: 5,
  color: null,
  activa: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockDebito: Tarjeta = {
  id: 't-2',
  user_id: 'u-1',
  banco: 'Mastercard BHD',
  tipo: 'debito',
  red: 'mastercard',
  ultimos_digitos: '8888',
  saldo_actual: 8000,
  limite_credito: null,
  disponible: null,
  fecha_corte: null,
  fecha_pago: null,
  color: null,
  activa: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockHighUtil: Tarjeta = {
  ...mockCredito,
  id: 't-3',
  banco: 'Amex Roja',
  red: 'amex',
  saldo_actual: 40000,
  limite_credito: 50000,
  disponible: 10000,
  activa: true,
}

const mockInactiva: Tarjeta = {
  ...mockCredito,
  id: 't-4',
  banco: 'Inactiva',
  activa: false,
}

// ─── Setup helper ──────────────────────────────────────────────────────────────

function setupMocks(
  tarjetas: Tarjeta[] = [],
  loading = false,
  error = false,
) {
  const mutateAsync = vi.fn().mockResolvedValue({})
  vi.mocked(useTarjetas).mockReturnValue({
    data: tarjetas,
    isLoading: loading,
    isError: error,
  } as ReturnType<typeof useTarjetas>)
  vi.mocked(useCreateTarjeta).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useCreateTarjeta>)
  vi.mocked(useUpdateTarjeta).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useUpdateTarjeta>)
  vi.mocked(useDeleteTarjeta).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useDeleteTarjeta>)
  vi.mocked(useMovimientosTarjeta).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useMovimientosTarjeta>)
  vi.mocked(useRegistrarMovimiento).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useRegistrarMovimiento>)
  vi.mocked(useEliminarMovimiento).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useEliminarMovimiento>)
  vi.mocked(useCategorias).mockReturnValue({ data: [], isLoading: false } as ReturnType<typeof useCategorias>)
  return { mutateAsync }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('TarjetasPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders empty state when no cards exist', () => {
    setupMocks([])
    render(<TarjetasPage />)
    expect(screen.getByText('Sin tarjetas registradas')).toBeInTheDocument()
  })

  it('renders card list when cards are present', () => {
    setupMocks([mockCredito, mockDebito])
    render(<TarjetasPage />)
    expect(screen.getByText('Visa Popular')).toBeInTheDocument()
    expect(screen.getByText('Mastercard BHD')).toBeInTheDocument()
  })

  it('shows correct stats — total saldo, disponible, activas count', () => {
    setupMocks([mockCredito, mockDebito])
    render(<TarjetasPage />)
    expect(screen.getByText('Total saldo')).toBeInTheDocument()
    expect(screen.getByText('Disponible credito')).toBeInTheDocument()
    expect(screen.getByText('Tarjetas activas')).toBeInTheDocument()
    // 2 activas
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('stats count only active cards', () => {
    setupMocks([mockCredito, mockInactiva])
    render(<TarjetasPage />)
    // Only 1 activa (mockInactiva.activa = false)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('opens "Nueva tarjeta" modal on button click', () => {
    setupMocks([])
    render(<TarjetasPage />)
    fireEvent.click(screen.getByText('Nueva tarjeta'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Nueva tarjeta', { selector: '#modal-title' })).toBeInTheDocument()
  })

  it('shows validation error when ultimos_digitos is not 4 digits', async () => {
    setupMocks([])
    render(<TarjetasPage />)
    fireEvent.click(screen.getByText('Nueva tarjeta'))

    fireEvent.change(screen.getByPlaceholderText('1234'), { target: { value: '12' } })
    fireEvent.click(screen.getByText('Crear tarjeta'))

    await waitFor(() => {
      expect(screen.getByText('Debe tener 4 digitos')).toBeInTheDocument()
    })
  })

  it('shows validation error when limite_credito is missing for credito type', async () => {
    setupMocks([])
    render(<TarjetasPage />)
    fireEvent.click(screen.getByText('Nueva tarjeta'))

    // Fill required fields but leave limite_credito empty
    fireEvent.change(screen.getByPlaceholderText('Banco Popular, BHD, etc.'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByPlaceholderText('1234'), { target: { value: '1234' } })
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1000' } })

    fireEvent.click(screen.getByText('Crear tarjeta'))

    await waitFor(() => {
      expect(screen.getByText('Requerido para tarjeta de credito')).toBeInTheDocument()
    })
  })

  it('calls create mutation on valid form submit', async () => {
    const { mutateAsync } = setupMocks([])
    render(<TarjetasPage />)
    fireEvent.click(screen.getByText('Nueva tarjeta'))

    fireEvent.change(screen.getByPlaceholderText('Banco Popular, BHD, etc.'), { target: { value: 'Mi Visa' } })
    fireEvent.change(screen.getByPlaceholderText('1234'), { target: { value: '9999' } })
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '5000' } })
    fireEvent.change(screen.getByPlaceholderText('50000.00'), { target: { value: '20000' } })

    fireEvent.click(screen.getByText('Crear tarjeta'))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
  })

  it('opens edit modal with pre-filled data when editing', () => {
    setupMocks([mockCredito])
    render(<TarjetasPage />)

    // Click on the card to open detail
    const cardBtn = screen.getAllByRole('button').find(b => b.getAttribute('aria-label') === 'Tarjeta Visa Popular')
    expect(cardBtn).toBeDefined()
    fireEvent.click(cardBtn!)

    // Click edit in detail modal
    fireEvent.click(screen.getByText('Editar'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Visa Popular')).toBeInTheDocument()
  })

  it('calls update mutation on edit form submit', async () => {
    const { mutateAsync } = setupMocks([mockCredito])
    render(<TarjetasPage />)

    const cardBtn = screen.getAllByRole('button').find(b => b.getAttribute('aria-label') === 'Tarjeta Visa Popular')
    fireEvent.click(cardBtn!)
    fireEvent.click(screen.getByText('Editar'))

    fireEvent.click(screen.getByText('Actualizar'))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
  })

  it('calls delete mutation when confirmed', async () => {
    const { mutateAsync } = setupMocks([mockCredito])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TarjetasPage />)

    const cardBtn = screen.getAllByRole('button').find(b => b.getAttribute('aria-label') === 'Tarjeta Visa Popular')
    fireEvent.click(cardBtn!)
    fireEvent.click(screen.getByText('Eliminar'))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('t-1'))
  })

  it('does NOT call delete mutation when cancelled', async () => {
    const { mutateAsync } = setupMocks([mockCredito])
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<TarjetasPage />)

    const cardBtn = screen.getAllByRole('button').find(b => b.getAttribute('aria-label') === 'Tarjeta Visa Popular')
    fireEvent.click(cardBtn!)
    fireEvent.click(screen.getByText('Eliminar'))

    await waitFor(() => expect(mutateAsync).not.toHaveBeenCalled())
  })

  it('shows credit card button in the list', () => {
    setupMocks([mockCredito])
    render(<TarjetasPage />)
    // Credit card renders correctly (utilization bar removed from card view by design)
    expect(screen.getByRole('button', { name: /Visa Popular/i })).toBeInTheDocument()
  })

  it('shows debit card without progressbar in card view', () => {
    setupMocks([mockDebito])
    render(<TarjetasPage />)
    expect(screen.getByRole('button', { name: /Mastercard BHD/i })).toBeInTheDocument()
    // No progressbar in card view (utilization bar removed from card by design)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('credit card with high utilization renders correctly', () => {
    setupMocks([mockHighUtil])
    render(<TarjetasPage />)
    // Card renders correctly — utilization bar removed from card view by design
    expect(screen.getByRole('button', { name: /Amex Roja/i })).toBeInTheDocument()
  })

  it('shows loading skeleton while fetching', () => {
    setupMocks([], true)
    render(<TarjetasPage />)
    expect(screen.getByLabelText('Cargando tarjetas')).toBeInTheDocument()
    expect(screen.queryByText('Sin tarjetas registradas')).not.toBeInTheDocument()
  })

  it('shows error message when fetch fails', () => {
    setupMocks([], false, true)
    render(<TarjetasPage />)
    expect(screen.getByText(/El servidor no esta disponible/)).toBeInTheDocument()
  })

  it('i18n: page title renders "Tarjetas"', () => {
    setupMocks([])
    render(<TarjetasPage />)
    expect(screen.getByText('Tarjetas')).toBeInTheDocument()
  })

  it('separates credit and debit cards in distinct sections', () => {
    setupMocks([mockCredito, mockDebito])
    render(<TarjetasPage />)
    expect(screen.getByText('Credito')).toBeInTheDocument()
    expect(screen.getByText('Debito')).toBeInTheDocument()
  })

  // ─── Movimientos tests ──────────────────────────────────────────────────────

  it('detail modal shows movimientos section', () => {
    setupMocks([mockCredito])
    render(<TarjetasPage />)

    const cardBtn = screen.getByRole('button', { name: /Visa Popular/i })
    fireEvent.click(cardBtn)

    expect(screen.getByText('Movimientos')).toBeInTheDocument()
  })

  it('detail modal shows empty state when no movimientos exist', () => {
    setupMocks([mockCredito])
    render(<TarjetasPage />)

    fireEvent.click(screen.getByRole('button', { name: /Visa Popular/i }))

    expect(screen.getByText('Sin movimientos registrados')).toBeInTheDocument()
  })

  it('detail modal shows movimiento list when data exists', () => {
    const { useMovimientosTarjeta: mockMov } = vi.mocked({ useMovimientosTarjeta })
    mockMov.mockReturnValue({
      data: [
        {
          id: 'm-1',
          tarjeta_id: 't-1',
          tipo: 'compra' as const,
          monto: 1500,
          descripcion: 'Supermercado',
          fecha: '2026-03-18',
          egreso_id: null,
          notas: null,
          created_at: '2026-03-18T00:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useMovimientosTarjeta>)

    setupMocks([mockCredito])
    render(<TarjetasPage />)

    fireEvent.click(screen.getByRole('button', { name: /Visa Popular/i }))

    expect(screen.getByText('Supermercado')).toBeInTheDocument()
  })

  it('detail modal shows loading skeletons while movimientos are loading', () => {
    vi.mocked(useMovimientosTarjeta).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useMovimientosTarjeta>)

    setupMocks([mockCredito])
    render(<TarjetasPage />)

    fireEvent.click(screen.getByRole('button', { name: /Visa Popular/i }))

    // Skeletons are rendered while loading
    expect(screen.queryByText('Sin movimientos registrados')).not.toBeInTheDocument()
  })

  it('opens movimiento modal when "+ Registrar compra" is clicked', () => {
    setupMocks([mockCredito])
    render(<TarjetasPage />)

    fireEvent.click(screen.getByRole('button', { name: /Visa Popular/i }))
    fireEvent.click(screen.getByText('+ Registrar compra'))

    expect(screen.getByRole('dialog', { name: /Registrar movimiento/ })).toBeInTheDocument()
  })

  it('opens movimiento modal when "Registrar pago" is clicked', () => {
    setupMocks([mockCredito])
    render(<TarjetasPage />)

    fireEvent.click(screen.getByRole('button', { name: /Visa Popular/i }))
    fireEvent.click(screen.getByText('Registrar pago'))

    expect(screen.getByRole('dialog', { name: /Registrar movimiento/ })).toBeInTheDocument()
  })

  it('movimiento modal shows validation error on empty monto', async () => {
    setupMocks([mockCredito])
    render(<TarjetasPage />)

    fireEvent.click(screen.getByRole('button', { name: /Visa Popular/i }))
    fireEvent.click(screen.getByText('+ Registrar compra'))
    fireEvent.click(screen.getAllByText('Registrar').find(b => b.closest('button'))!)

    await waitFor(() => {
      expect(screen.getByText('Debe ser mayor a 0')).toBeInTheDocument()
    })
  })

  it('calls registrar mutation on valid movimiento form submit', async () => {
    const { mutateAsync } = setupMocks([mockCredito])
    render(<TarjetasPage />)

    fireEvent.click(screen.getByRole('button', { name: /Visa Popular/i }))
    fireEvent.click(screen.getByText('+ Registrar compra'))

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '500' } })
    fireEvent.click(screen.getAllByText('Registrar').find(b => b.closest('button'))!)

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
  })

  it('calls eliminar mutation when deleting a movimiento with confirmation', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    vi.mocked(useMovimientosTarjeta).mockReturnValue({
      data: [
        {
          id: 'm-del',
          tarjeta_id: 't-1',
          tipo: 'compra' as const,
          monto: 200,
          descripcion: 'Compra a eliminar',
          fecha: '2026-03-18',
          egreso_id: null,
          notas: null,
          created_at: '2026-03-18T00:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useMovimientosTarjeta>)
    vi.mocked(useEliminarMovimiento).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useEliminarMovimiento>)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    setupMocks([mockCredito])
    render(<TarjetasPage />)

    fireEvent.click(screen.getByRole('button', { name: /Visa Popular/i }))
    fireEvent.click(screen.getByLabelText('Eliminar movimiento'))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('m-del'))
  })
})
