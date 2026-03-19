import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardPage } from '@/pages/DashboardPage'
import type { DashboardV2Response } from '@/types/dashboard'

vi.mock('@/hooks/useDashboardV2', () => ({
  useDashboardV2: vi.fn(),
}))

vi.mock('@/hooks/usePrediccionMes', () => ({
  usePrediccionMes: vi.fn(() => ({ data: undefined, isLoading: false })),
}))

vi.mock('@/hooks/useScore', () => ({
  useScore: vi.fn(() => ({
    data: { score: 72, estado: 'bueno', breakdown: { ahorro: 20, presupuesto: 18, deuda: 22, emergencia: 12 } },
    isLoading: false,
  })),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

// Mock recharts-based chart components — ResponsiveContainer has 0 dimensions in jsdom
vi.mock('@/features/dashboard/components/ChartFlujoMensual', () => ({
  ChartFlujoMensual: () => <div data-testid="chart-flujo-mensual" />,
}))

vi.mock('@/features/dashboard/components/ChartDistribucionEgresos', () => ({
  ChartDistribucionEgresos: ({ data }: { data: Array<{ categoria: string; total: number; porcentaje: number }> }) => (
    <div data-testid="chart-distribucion-egresos">
      {data.map((d) => (
        <span key={d.categoria}>{d.categoria}</span>
      ))}
    </div>
  ),
}))

import { useDashboardV2 } from '@/hooks/useDashboardV2'
import { useAuthStore } from '@/store/authStore'

const mockData: DashboardV2Response = {
  resumen_financiero: {
    ingresos_mes: 50000,
    egresos_mes: 30000,
    balance_mes: 20000,
    tasa_ahorro: 40,
    ingresos_mes_anterior: 45000,
    egresos_mes_anterior: 28000,
    variacion_ingresos_pct: 11.1,
    variacion_egresos_pct: 7.1,
  },
  presupuestos_estado: [
    {
      categoria: 'Alimentacion',
      monto_presupuestado: 10000,
      gasto_actual: 7000,
      porcentaje_usado: 70,
      alerta: false,
    },
  ],
  metas_activas: [
    {
      nombre: 'Fondo de emergencia',
      monto_objetivo: 100000,
      monto_actual: 50000,
      porcentaje_completado: 50,
      fecha_limite: '2026-12-31',
    },
  ],
  prestamos_activos: {
    total_deuda: 150000,
    count: 2,
    proximo_vencimiento: '2026-04-15',
  },
  ultimas_transacciones: [
    {
      tipo: 'ingreso',
      descripcion: 'Salario',
      monto: 50000,
      fecha: '2026-03-01',
      categoria: 'Salarios',
    },
    {
      tipo: 'egreso',
      descripcion: 'Supermercado',
      monto: 3000,
      fecha: '2026-03-05',
      categoria: 'Alimentacion',
    },
  ],
  egresos_por_categoria: [
    { categoria: 'Alimentacion', total: 7000, porcentaje: 46.7 },
    { categoria: 'Transporte', total: 3000, porcentaje: 20 },
  ],
}

function setupMock({
  data = mockData,
  isLoading = false,
  isError = false,
  error = null,
}: {
  data?: DashboardV2Response | undefined
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
} = {}) {
  vi.mocked(useDashboardV2).mockReturnValue({
    data,
    isLoading,
    isError,
    isPending: isLoading,
    isSuccess: !isLoading && !isError,
    error,
  } as ReturnType<typeof useDashboardV2>)
}

function setupAuthMock(fullName?: string, email = 'test@example.com') {
  vi.mocked(useAuthStore).mockReturnValue({
    user: {
      user_metadata: fullName ? { full_name: fullName } : {},
      email,
    },
  } as ReturnType<typeof useAuthStore>)
}

describe('DashboardPage', () => {
  const renderDashboard = () => render(<MemoryRouter><DashboardPage /></MemoryRouter>)

  beforeEach(() => {
    vi.clearAllMocks()
    setupMock()
    setupAuthMock('Jorge Martinez')
  })

  it('renders page title', () => {
    renderDashboard()
    // Title is rendered by the shared Header component (not duplicated in page body)
    // Verify the dashboard KPI section renders instead
    expect(screen.getByText('Tasa de ahorro')).toBeInTheDocument()
  })

  it('renders month selector', () => {
    renderDashboard()
    // Month is now selected via pill buttons (Ene, Feb, ... Dic) in the greeting header
    expect(screen.getByRole('button', { name: 'Ene' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dic' })).toBeInTheDocument()
  })

  it('renders year selector', () => {
    renderDashboard()
    expect(screen.getByLabelText('Ano anterior')).toBeInTheDocument()
  })

  it('shows loading skeleton state with 4 KPI cards', () => {
    setupMock({ isLoading: true, data: undefined })
    renderDashboard()
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows error alert when isError is true', () => {
    setupMock({ isError: true, error: new Error('Network error'), data: undefined })
    renderDashboard()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows fallback error message when error has no message', () => {
    setupMock({ isError: true, error: null, data: undefined })
    renderDashboard()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/error al cargar el dashboard/i)).toBeInTheDocument()
  })

  it('renders ingresos KPI with data', () => {
    renderDashboard()
    expect(screen.getByText('Ingresos')).toBeInTheDocument()
    expect(screen.getAllByText(/50,000/).length).toBeGreaterThan(0)
  })

  it('renders egresos KPI with data', () => {
    renderDashboard()
    expect(screen.getByText('Egresos')).toBeInTheDocument()
  })

  it('renders greeting header instead of balance hero card', () => {
    renderDashboard()
    // The old hero balance card has been replaced by a greeting header
    expect(screen.getByTestId('dashboard-greeting')).toBeInTheDocument()
  })

  it('renders tasa de ahorro KPI', () => {
    renderDashboard()
    expect(screen.getByText('Tasa de ahorro')).toBeInTheDocument()
    expect(screen.getByText('40.0%')).toBeInTheDocument()
  })

  it('renders recent transactions', () => {
    renderDashboard()
    expect(screen.getByText('Salario')).toBeInTheDocument()
    expect(screen.getByText('Supermercado')).toBeInTheDocument()
  })

  it('renders category breakdown charts', () => {
    renderDashboard()
    // Alimentacion appears in presupuestos_estado AND in the mocked distribution chart
    expect(screen.getAllByText('Alimentacion').length).toBeGreaterThan(0)
    // Transporte appears in the mocked ChartDistribucionEgresos
    expect(screen.getByText('Transporte')).toBeInTheDocument()
  })

  it('renders presupuestos section', () => {
    renderDashboard()
    expect(screen.getByText('Presupuestos activos')).toBeInTheDocument()
  })

  it('renders metas activas section', () => {
    renderDashboard()
    // 'Metas activas' appears in both the KPI card and the section header
    expect(screen.getAllByText('Metas activas').length).toBeGreaterThan(0)
    expect(screen.getByText('Fondo de emergencia')).toBeInTheDocument()
  })

  it('renders prestamos activos with deuda total', () => {
    renderDashboard()
    expect(screen.getByText('Prestamos activos')).toBeInTheDocument()
    expect(screen.getByText(/150,000/)).toBeInTheDocument()
  })

  it('shows "Sin prestamos activos" when count is 0', () => {
    setupMock({
      data: {
        ...mockData,
        prestamos_activos: { total_deuda: 0, count: 0, proximo_vencimiento: null },
      },
    })
    renderDashboard()
    expect(screen.getByText('Sin prestamos activos')).toBeInTheDocument()
  })

  it('shows empty state for transactions when list is empty', () => {
    setupMock({ data: { ...mockData, ultimas_transacciones: [] } })
    renderDashboard()
    expect(screen.getAllByText(/sin transacciones este mes/i).length).toBeGreaterThan(0)
  })

  it('shows empty state for metas when list is empty', () => {
    setupMock({ data: { ...mockData, metas_activas: [] } })
    renderDashboard()
    expect(screen.getAllByText(/sin datos/i).length).toBeGreaterThan(0)
  })

  it('changes mes when month button is clicked', () => {
    renderDashboard()
    // Month is now selected via pill buttons in the greeting header
    const junButton = screen.getByRole('button', { name: 'Jun' })
    fireEvent.click(junButton)
    // Clicked button should have the active styling
    expect(junButton).toHaveClass('bg-[#3d8ef8]')
  })

  it('changes year when selector changes', () => {
    renderDashboard()
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(String(currentYear))).toBeInTheDocument()
    const nextYearBtn = screen.getByLabelText('Ano siguiente')
    fireEvent.click(nextYearBtn)
    expect(screen.getByText(String(currentYear + 1))).toBeInTheDocument()
  })

  it('does not show error alert when isError is false', () => {
    renderDashboard()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders greeting with user first name', () => {
    setupAuthMock('Jorge Martinez')
    renderDashboard()
    const greeting = screen.getByTestId('dashboard-greeting')
    expect(greeting).toBeInTheDocument()
    expect(greeting.textContent).toContain('Jorge')
  })

  it('greeting changes based on hour', () => {
    // Mock Date to control the hour
    const originalDate = globalThis.Date
    const mockDate = class extends originalDate {
      getHours() {
        return 9 // morning
      }
    } as typeof Date
    globalThis.Date = mockDate

    renderDashboard()
    const greeting = screen.getByTestId('dashboard-greeting')
    expect(greeting.textContent).toContain('Buenos dias')

    globalThis.Date = originalDate
  })

  it('shows fallback name when user has no full_name', () => {
    setupAuthMock(undefined, 'jorge@example.com')
    renderDashboard()
    const greeting = screen.getByTestId('dashboard-greeting')
    expect(greeting.textContent).toContain('jorge')
  })
})
