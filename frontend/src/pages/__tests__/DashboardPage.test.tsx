import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardPage } from '@/pages/DashboardPage'

vi.mock('@/hooks/useDashboardV2', () => ({
  useDashboardV2: vi.fn(),
}))

vi.mock('@/hooks/useScore', () => ({
  useScore: vi.fn(),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/features/dashboard/components/v2/MetaProgressItem', () => ({
  MetaProgressItem: () => <div data-testid="meta-item" />,
}))

vi.mock('@/features/presupuestos/components/BudgetProgressBar', () => ({
  BudgetProgressBar: () => <div data-testid="budget-bar" />,
}))

vi.mock('@/features/dashboard/components/ChartFlujoMensual', () => ({
  ChartFlujoMensual: () => <div data-testid="chart-flujo" />,
}))

vi.mock('@/features/dashboard/components/ChartDistribucionEgresos', () => ({
  ChartDistribucionEgresos: () => <div data-testid="chart-distribucion" />,
}))

vi.mock('@/components/dashboard/PrediccionMesCard', () => ({
  PrediccionMesCard: () => <div data-testid="prediccion-card" />,
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, opts?: unknown) => {
      if (k === 'months.short') {
        return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      }
      return k
    },
  }),
}))

vi.mock('@/hooks/useTarjetas', () => ({
  useTarjetas: vi.fn(() => ({ data: [], isLoading: false })),
}))

import { useDashboardV2 } from '@/hooks/useDashboardV2'
import { useScore } from '@/hooks/useScore'
import { useAuthStore } from '@/store/authStore'

const mockDashboardData = {
  resumen_financiero: {
    ingresos_mes: 50000,
    egresos_mes: 30000,
    balance: 20000,
    tasa_ahorro: 40,
    variacion_ingresos_pct: 5,
    variacion_egresos_pct: -3,
  },
  metas_activas: [],
  presupuestos_estado: [],
  prestamos_activos: { count: 0, total_deuda: 0, proximo_vencimiento: null },
  prediccion: null,
  egresos_por_categoria: [],
}

const mockScoreData = {
  score: 72,
  estado: 'bueno',
  breakdown: { ahorro: 18, presupuesto: 20, deuda: 17, emergencia: 17 },
}

function setup({ isLoading = false, data = mockDashboardData as typeof mockDashboardData | undefined } = {}) {
  vi.mocked(useDashboardV2).mockReturnValue({
    data,
    isLoading,
    isError: false,
    error: null,
  } as ReturnType<typeof useDashboardV2>)

  vi.mocked(useScore).mockReturnValue({
    data: mockScoreData,
    isLoading: false,
  } as ReturnType<typeof useScore>)

  vi.mocked(useAuthStore).mockReturnValue({
    user: { email: 'test@test.com', user_metadata: { full_name: 'Test User' } },
  } as ReturnType<typeof useAuthStore>)
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setup()
  })

  it('renders loading state when isLoading=true', () => {
    setup({ isLoading: true, data: undefined })
    render(<DashboardPage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('renders dashboard content when data loaded', () => {
    render(<DashboardPage />)
    expect(screen.getByTestId('dashboard-greeting')).toBeInTheDocument()
  })

  it('renders user greeting containing user name', () => {
    render(<DashboardPage />)
    const greeting = screen.getByTestId('dashboard-greeting')
    expect(greeting).toHaveTextContent('Test')
  })

  it('renders month selector', () => {
    render(<DashboardPage />)
    expect(screen.getByLabelText('Seleccionar mes')).toBeInTheDocument()
  })
})
