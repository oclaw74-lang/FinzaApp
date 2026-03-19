import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificacionesPage } from '@/pages/NotificacionesPage'
import type { NotificacionData } from '@/hooks/useNotificaciones'

vi.mock('@/hooks/useNotificaciones', () => ({
  useNotificaciones: vi.fn(),
  useMarcarLeida: vi.fn(),
  useMarcarTodasLeidas: vi.fn(),
  useEliminarNotificacion: vi.fn(),
  useGenerarNotificaciones: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import {
  useNotificaciones,
  useMarcarLeida,
  useMarcarTodasLeidas,
  useEliminarNotificacion,
  useGenerarNotificaciones,
} from '@/hooks/useNotificaciones'

const mockUrgenteNotif: NotificacionData = {
  id: 'notif-1',
  tipo: 'urgente',
  categoria: 'presupuesto',
  titulo: 'Presupuesto al 85%',
  mensaje: 'Has usado el 85% de tu presupuesto de Alimentacion.',
  leida: false,
  created_at: new Date().toISOString(),
}

const mockLogroNotif: NotificacionData = {
  id: 'notif-2',
  tipo: 'logro',
  categoria: 'motivacion',
  titulo: '¡Excelente salud financiera!',
  mensaje: 'Tu score financiero es 85/100.',
  leida: true,
  created_at: new Date().toISOString(),
}

function setupMocks(notificaciones: NotificacionData[] = []) {
  const mutate = vi.fn()
  const mutateAsync = vi.fn().mockResolvedValue({})

  vi.mocked(useNotificaciones).mockReturnValue({
    data: notificaciones,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useNotificaciones>)

  vi.mocked(useMarcarLeida).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useMarcarLeida>)
  vi.mocked(useMarcarTodasLeidas).mockReturnValue({ mutate, mutateAsync, isPending: false } as unknown as ReturnType<typeof useMarcarTodasLeidas>)
  vi.mocked(useEliminarNotificacion).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useEliminarNotificacion>)
  vi.mocked(useGenerarNotificaciones).mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useGenerarNotificaciones>)

  return { mutate, mutateAsync }
}

describe('NotificacionesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    setupMocks()
    render(<NotificacionesPage />)
    expect(screen.getByText('Notificaciones')).toBeInTheDocument()
  })

  it('shows empty state when no notifications', () => {
    setupMocks([])
    render(<NotificacionesPage />)
    expect(screen.getByText('Sin notificaciones')).toBeInTheDocument()
  })

  it('renders urgente notification with title', () => {
    setupMocks([mockUrgenteNotif])
    render(<NotificacionesPage />)
    expect(screen.getByText('Presupuesto al 85%')).toBeInTheDocument()
    expect(screen.getAllByText('Urgente').length).toBeGreaterThan(0)
  })

  it('renders logro notification', () => {
    setupMocks([mockLogroNotif])
    render(<NotificacionesPage />)
    expect(screen.getByText('¡Excelente salud financiera!')).toBeInTheDocument()
    expect(screen.getAllByText('Logro').length).toBeGreaterThan(0)
  })

  it('shows unread count badge', () => {
    setupMocks([mockUrgenteNotif, mockLogroNotif])
    render(<NotificacionesPage />)
    // 1 unread (urgente is not leida, logro is leida)
    expect(screen.getByText(/1.*sin leer/i)).toBeInTheDocument()
  })

  it('shows mark all read button when there are unread', () => {
    setupMocks([mockUrgenteNotif])
    render(<NotificacionesPage />)
    expect(screen.getByText('Marcar todas como leidas')).toBeInTheDocument()
  })

  it('shows loading skeletons when isLoading', () => {
    vi.mocked(useNotificaciones).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useNotificaciones>)
    vi.mocked(useMarcarLeida).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useMarcarLeida>)
    vi.mocked(useMarcarTodasLeidas).mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useMarcarTodasLeidas>)
    vi.mocked(useEliminarNotificacion).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useEliminarNotificacion>)
    vi.mocked(useGenerarNotificaciones).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useGenerarNotificaciones>)

    render(<NotificacionesPage />)
    // Should not show page content while loading
    expect(screen.queryByText('Sin notificaciones')).not.toBeInTheDocument()
  })

  it('calls generar on mount', () => {
    const { mutate } = setupMocks([])
    render(<NotificacionesPage />)
    expect(mutate).toHaveBeenCalled()
  })

  it('renders advertencia notification with correct section header', () => {
    const mockAdvertenciaNotif: NotificacionData = {
      id: 'notif-adv-1',
      tipo: 'advertencia',
      categoria: 'prestamo_pago_proximo',
      titulo: 'Pago proximo de prestamo',
      mensaje: 'Tienes un pago de prestamo en 3 dias.',
      leida: false,
      created_at: new Date().toISOString(),
    }
    setupMocks([mockAdvertenciaNotif])
    render(<NotificacionesPage />)
    expect(screen.getByText('Pago proximo de prestamo')).toBeInTheDocument()
    expect(screen.getAllByText('Advertencia').length).toBeGreaterThan(0)
  })

  it('renders advertencia notification type badge', () => {
    const mockAdvertenciaNotif: NotificacionData = {
      id: 'notif-adv-2',
      tipo: 'advertencia',
      categoria: 'suscripcion_cobro_proximo',
      titulo: 'Cobro de suscripcion manana',
      mensaje: 'Netflix se cobra manana por RD$500.',
      leida: false,
      created_at: new Date().toISOString(),
    }
    setupMocks([mockAdvertenciaNotif])
    render(<NotificacionesPage />)
    expect(screen.getByText('Cobro de suscripcion manana')).toBeInTheDocument()
  })
})
