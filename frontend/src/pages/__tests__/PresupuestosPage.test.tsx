import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PresupuestosPage } from '@/pages/PresupuestosPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'es' } }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: [] }),
    isAxiosError: vi.fn().mockReturnValue(false),
  },
}))

vi.mock('@/features/presupuestos/components/PresupuestoCard', () => ({
  PresupuestoCard: (props: any) => (
    <div data-testid="presupuesto-card">
      {props.estado?.categoria_nombre || 'card'}
    </div>
  ),
}))

vi.mock('@/features/presupuestos/components/PresupuestoModal', () => ({
  PresupuestoModal: (props: any) =>
    props.isOpen ? <div data-testid="presupuesto-modal" /> : null,
}))

vi.mock('@/hooks/usePresupuestos', () => ({
  usePresupuestosEstado: vi.fn(),
  usePresupuestosSugeridos: vi.fn(),
  useCreatePresupuesto: vi.fn(),
  useUpdatePresupuesto: vi.fn(),
  useDeletePresupuesto: vi.fn(),
}))

vi.mock('@/hooks/useCategorias', () => ({
  useCategorias: vi.fn(),
}))

import {
  usePresupuestosEstado,
  usePresupuestosSugeridos,
  useCreatePresupuesto,
  useUpdatePresupuesto,
  useDeletePresupuesto,
} from '@/hooks/usePresupuestos'
import { useCategorias } from '@/hooks/useCategorias'

const mockPresupuestos = [
  {
    id: 'p-1',
    categoria_id: 'cat-1',
    categoria_nombre: 'Alimentación',
    monto_limite: 10000,
    gasto_actual: 6000,
    mes: 3,
    year: 2026,
    porcentaje_usado: 60,
    alerta: false,
  },
  {
    id: 'p-2',
    categoria_id: 'cat-2',
    categoria_nombre: 'Transporte',
    monto_limite: 5000,
    gasto_actual: 2000,
    mes: 3,
    year: 2026,
    porcentaje_usado: 40,
    alerta: false,
  },
]

const mockCategorias = [
  { id: 'cat-1', nombre: 'Alimentación', tipo: 'egreso', icono: null, color: null, es_sistema: true },
]

function setupMocks({
  presupuestos = mockPresupuestos,
  isLoading = false,
}: { presupuestos?: typeof mockPresupuestos; isLoading?: boolean } = {}) {
  vi.mocked(usePresupuestosEstado).mockReturnValue({
    data: presupuestos,
    isLoading,
    isError: false,
    error: null,
  } as any)
  vi.mocked(usePresupuestosSugeridos).mockReturnValue({
    data: [],
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  } as any)
  vi.mocked(useCreatePresupuesto).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as any)
  vi.mocked(useUpdatePresupuesto).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as any)
  vi.mocked(useDeletePresupuesto).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as any)
  vi.mocked(useCategorias).mockReturnValue({
    data: mockCategorias,
    isLoading: false,
  } as any)
}

describe('PresupuestosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders loading skeleton when isLoading=true', () => {
    setupMocks({ isLoading: true, presupuestos: [] })
    render(<PresupuestosPage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows empty state when no presupuestos', () => {
    setupMocks({ presupuestos: [] })
    render(<PresupuestosPage />)
    expect(screen.getByText('presupuestos.noPresupuestos')).toBeInTheDocument()
  })

  it('renders presupuesto cards when data is loaded', () => {
    render(<PresupuestosPage />)
    const cards = screen.getAllByTestId('presupuesto-card')
    expect(cards).toHaveLength(mockPresupuestos.length)
    expect(screen.getByText('Alimentación')).toBeInTheDocument()
    expect(screen.getByText('Transporte')).toBeInTheDocument()
  })

  it('renders month/year selectors', () => {
    render(<PresupuestosPage />)
    expect(document.getElementById('mes-selector')).toBeInTheDocument()
    expect(document.getElementById('year-selector')).toBeInTheDocument()
  })

  it('renders nuevo presupuesto button', () => {
    render(<PresupuestosPage />)
    expect(screen.getByText('common.new')).toBeInTheDocument()
  })
})
