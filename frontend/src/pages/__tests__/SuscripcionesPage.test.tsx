import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SuscripcionesPage } from '@/pages/SuscripcionesPage'
import type { SuscripcionResumen } from '@/types/suscripciones'

vi.mock('@/hooks/useSuscripciones', () => ({
  useSuscripcionesResumen: vi.fn(),
  useCreateSuscripcion: vi.fn(),
  useUpdateSuscripcion: vi.fn(),
  useDeleteSuscripcion: vi.fn(),
  useDetectarSuscripciones: vi.fn(),
  useConfirmarDetectadas: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import {
  useSuscripcionesResumen,
  useCreateSuscripcion,
  useUpdateSuscripcion,
  useDeleteSuscripcion,
  useDetectarSuscripciones,
  useConfirmarDetectadas,
} from '@/hooks/useSuscripciones'

function setupMocks(resumen: Partial<SuscripcionResumen> | null = null, loading = false) {
  const mutateAsync = vi.fn().mockResolvedValue([])
  vi.mocked(useSuscripcionesResumen).mockReturnValue({
    data: resumen ?? undefined,
    isLoading: loading,
  } as ReturnType<typeof useSuscripcionesResumen>)
  vi.mocked(useCreateSuscripcion).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useCreateSuscripcion>)
  vi.mocked(useUpdateSuscripcion).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useUpdateSuscripcion>)
  vi.mocked(useDeleteSuscripcion).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useDeleteSuscripcion>)
  vi.mocked(useDetectarSuscripciones).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useDetectarSuscripciones>)
  vi.mocked(useConfirmarDetectadas).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useConfirmarDetectadas>)
}

const mockResumen: SuscripcionResumen = {
  suscripciones: [
    { id: 's-1', nombre: 'Netflix', monto: 300, monto_mensual: 300, frecuencia: 'mensual', moneda: 'DOP', activa: true, auto_detectada: false, fecha_proximo_cobro: null, notas: null },
    { id: 's-2', nombre: 'Spotify', monto: 150, monto_mensual: 150, frecuencia: 'mensual', moneda: 'DOP', activa: true, auto_detectada: true, fecha_proximo_cobro: null, notas: null },
  ],
  total_mensual: 450,
  total_anual: 5400,
  cantidad_activas: 2,
}

describe('SuscripcionesPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders page title', () => {
    setupMocks()
    render(<SuscripcionesPage />)
    expect(screen.getByText('Suscripciones')).toBeInTheDocument()
  })

  it('shows empty state when no subscriptions', () => {
    setupMocks({ suscripciones: [], total_mensual: 0, total_anual: 0, cantidad_activas: 0 })
    render(<SuscripcionesPage />)
    expect(screen.getByText('Sin suscripciones')).toBeInTheDocument()
  })

  it('renders subscription list', () => {
    setupMocks(mockResumen)
    render(<SuscripcionesPage />)
    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.getByText('Spotify')).toBeInTheDocument()
  })

  it('shows auto-detected badge', () => {
    setupMocks(mockResumen)
    render(<SuscripcionesPage />)
    expect(screen.getByText('Auto-detectada')).toBeInTheDocument()
  })

  it('shows detectar button', () => {
    setupMocks(mockResumen)
    render(<SuscripcionesPage />)
    expect(screen.getByText('Detectar automaticamente')).toBeInTheDocument()
  })

  it('shows nueva suscripcion button', () => {
    setupMocks(mockResumen)
    render(<SuscripcionesPage />)
    expect(screen.getByText('Nueva suscripcion')).toBeInTheDocument()
  })

  it('shows loading skeletons when isLoading', () => {
    setupMocks(null, true)
    render(<SuscripcionesPage />)
    expect(screen.queryByText('Sin suscripciones')).not.toBeInTheDocument()
  })
})
