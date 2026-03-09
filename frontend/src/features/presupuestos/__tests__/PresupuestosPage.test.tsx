import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PresupuestosPage } from '@/pages/PresupuestosPage'
import type { PresupuestoEstado } from '@/types/presupuesto'
import type { CategoriaResponse } from '@/types/transacciones'

// Mock hooks
vi.mock('@/hooks/usePresupuestos', () => ({
  usePresupuestosEstado: vi.fn(),
  useCreatePresupuesto: vi.fn(),
  useUpdatePresupuesto: vi.fn(),
  useDeletePresupuesto: vi.fn(),
}))

vi.mock('@/hooks/useCategorias', () => ({
  useCategorias: vi.fn(),
}))

import {
  usePresupuestosEstado,
  useCreatePresupuesto,
  useUpdatePresupuesto,
  useDeletePresupuesto,
} from '@/hooks/usePresupuestos'
import { useCategorias } from '@/hooks/useCategorias'

const mockEstados: PresupuestoEstado[] = [
  {
    id: 'pres-1',
    categoria_id: 'cat-1',
    categoria_nombre: 'Alimentacion',
    mes: 3,
    year: 2026,
    monto_limite: 500,
    gasto_actual: 350,
    porcentaje_usado: 70,
    alerta: false,
  },
  {
    id: 'pres-2',
    categoria_id: 'cat-2',
    categoria_nombre: 'Transporte',
    mes: 3,
    year: 2026,
    monto_limite: 500,
    gasto_actual: 480,
    porcentaje_usado: 96,
    alerta: true,
  },
]

const mockCategorias: CategoriaResponse[] = [
  {
    id: 'cat-1',
    nombre: 'Alimentacion',
    tipo: 'egreso',
    icono: null,
    color: null,
    es_sistema: true,
  },
  {
    id: 'cat-2',
    nombre: 'Transporte',
    tipo: 'egreso',
    icono: null,
    color: null,
    es_sistema: true,
  },
  {
    id: 'cat-3',
    nombre: 'Servicios',
    tipo: 'egreso',
    icono: null,
    color: null,
    es_sistema: true,
  },
  {
    id: 'cat-4',
    nombre: 'Salario',
    tipo: 'ingreso',
    icono: null,
    color: null,
    es_sistema: true,
  },
]

function setupMocks({
  estadoData = mockEstados,
  categoriasData = mockCategorias,
  isLoading = false,
  isError = false,
}: {
  estadoData?: PresupuestoEstado[]
  categoriasData?: CategoriaResponse[]
  isLoading?: boolean
  isError?: boolean
} = {}) {
  vi.mocked(usePresupuestosEstado).mockReturnValue({
    data: estadoData,
    isLoading,
    isError,
    isPending: false,
    isSuccess: !isLoading && !isError,
    error: null,
  } as ReturnType<typeof usePresupuestosEstado>)

  vi.mocked(useCategorias).mockReturnValue({
    data: categoriasData,
    isLoading: false,
    isError: false,
    isPending: false,
    isSuccess: true,
    error: null,
  } as ReturnType<typeof useCategorias>)

  vi.mocked(useCreatePresupuesto).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreatePresupuesto>)

  vi.mocked(useUpdatePresupuesto).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdatePresupuesto>)

  vi.mocked(useDeletePresupuesto).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeletePresupuesto>)
}

describe('PresupuestosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders page title', () => {
    render(<PresupuestosPage />)
    expect(screen.getByText('Presupuestos')).toBeInTheDocument()
  })

  it('renders Nuevo button', () => {
    render(<PresupuestosPage />)
    expect(screen.getByRole('button', { name: /nuevo/i })).toBeInTheDocument()
  })

  it('renders mes and year selectors', () => {
    render(<PresupuestosPage />)
    expect(screen.getByLabelText('Mes')).toBeInTheDocument()
    expect(screen.getByLabelText('Año')).toBeInTheDocument()
  })

  it('shows loading skeleton state', () => {
    setupMocks({ isLoading: true, estadoData: [] })
    render(<PresupuestosPage />)
    expect(screen.queryByText('Alimentacion')).not.toBeInTheDocument()
  })

  it('shows error state gracefully', () => {
    setupMocks({ isError: true, estadoData: [] })
    render(<PresupuestosPage />)
    expect(
      screen.getByText(/el servidor no esta disponible/i)
    ).toBeInTheDocument()
  })

  it('shows empty state when no presupuestos', () => {
    setupMocks({ estadoData: [] })
    render(<PresupuestosPage />)
    expect(
      screen.getByText(/no hay presupuestos asignados para este mes/i)
    ).toBeInTheDocument()
  })

  it('renders presupuesto cards when data is available', () => {
    render(<PresupuestosPage />)
    expect(screen.getByText('Alimentacion')).toBeInTheDocument()
    expect(screen.getByText('Transporte')).toBeInTheDocument()
  })

  it('shows "Sin presupuesto" section for categories without budget', () => {
    render(<PresupuestosPage />)
    expect(screen.getByText(/sin presupuesto/i)).toBeInTheDocument()
    expect(screen.getByText('Servicios')).toBeInTheDocument()
  })

  it('does not show ingreso categories in "Sin presupuesto" section', () => {
    render(<PresupuestosPage />)
    expect(screen.queryByText('Salario')).not.toBeInTheDocument()
  })

  it('opens create modal when Nuevo button is clicked', () => {
    render(<PresupuestosPage />)
    fireEvent.click(screen.getByRole('button', { name: /nuevo/i }))
    expect(screen.getByRole('dialog', { name: /nuevo presupuesto/i })).toBeInTheDocument()
  })

  it('opens create modal pre-filled when Asignar limite is clicked', () => {
    render(<PresupuestosPage />)
    const asignarBtns = screen.getAllByRole('button', { name: /asignar limite/i })
    fireEvent.click(asignarBtns[0])
    expect(screen.getByRole('dialog', { name: /nuevo presupuesto/i })).toBeInTheDocument()
  })

  it('opens edit modal when a PresupuestoCard is clicked', () => {
    render(<PresupuestosPage />)
    fireEvent.click(
      screen.getByRole('button', { name: /editar presupuesto de alimentacion/i })
    )
    expect(screen.getByRole('dialog', { name: /editar presupuesto/i })).toBeInTheDocument()
  })

  it('changes mes when selector changes', () => {
    render(<PresupuestosPage />)
    const mesSelect = screen.getByLabelText('Mes')
    fireEvent.change(mesSelect, { target: { value: '6' } })
    expect((mesSelect as HTMLSelectElement).value).toBe('6')
  })
})
