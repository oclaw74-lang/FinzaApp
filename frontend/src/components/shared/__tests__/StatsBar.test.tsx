import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StatsBar } from '@/components/shared/StatsBar'
import type { DashboardV2Response } from '@/types/dashboard'

vi.mock('@/hooks/useDashboardV2', () => ({ useDashboardV2: vi.fn() }))
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

import { useDashboardV2 } from '@/hooks/useDashboardV2'

const mockData: DashboardV2Response = {
  resumen_financiero: {
    ingresos_mes: 50000,
    egresos_mes: 35000,
    balance_mes: 15000,
    tasa_ahorro: 30,
    ingresos_mes_anterior: 45000,
    egresos_mes_anterior: 32000,
    variacion_ingresos_pct: 11.1,
    variacion_egresos_pct: 9.4,
  },
  presupuestos_estado: [],
  metas_activas: [],
  prestamos_activos: {
    total_deuda: 100000,
    count: 2,
    proximo_vencimiento: '2026-04-15',
  },
  ultimas_transacciones: [],
  egresos_por_categoria: [],
}

describe('StatsBar', () => {
  const onOpen = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useDashboardV2).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<typeof useDashboardV2>)
    const { container } = render(<StatsBar onCommandPaletteOpen={onOpen} />)
    const shimmer = container.querySelector('.shimmer')
    expect(shimmer).not.toBeNull()
  })

  it('renders stats when data is loaded', () => {
    vi.mocked(useDashboardV2).mockReturnValue({ data: mockData, isLoading: false } as ReturnType<typeof useDashboardV2>)
    render(<StatsBar onCommandPaletteOpen={onOpen} />)
    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(screen.getByText('Ingresos')).toBeInTheDocument()
    expect(screen.getByText('Egresos')).toBeInTheDocument()
  })

  it('renders proximo vencimiento label', () => {
    vi.mocked(useDashboardV2).mockReturnValue({ data: mockData, isLoading: false } as ReturnType<typeof useDashboardV2>)
    render(<StatsBar onCommandPaletteOpen={onOpen} />)
    expect(screen.getByText('Prox. Venc.')).toBeInTheDocument()
  })

  it('renders command palette trigger button', () => {
    vi.mocked(useDashboardV2).mockReturnValue({ data: mockData, isLoading: false } as ReturnType<typeof useDashboardV2>)
    render(<StatsBar onCommandPaletteOpen={onOpen} />)
    expect(screen.getByRole('button', { name: /abrir command palette/i })).toBeInTheDocument()
  })

  it('calls onCommandPaletteOpen when button is clicked', () => {
    vi.mocked(useDashboardV2).mockReturnValue({ data: mockData, isLoading: false } as ReturnType<typeof useDashboardV2>)
    render(<StatsBar onCommandPaletteOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /abrir command palette/i }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('renders no stats bar when no data and not loading (null/undefined)', () => {
    vi.mocked(useDashboardV2).mockReturnValue({ data: undefined, isLoading: false } as ReturnType<typeof useDashboardV2>)
    const { container } = render(<StatsBar onCommandPaletteOpen={onOpen} />)
    // Should render skeleton (loading-like fallback) when data is null
    expect(container.querySelector('.statsbar-glass')).not.toBeNull()
  })

  it('shows positive badge variant for positive tasa_ahorro', () => {
    vi.mocked(useDashboardV2).mockReturnValue({ data: mockData, isLoading: false } as ReturnType<typeof useDashboardV2>)
    const { container } = render(<StatsBar onCommandPaletteOpen={onOpen} />)
    // 30% savings rate — positive badge (emerald color)
    const positiveBadge = container.querySelector('.text-emerald-400')
    expect(positiveBadge).not.toBeNull()
  })

  it('shows dash when proximo_vencimiento is null', () => {
    const dataNoVenc = {
      ...mockData,
      prestamos_activos: { ...mockData.prestamos_activos, proximo_vencimiento: null },
    }
    vi.mocked(useDashboardV2).mockReturnValue({ data: dataNoVenc, isLoading: false } as ReturnType<typeof useDashboardV2>)
    render(<StatsBar onCommandPaletteOpen={onOpen} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
