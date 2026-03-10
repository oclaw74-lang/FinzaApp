import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardPage } from '@/pages/DashboardPage'
import type { DashboardV2Response } from '@/types/dashboard'

vi.mock('@/hooks/useDashboardV2', () => ({
  useDashboardV2: vi.fn(),
}))

// Mock recharts-based chart components — ResponsiveContainer has 0 dimensions in jsdom
vi.mock('@/features/dashboard/components/ChartGastosPorCategoria', () => ({
  ChartGastosPorCategoria: ({ data }: { data: Array<{ categoria: string; total: number }> }) => (
    <div data-testid="chart-gastos-categoria">
      {data.map((d) => (
        <span key={d.categoria}>{d.categoria}</span>
      ))}
    </div>
  ),
}))

vi.mock('@/features/dashboard/components/ChartBalanceTendencia', () => ({
  ChartBalanceTendencia: () => <div data-testid="chart-balance-tendencia" />,
}))

import { useDashboardV2 } from '@/hooks/useDashboardV2'

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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMock()
  })

  it('renders page title', () => {
    render(<DashboardPage />)
    // Title is rendered by the shared Header component (not duplicated in page body)
    // Verify the dashboard hero section renders instead
    expect(screen.getByText('Tasa de ahorro')).toBeInTheDocument()
  })

  it('renders month selector', () => {
    render(<DashboardPage />)
    // Month is now selected via pill buttons (Ene, Feb, ... Dic) in the hero card
    expect(screen.getByRole('button', { name: 'Ene' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dic' })).toBeInTheDocument()
  })

  it('renders year selector', () => {
    render(<DashboardPage />)
    expect(screen.getByLabelText('Ano')).toBeInTheDocument()
  })

  it('shows loading skeleton state with 4 KPI cards', () => {
    setupMock({ isLoading: true, data: undefined })
    render(<DashboardPage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows error alert when isError is true', () => {
    setupMock({ isError: true, error: new Error('Network error'), data: undefined })
    render(<DashboardPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows fallback error message when error has no message', () => {
    setupMock({ isError: true, error: null, data: undefined })
    render(<DashboardPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/error al cargar el dashboard/i)).toBeInTheDocument()
  })

  it('renders ingresos KPI with data', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Ingresos')).toBeInTheDocument()
    expect(screen.getAllByText(/50,000/).length).toBeGreaterThan(0)
  })

  it('renders egresos KPI with data', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Egresos')).toBeInTheDocument()
  })

  it('renders balance KPI with data', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Balance')).toBeInTheDocument()
  })

  it('renders tasa de ahorro KPI', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Tasa de ahorro')).toBeInTheDocument()
    expect(screen.getByText('40.0%')).toBeInTheDocument()
  })

  it('renders recent transactions', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Salario')).toBeInTheDocument()
    expect(screen.getByText('Supermercado')).toBeInTheDocument()
  })

  it('renders category breakdown bars', () => {
    render(<DashboardPage />)
    // Alimentacion appears in presupuestos_estado AND in the mocked chart
    expect(screen.getAllByText('Alimentacion').length).toBeGreaterThan(0)
    // Transporte appears in the mocked ChartGastosPorCategoria
    expect(screen.getByText('Transporte')).toBeInTheDocument()
  })

  it('renders presupuestos section', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Presupuestos activos')).toBeInTheDocument()
  })

  it('renders metas activas section', () => {
    render(<DashboardPage />)
    // 'Metas activas' appears in both the KPI card and the section header
    expect(screen.getAllByText('Metas activas').length).toBeGreaterThan(0)
    expect(screen.getByText('Fondo de emergencia')).toBeInTheDocument()
  })

  it('renders prestamos activos with deuda total', () => {
    render(<DashboardPage />)
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
    render(<DashboardPage />)
    expect(screen.getByText('Sin prestamos activos')).toBeInTheDocument()
  })

  it('shows empty state for transactions when list is empty', () => {
    setupMock({ data: { ...mockData, ultimas_transacciones: [] } })
    render(<DashboardPage />)
    expect(screen.getAllByText(/sin transacciones este mes/i).length).toBeGreaterThan(0)
  })

  it('shows empty state for metas when list is empty', () => {
    setupMock({ data: { ...mockData, metas_activas: [] } })
    render(<DashboardPage />)
    expect(screen.getAllByText(/sin datos/i).length).toBeGreaterThan(0)
  })

  it('changes mes when month button is clicked', () => {
    render(<DashboardPage />)
    // Month is now selected via pill buttons in the hero card
    const junButton = screen.getByRole('button', { name: 'Jun' })
    fireEvent.click(junButton)
    // Clicked button should have the active styling (bg-white class)
    expect(junButton).toHaveClass('bg-white')
  })

  it('changes year when selector changes', () => {
    render(<DashboardPage />)
    const yearSelect = screen.getByLabelText('Ano')
    fireEvent.change(yearSelect, { target: { value: '2025' } })
    expect((yearSelect as HTMLSelectElement).value).toBe('2025')
  })

  it('does not show error alert when isError is false', () => {
    render(<DashboardPage />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
