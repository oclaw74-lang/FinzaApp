import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ComparativaCard } from '@/components/dashboard/ComparativaCard'
import type { ComparativaData } from '@/types/comparativa'

vi.mock('@/hooks/useComparativa', () => ({
  useComparativa: vi.fn(),
}))

import { useComparativa } from '@/hooks/useComparativa'

const mockComparativa: ComparativaData = {
  deudas: [
    {
      nombre: 'Prestamo personal',
      tipo: 'deuda',
      monto: 50000,
      tasa_anual: 24,
      costo_o_rendimiento_mensual: 1000,
    },
  ],
  ahorros: [
    {
      nombre: 'Meta: Viaje',
      tipo: 'ahorro',
      monto: 20000,
      tasa_anual: null,
      costo_o_rendimiento_mensual: 200,
    },
  ],
  total_costo_deuda: 1000,
  total_rendimiento_ahorro: 200,
  diferencia: 800,
  recomendacion: 'Enfoca tus esfuerzos en pagar las deudas con mayor tasa de interes.',
}

function setupMock({
  data = undefined as ComparativaData | undefined,
  isLoading = false,
  isError = false,
} = {}) {
  vi.mocked(useComparativa).mockReturnValue({
    data,
    isLoading,
    isError,
  } as ReturnType<typeof useComparativa>)
}

describe('ComparativaCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders card title', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getByText('Comparativa deuda vs ahorro')).toBeInTheDocument()
  })

  it('renders deudas section header', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getByText('Tus deudas')).toBeInTheDocument()
  })

  it('renders ahorros section header', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getByText('Tu ahorro')).toBeInTheDocument()
  })

  it('renders deuda item name', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getByText('Prestamo personal')).toBeInTheDocument()
  })

  it('renders ahorro item name', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getByText('Meta: Viaje')).toBeInTheDocument()
  })

  it('renders recomendacion text', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getByText('Enfoca tus esfuerzos en pagar las deudas con mayor tasa de interes.')).toBeInTheDocument()
  })

  it('renders recomendacion label', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getAllByText('Recomendacion').length).toBeGreaterThan(0)
  })

  it('renders diferencia row', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getByText('Diferencia')).toBeInTheDocument()
  })

  it('shows loading skeletons when isLoading', () => {
    setupMock({ isLoading: true })
    const { container } = render(<ComparativaCard />)
    expect(container.querySelector('[class*="animate-pulse"]')).not.toBeNull()
  })

  it('renders nothing when isError', () => {
    setupMock({ isError: true })
    const { container } = render(<ComparativaCard />)
    expect(container.firstChild).toBeNull()
  })

  it('shows no deudas message when deudas is empty', () => {
    setupMock({ data: { ...mockComparativa, deudas: [] } })
    render(<ComparativaCard />)
    expect(screen.getByText('Sin deudas activas')).toBeInTheDocument()
  })

  it('shows no ahorros message when ahorros is empty', () => {
    setupMock({ data: { ...mockComparativa, ahorros: [] } })
    render(<ComparativaCard />)
    expect(screen.getByText('Sin metas de ahorro activas')).toBeInTheDocument()
  })

  it('renders interest rate when tasa_anual is present', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getByText('24% anual')).toBeInTheDocument()
  })

  it('renders total costo label', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getByText('Total costo')).toBeInTheDocument()
  })

  it('renders total rendimiento label', () => {
    setupMock({ data: mockComparativa })
    render(<ComparativaCard />)
    expect(screen.getByText('Total rendimiento')).toBeInTheDocument()
  })
})
