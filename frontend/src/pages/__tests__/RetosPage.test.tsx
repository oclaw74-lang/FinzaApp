import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RetosPage } from '@/pages/RetosPage'
import type { UserRetoData, RetoData } from '@/types/retos'

vi.mock('@/hooks/useRetos', () => ({
  useMisRetos: vi.fn(),
  useCatalogoRetos: vi.fn(),
  useAceptarReto: vi.fn(),
  useCheckinReto: vi.fn(),
  useAbandonarReto: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import {
  useMisRetos,
  useCatalogoRetos,
  useAceptarReto,
  useCheckinReto,
  useAbandonarReto,
} from '@/hooks/useRetos'

const mockUserReto: UserRetoData = {
  id: 'ur-1',
  reto_id: 'reto-1',
  titulo: 'No gastar en cafe',
  descripcion: 'Evita gastar en cafe durante una semana',
  tipo: 'semanal',
  ahorro_estimado: 300,
  icono: '☕',
  estado: 'activo',
  racha_dias: 5,
  ultimo_checkin: null,
  iniciado_en: '2026-03-10T00:00:00Z',
  puede_checkin_hoy: true,
}

const mockCatalogoReto: RetoData = {
  id: 'reto-2',
  titulo: 'Meal prep semanal',
  descripcion: 'Prepara tus comidas el domingo para toda la semana',
  tipo: 'semanal',
  ahorro_estimado: 800,
  icono: '🍱',
}

function setupMocks({
  misRetos = [] as UserRetoData[],
  catalogo = [] as RetoData[],
  loadingMisRetos = false,
  loadingCatalogo = false,
} = {}) {
  const mutateAsync = vi.fn().mockResolvedValue({})

  vi.mocked(useMisRetos).mockReturnValue({
    data: misRetos,
    isLoading: loadingMisRetos,
    isError: false,
  } as unknown as ReturnType<typeof useMisRetos>)

  vi.mocked(useCatalogoRetos).mockReturnValue({
    data: catalogo,
    isLoading: loadingCatalogo,
    isError: false,
  } as unknown as ReturnType<typeof useCatalogoRetos>)

  vi.mocked(useAceptarReto).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useAceptarReto>)
  vi.mocked(useCheckinReto).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCheckinReto>)
  vi.mocked(useAbandonarReto).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useAbandonarReto>)

  return { mutateAsync }
}

describe('RetosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    setupMocks()
    render(<RetosPage />)
    expect(screen.getByText('Retos financieros')).toBeInTheDocument()
  })

  it('renders page subtitle', () => {
    setupMocks()
    render(<RetosPage />)
    expect(screen.getByText('Construye buenos habitos financieros')).toBeInTheDocument()
  })

  it('shows empty state when no active challenges', () => {
    setupMocks()
    render(<RetosPage />)
    expect(screen.getByText('Sin retos activos')).toBeInTheDocument()
  })

  it('renders active user challenge with title and streak', () => {
    setupMocks({ misRetos: [mockUserReto] })
    render(<RetosPage />)
    expect(screen.getByText('No gastar en cafe')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('dias de racha')).toBeInTheDocument()
  })

  it('renders checkin button enabled when puede_checkin_hoy is true', () => {
    setupMocks({ misRetos: [mockUserReto] })
    render(<RetosPage />)
    expect(screen.getByText("Check-in de hoy")).toBeInTheDocument()
  })

  it('renders checkin button disabled when puede_checkin_hoy is false', () => {
    setupMocks({ misRetos: [{ ...mockUserReto, puede_checkin_hoy: false }] })
    render(<RetosPage />)
    const btn = screen.getByText('Check-in completado').closest('button')
    expect(btn).toBeDisabled()
  })

  it('renders catalog challenge card with accept button', () => {
    setupMocks({ catalogo: [mockCatalogoReto] })
    render(<RetosPage />)
    expect(screen.getByText('Meal prep semanal')).toBeInTheDocument()
    expect(screen.getByText('Aceptar reto')).toBeInTheDocument()
  })

  it('filters out already accepted challenges from catalog', () => {
    const retoYaAceptado: RetoData = { ...mockCatalogoReto, id: 'reto-1' }
    setupMocks({
      misRetos: [mockUserReto],
      catalogo: [retoYaAceptado, mockCatalogoReto],
    })
    render(<RetosPage />)
    // reto-1 is already accepted (matches mockUserReto.reto_id), only reto-2 shown
    expect(screen.getByText('Meal prep semanal')).toBeInTheDocument()
    expect(screen.queryAllByText('Aceptar reto')).toHaveLength(1)
  })

  it('shows loading skeletons for mis retos when loading', () => {
    setupMocks({ loadingMisRetos: true })
    render(<RetosPage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows loading skeletons for catalog when loading', () => {
    setupMocks({ loadingCatalogo: true })
    render(<RetosPage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('calls checkin mutation on checkin button click', async () => {
    const { mutateAsync } = setupMocks({ misRetos: [mockUserReto] })
    render(<RetosPage />)
    const checkinBtn = screen.getByText("Check-in de hoy").closest('button')!
    fireEvent.click(checkinBtn)
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('ur-1'))
  })

  it('calls aceptar mutation on accept button click', async () => {
    const { mutateAsync } = setupMocks({ catalogo: [mockCatalogoReto] })
    render(<RetosPage />)
    const aceptarBtn = screen.getByText('Aceptar reto').closest('button')!
    fireEvent.click(aceptarBtn)
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('reto-2'))
  })

  it('renders section headers', () => {
    setupMocks()
    render(<RetosPage />)
    expect(screen.getByText('Mis retos activos')).toBeInTheDocument()
    expect(screen.getByText('Retos disponibles')).toBeInTheDocument()
  })

  it('renders tipo badge for semanal', () => {
    setupMocks({ misRetos: [mockUserReto] })
    render(<RetosPage />)
    expect(screen.getAllByText('Semanal').length).toBeGreaterThan(0)
  })
})
