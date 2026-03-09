import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MetasPage } from '@/pages/MetasPage'
import type { MetaAhorro, MetasResumen } from '@/types/meta_ahorro'

// Mock hooks
vi.mock('@/hooks/useMetas', () => ({
  useMetas: vi.fn(),
  useMetasResumen: vi.fn(),
  useCreateMeta: vi.fn(),
  useUpdateMeta: vi.fn(),
  useDeleteMeta: vi.fn(),
  useMetaDetalle: vi.fn(),
  useContribucionesMeta: vi.fn(),
  useAgregarContribucion: vi.fn(),
  useDeleteContribucion: vi.fn(),
}))

import {
  useMetas,
  useMetasResumen,
  useCreateMeta,
  useUpdateMeta,
  useDeleteMeta,
} from '@/hooks/useMetas'

const mockResumen: MetasResumen = {
  total_ahorrado: 40000,
  metas_activas: 2,
  metas_completadas: 1,
  porcentaje_promedio_cumplimiento: 55,
}

const mockMetas: MetaAhorro[] = [
  {
    id: 'meta-1',
    user_id: 'user-1',
    nombre: 'Fondo de emergencia',
    descripcion: 'Para imprevistos',
    monto_objetivo: 100000,
    monto_actual: 40000,
    fecha_inicio: '2026-01-01',
    fecha_objetivo: '2026-12-31',
    estado: 'activa',
    color: '#366092',
    icono: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'meta-2',
    user_id: 'user-1',
    nombre: 'Vacaciones',
    descripcion: null,
    monto_objetivo: 50000,
    monto_actual: 50000,
    fecha_inicio: '2026-01-01',
    fecha_objetivo: null,
    estado: 'completada',
    color: null,
    icono: '✈️',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

function setupMocks({
  metasData = mockMetas,
  isLoading = false,
  isError = false,
}: {
  metasData?: MetaAhorro[]
  isLoading?: boolean
  isError?: boolean
} = {}) {
  vi.mocked(useMetas).mockReturnValue({
    data: metasData,
    isLoading,
    isError,
    isPending: false,
    isSuccess: !isLoading && !isError,
    error: null,
  } as ReturnType<typeof useMetas>)

  vi.mocked(useMetasResumen).mockReturnValue({
    data: mockResumen,
    isLoading: false,
    isError: false,
    isPending: false,
    isSuccess: true,
    error: null,
  } as ReturnType<typeof useMetasResumen>)

  vi.mocked(useCreateMeta).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateMeta>)

  vi.mocked(useUpdateMeta).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateMeta>)

  vi.mocked(useDeleteMeta).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteMeta>)
}

describe('MetasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders page title', () => {
    render(<MetasPage />)
    expect(screen.getByText('Metas de ahorro')).toBeInTheDocument()
  })

  it('renders Nueva Meta button', () => {
    render(<MetasPage />)
    expect(
      screen.getByRole('button', { name: /nueva meta/i })
    ).toBeInTheDocument()
  })

  it('shows loading skeleton state', () => {
    setupMocks({ isLoading: true, metasData: [] })
    render(<MetasPage />)
    // Skeletons rendered as animated divs — check absence of real data
    expect(screen.queryByText('Fondo de emergencia')).not.toBeInTheDocument()
  })

  it('shows error state gracefully', () => {
    setupMocks({ isError: true, metasData: [] })
    render(<MetasPage />)
    expect(
      screen.getByText(/el servidor no esta disponible/i)
    ).toBeInTheDocument()
  })

  it('shows empty state when no metas and not loading', () => {
    setupMocks({ metasData: [] })
    render(<MetasPage />)
    expect(
      screen.getByText(/no tienes metas de ahorro todavia/i)
    ).toBeInTheDocument()
  })

  it('renders meta cards when data is available', () => {
    render(<MetasPage />)
    expect(screen.getByText('Fondo de emergencia')).toBeInTheDocument()
    // Meta con icono: el texto aparece como "✈️ Vacaciones" o separado
    expect(screen.getByText(/Vacaciones/)).toBeInTheDocument()
  })

  it('shows KPI resumen cards section', () => {
    render(<MetasPage />)
    expect(screen.getByText('Total ahorrado')).toBeInTheDocument()
    expect(screen.getByText('Metas activas')).toBeInTheDocument()
    expect(screen.getByText('Cumplimiento promedio')).toBeInTheDocument()
  })

  it('renders correct number of meta cards', () => {
    render(<MetasPage />)
    const buttons = screen
      .getAllByRole('button')
      .filter((btn) =>
        btn.getAttribute('aria-label')?.includes('Ver detalle de meta')
      )
    expect(buttons).toHaveLength(2)
  })
})
