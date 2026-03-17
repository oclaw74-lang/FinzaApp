import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PresupuestosPage } from '@/pages/PresupuestosPage'
import type { PresupuestoEstado } from '@/types/presupuesto'
import type { CategoriaResponse } from '@/types/transacciones'

// Mock hooks
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
import type { PresupuestoSugerido } from '@/types/presupuesto'

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

  vi.mocked(usePresupuestosSugeridos).mockReturnValue({
    data: [],
    isFetching: false,
    refetch: vi.fn().mockResolvedValue({ data: [] }),
  } as unknown as ReturnType<typeof usePresupuestosSugeridos>)
}

describe('PresupuestosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders page content', () => {
    render(<PresupuestosPage />)
    // Title is now rendered by the shared Header component (not duplicated in page body)
    expect(screen.getByRole('button', { name: /nuevo/i })).toBeInTheDocument()
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
      screen.getByText(/sin presupuestos/i)
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

  it('renders Sugerir presupuestos button', () => {
    render(<PresupuestosPage />)
    expect(screen.getByRole('button', { name: /sugerir presupuestos/i })).toBeInTheDocument()
  })

  it('opens suggestions modal when Sugerir button is clicked', async () => {
    const refetch = vi.fn().mockResolvedValue({ data: [] })
    vi.mocked(usePresupuestosSugeridos).mockReturnValue({
      data: [],
      isFetching: false,
      refetch,
    } as unknown as ReturnType<typeof usePresupuestosSugeridos>)

    render(<PresupuestosPage />)
    fireEvent.click(screen.getByRole('button', { name: /sugerir presupuestos/i }))
    expect(screen.getByRole('dialog', { name: /sugerencias inteligentes/i })).toBeInTheDocument()
  })

  it('shows empty state in suggestions modal when no data', async () => {
    const refetch = vi.fn().mockResolvedValue({ data: [] })
    vi.mocked(usePresupuestosSugeridos).mockReturnValue({
      data: [],
      isFetching: false,
      refetch,
    } as unknown as ReturnType<typeof usePresupuestosSugeridos>)

    render(<PresupuestosPage />)
    fireEvent.click(screen.getByRole('button', { name: /sugerir presupuestos/i }))
    expect(screen.getByText(/sin datos suficientes/i)).toBeInTheDocument()
  })

  it('renders suggestion rows with Aplicar buttons when data is available', async () => {
    const mockSugeridos: PresupuestoSugerido[] = [
      { categoria_id: 'cat-1', categoria_nombre: 'Alimentacion', promedio_mensual: 400, sugerido: 440, mes: 3, year: 2026 },
      { categoria_id: 'cat-3', categoria_nombre: 'Servicios', promedio_mensual: 200, sugerido: 220, mes: 3, year: 2026 },
    ]
    const refetch = vi.fn().mockResolvedValue({ data: mockSugeridos })
    vi.mocked(usePresupuestosSugeridos).mockReturnValue({
      data: mockSugeridos,
      isFetching: false,
      refetch,
    } as unknown as ReturnType<typeof usePresupuestosSugeridos>)

    render(<PresupuestosPage />)
    fireEvent.click(screen.getByRole('button', { name: /sugerir presupuestos/i }))
    // Multiple elements with same text are OK — just check at least one exists per category
    expect(screen.getAllByText('Alimentacion').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Servicios').length).toBeGreaterThanOrEqual(1)
    const aplicarBtns = screen.getAllByRole('button', { name: /aplicar$/i })
    expect(aplicarBtns.length).toBeGreaterThanOrEqual(2)
  })

  it('calls createPresupuesto when Aplicar button is clicked', async () => {
    const mockSugeridos: PresupuestoSugerido[] = [
      { categoria_id: 'cat-1', categoria_nombre: 'Alimentacion', promedio_mensual: 400, sugerido: 440, mes: 3, year: 2026 },
    ]
    const mutateAsync = vi.fn().mockResolvedValue({})
    const refetch = vi.fn().mockResolvedValue({ data: mockSugeridos })
    vi.mocked(usePresupuestosSugeridos).mockReturnValue({
      data: mockSugeridos,
      isFetching: false,
      refetch,
    } as unknown as ReturnType<typeof usePresupuestosSugeridos>)
    vi.mocked(useCreatePresupuesto).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePresupuesto>)

    render(<PresupuestosPage />)
    fireEvent.click(screen.getByRole('button', { name: /sugerir presupuestos/i }))
    const aplicarBtn = screen.getByRole('button', { name: /aplicar$/i })
    fireEvent.click(aplicarBtn)
    await vi.waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        categoria_id: 'cat-1',
        mes: expect.any(Number),
        year: expect.any(Number),
        monto_limite: 440,
      })
    })
  })

  it('closes suggestions modal when X button is clicked', async () => {
    const refetch = vi.fn().mockResolvedValue({ data: [] })
    vi.mocked(usePresupuestosSugeridos).mockReturnValue({
      data: [],
      isFetching: false,
      refetch,
    } as unknown as ReturnType<typeof usePresupuestosSugeridos>)

    render(<PresupuestosPage />)
    fireEvent.click(screen.getByRole('button', { name: /sugerir presupuestos/i }))
    expect(screen.getByRole('dialog', { name: /sugerencias inteligentes/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(screen.queryByRole('dialog', { name: /sugerencias inteligentes/i })).not.toBeInTheDocument()
  })
})
