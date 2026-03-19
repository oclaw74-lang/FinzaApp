import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RecurrentesPage } from '@/pages/RecurrentesPage'
import type { RecurrenteResponse, ProximoVencimientoResponse } from '@/types/recurrente'

vi.mock('@/hooks/useRecurrentes', () => ({
  useRecurrentes: vi.fn(),
  useProximosVencimientos: vi.fn(),
  useCreateRecurrente: vi.fn(),
  useUpdateRecurrente: vi.fn(),
  useDeleteRecurrente: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import {
  useRecurrentes,
  useProximosVencimientos,
  useCreateRecurrente,
  useUpdateRecurrente,
  useDeleteRecurrente,
} from '@/hooks/useRecurrentes'

const mockRecurrente: RecurrenteResponse = {
  id: 'r-1',
  user_id: 'u-1',
  tipo: 'egreso',
  descripcion: 'Renta mensual',
  monto: 15000,
  categoria_id: null,
  frecuencia: 'mensual',
  dia_del_mes: 1,
  fecha_inicio: '2026-01-01',
  fecha_fin: null,
  activo: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockIngresoRecurrente: RecurrenteResponse = {
  id: 'r-2',
  user_id: 'u-1',
  tipo: 'ingreso',
  descripcion: 'Salario',
  monto: 50000,
  categoria_id: null,
  frecuencia: 'mensual',
  dia_del_mes: 15,
  fecha_inicio: '2026-01-01',
  fecha_fin: null,
  activo: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockProximo: ProximoVencimientoResponse = {
  recurrente: mockRecurrente,
  fecha_estimada: '2026-03-01',
}

function setupMocks(
  recurrentes: RecurrenteResponse[] = [],
  proximos: ProximoVencimientoResponse[] = [],
  loadingRec = false,
  loadingProx = false,
) {
  const mutateAsync = vi.fn().mockResolvedValue({})
  vi.mocked(useRecurrentes).mockReturnValue({
    data: recurrentes,
    isLoading: loadingRec,
  } as ReturnType<typeof useRecurrentes>)
  vi.mocked(useProximosVencimientos).mockReturnValue({
    data: proximos,
    isLoading: loadingProx,
  } as ReturnType<typeof useProximosVencimientos>)
  vi.mocked(useCreateRecurrente).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useCreateRecurrente>)
  vi.mocked(useUpdateRecurrente).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useUpdateRecurrente>)
  vi.mocked(useDeleteRecurrente).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useDeleteRecurrente>)
  return { mutateAsync }
}

describe('RecurrentesPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders page title', () => {
    setupMocks()
    render(<RecurrentesPage />)
    expect(screen.getByText('Recurrentes')).toBeInTheDocument()
  })

  it('shows loading skeleton while fetching recurrentes', () => {
    setupMocks([], [], true, false)
    render(<RecurrentesPage />)
    // Skeletons rendered — no empty state text visible
    expect(screen.queryByText('Sin recurrentes configuradas')).not.toBeInTheDocument()
  })

  it('shows loading skeleton while fetching proximos', () => {
    setupMocks([], [], false, true)
    render(<RecurrentesPage />)
    expect(screen.queryByText('Sin vencimientos este mes')).not.toBeInTheDocument()
  })

  it('renders proximos vencimientos list', () => {
    setupMocks([mockRecurrente], [mockProximo])
    render(<RecurrentesPage />)
    expect(screen.getByText('Proximos vencimientos')).toBeInTheDocument()
    // descripcion appears in both sections
    expect(screen.getAllByText('Renta mensual').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('2026-03-01')).toBeInTheDocument()
  })

  it('renders recurrentes list', () => {
    setupMocks([mockRecurrente])
    render(<RecurrentesPage />)
    expect(screen.getByText('Todas las recurrentes')).toBeInTheDocument()
    expect(screen.getByText('Renta mensual')).toBeInTheDocument()
  })

  it('shows empty state for proximos when list is empty', () => {
    setupMocks([])
    render(<RecurrentesPage />)
    expect(screen.getByText('Sin vencimientos este mes')).toBeInTheDocument()
  })

  it('shows empty state for recurrentes when list is empty', () => {
    setupMocks([])
    render(<RecurrentesPage />)
    expect(screen.getByText('Sin recurrentes configuradas')).toBeInTheDocument()
  })

  it('opens create dialog when nueva button is clicked', () => {
    setupMocks()
    render(<RecurrentesPage />)
    fireEvent.click(screen.getByText('Nueva recurrente'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Nueva recurrente', { selector: '#modal-title' })).toBeInTheDocument()
  })

  it('calls create mutation when form is submitted', async () => {
    const { mutateAsync } = setupMocks()
    render(<RecurrentesPage />)
    fireEvent.click(screen.getByText('Nueva recurrente'))

    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText('Descripcion'), { target: { value: 'Gym' } })
    fireEvent.change(screen.getByPlaceholderText('Monto'), { target: { value: '500' } })
    // Fill fecha_inicio by label
    const fechaInicioInput = screen.getAllByDisplayValue('')[0]
    fireEvent.change(fechaInicioInput, { target: { value: '2026-03-01' } })

    fireEvent.click(screen.getByText('Guardar'))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
  })

  it('calls delete mutation when delete button is clicked and confirmed', async () => {
    const { mutateAsync } = setupMocks([mockRecurrente])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<RecurrentesPage />)
    const deleteBtn = screen.getByLabelText('Eliminar')
    fireEvent.click(deleteBtn)
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('r-1'))
  })

  it('calls update mutation when toggle activo is clicked', async () => {
    const { mutateAsync } = setupMocks([mockRecurrente])
    render(<RecurrentesPage />)
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: 'r-1', activo: false }))
  })

  it('shows badge tipo ingreso with correct label', () => {
    setupMocks([mockIngresoRecurrente], [{ recurrente: mockIngresoRecurrente, fecha_estimada: '2026-03-15' }])
    render(<RecurrentesPage />)
    const badges = screen.getAllByText('Ingreso')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('shows badge tipo egreso with correct label', () => {
    setupMocks([mockRecurrente], [mockProximo])
    render(<RecurrentesPage />)
    const badges = screen.getAllByText('Egreso')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })
})
