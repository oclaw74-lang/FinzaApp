import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EducacionPage } from '@/pages/EducacionPage'
import type { LeccionData } from '@/types/educacion'

vi.mock('@/hooks/useEducacion', () => ({
  useLecciones: vi.fn(),
  useCompletarLeccion: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { useLecciones, useCompletarLeccion } from '@/hooks/useEducacion'

const mockLeccionPendiente: LeccionData = {
  id: 'leccion-1',
  titulo: 'Que es un presupuesto',
  descripcion_corta: 'Aprende a crear y mantener un presupuesto mensual efectivo',
  contenido_json: {
    hook: 'El 70% de las personas que presupuestan logran sus metas de ahorro',
    concept: 'Un presupuesto es un plan para tu dinero',
    action: 'Calcula tus ingresos y egresos del mes pasado',
    tip: 'Usa la regla 50/30/20 en Finza',
  },
  nivel: 'fundamentos',
  duracion_minutos: 5,
  orden: 1,
  completada: false,
}

const mockLeccionCompletada: LeccionData = {
  id: 'leccion-2',
  titulo: 'Fondo de emergencia',
  descripcion_corta: 'Por que necesitas un fondo de emergencia',
  contenido_json: {
    hook: 'El 60% de las personas no tiene ahorros de emergencia',
    concept: 'Un fondo de emergencia cubre 3-6 meses de gastos',
    action: 'Calcula cuanto necesitas para tu fondo',
    tip: 'Configura tu fondo de emergencia en Finza',
  },
  nivel: 'fundamentos',
  duracion_minutos: 7,
  orden: 2,
  completada: true,
}

const mockLeccionControl: LeccionData = {
  id: 'leccion-3',
  titulo: 'Controlar gastos hormiga',
  descripcion_corta: 'Identifica y elimina gastos pequenos que suman mucho',
  contenido_json: {
    hook: 'Los gastos hormiga pueden representar el 20% de tus ingresos',
    concept: 'Gastos hormiga son pequenos gastos frecuentes e innecesarios',
    action: 'Revisa tus egresos del mes y marca los gastos hormiga',
    tip: 'Usa el etiquetado de impulso en Finza',
  },
  nivel: 'control',
  duracion_minutos: 6,
  orden: 1,
  completada: false,
}

function setupMocks({
  lecciones = [] as LeccionData[],
  isLoading = false,
} = {}) {
  const mutateAsync = vi.fn().mockResolvedValue({})

  vi.mocked(useLecciones).mockReturnValue({
    data: lecciones,
    isLoading,
    isError: false,
  } as unknown as ReturnType<typeof useLecciones>)

  vi.mocked(useCompletarLeccion).mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useCompletarLeccion>)

  return { mutateAsync }
}

describe('EducacionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    setupMocks()
    render(<EducacionPage />)
    expect(screen.getByText('Educacion financiera')).toBeInTheDocument()
  })

  it('renders page subtitle', () => {
    setupMocks()
    render(<EducacionPage />)
    expect(screen.getByText('Aprende a gestionar mejor tu dinero')).toBeInTheDocument()
  })

  it('renders tab buttons for niveles', () => {
    setupMocks()
    render(<EducacionPage />)
    expect(screen.getByText('Fundamentos')).toBeInTheDocument()
    expect(screen.getByText('Control')).toBeInTheDocument()
    expect(screen.getByText('Crecimiento')).toBeInTheDocument()
  })

  it('shows empty state when no lecciones in selected tab', () => {
    setupMocks({ lecciones: [mockLeccionControl] })
    render(<EducacionPage />)
    // Default tab is 'fundamentos', no lecciones there
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  it('renders leccion card with titulo', () => {
    setupMocks({ lecciones: [mockLeccionPendiente] })
    render(<EducacionPage />)
    expect(screen.getByText('Que es un presupuesto')).toBeInTheDocument()
  })

  it('renders pendiente badge on incomplete leccion', () => {
    setupMocks({ lecciones: [mockLeccionPendiente] })
    render(<EducacionPage />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('renders completada badge on completed leccion', () => {
    setupMocks({ lecciones: [mockLeccionCompletada] })
    render(<EducacionPage />)
    expect(screen.getByText('Completada')).toBeInTheDocument()
  })

  it('shows loading skeleton while fetching', () => {
    setupMocks({ isLoading: true })
    const { container } = render(<EducacionPage />)
    expect(container.querySelector('[class*="animate-pulse"]')).not.toBeNull()
  })

  it('shows progress bar when there are lecciones', () => {
    setupMocks({ lecciones: [mockLeccionPendiente, mockLeccionCompletada] })
    render(<EducacionPage />)
    const progressBar = document.querySelector('[role="progressbar"]')
    expect(progressBar).not.toBeNull()
  })

  it('shows correct progress count', () => {
    setupMocks({ lecciones: [mockLeccionPendiente, mockLeccionCompletada] })
    render(<EducacionPage />)
    // 1 completada de 2 total
    expect(screen.getByText(/1.*de.*2.*lecciones completadas/)).toBeInTheDocument()
  })

  it('opens modal when clicking on pending leccion', () => {
    setupMocks({ lecciones: [mockLeccionPendiente] })
    render(<EducacionPage />)
    fireEvent.click(screen.getByText('Que es un presupuesto'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows marcar como completada button in modal', () => {
    setupMocks({ lecciones: [mockLeccionPendiente] })
    render(<EducacionPage />)
    fireEvent.click(screen.getByText('Que es un presupuesto'))
    expect(screen.getByText('Marcar como completada')).toBeInTheDocument()
  })

  it('calls completar mutation when button clicked', async () => {
    const { mutateAsync } = setupMocks({ lecciones: [mockLeccionPendiente] })
    render(<EducacionPage />)
    fireEvent.click(screen.getByText('Que es un presupuesto'))
    fireEvent.click(screen.getByText('Marcar como completada'))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('leccion-1'))
  })

  it('does not open modal when clicking completed leccion', () => {
    setupMocks({ lecciones: [mockLeccionCompletada] })
    render(<EducacionPage />)
    fireEvent.click(screen.getByText('Fondo de emergencia'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('switches to control tab and shows control lecciones', () => {
    setupMocks({ lecciones: [mockLeccionPendiente, mockLeccionControl] })
    render(<EducacionPage />)
    const controlTab = screen.getByRole('tab', { name: 'Control' })
    fireEvent.click(controlTab)
    expect(screen.getByText('Controlar gastos hormiga')).toBeInTheDocument()
    expect(screen.queryByText('Que es un presupuesto')).not.toBeInTheDocument()
  })

  it('shows leccion description in card', () => {
    setupMocks({ lecciones: [mockLeccionPendiente] })
    render(<EducacionPage />)
    expect(screen.getByText('Aprende a crear y mantener un presupuesto mensual efectivo')).toBeInTheDocument()
  })
})
