import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FondoEmergenciaPage } from '@/pages/FondoEmergenciaPage'

vi.mock('@/hooks/useFondoEmergencia', () => ({
  useFondoEmergencia: vi.fn(),
  useCreateFondoEmergencia: vi.fn(),
  useUpdateFondoEmergencia: vi.fn(),
  useDepositarFondo: vi.fn(),
  useRetirarFondo: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import {
  useFondoEmergencia,
  useCreateFondoEmergencia,
  useUpdateFondoEmergencia,
  useDepositarFondo,
  useRetirarFondo,
} from '@/hooks/useFondoEmergencia'

function setupMocks(fondo: null | object = null, loading = false) {
  const mutateAsync = vi.fn().mockResolvedValue({})
  vi.mocked(useFondoEmergencia).mockReturnValue({ data: fondo ?? undefined, isLoading: loading } as ReturnType<typeof useFondoEmergencia>)
  vi.mocked(useCreateFondoEmergencia).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useCreateFondoEmergencia>)
  vi.mocked(useUpdateFondoEmergencia).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useUpdateFondoEmergencia>)
  vi.mocked(useDepositarFondo).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useDepositarFondo>)
  vi.mocked(useRetirarFondo).mockReturnValue({ mutateAsync, isPending: false } as ReturnType<typeof useRetirarFondo>)
  return { mutateAsync }
}

const mockFondo = {
  id: 'fondo-1',
  user_id: 'user-1',
  monto_actual: 5000,
  meta_meses: 3 as 1 | 3 | 6,
  meta_calculada: 15000,
  porcentaje: 33.33,
  notas: null,
}

describe('FondoEmergenciaPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders page title', () => {
    setupMocks()
    render(<FondoEmergenciaPage />)
    expect(screen.getByText('Fondo de emergencia')).toBeInTheDocument()
  })

  it('shows empty state when no fondo', () => {
    setupMocks(null)
    render(<FondoEmergenciaPage />)
    expect(screen.getByText('Sin fondo configurado')).toBeInTheDocument()
  })

  it('shows configure button in empty state', () => {
    setupMocks(null)
    render(<FondoEmergenciaPage />)
    expect(screen.getByText('Configurar fondo')).toBeInTheDocument()
  })

  it('renders fondo data when available', () => {
    setupMocks(mockFondo)
    render(<FondoEmergenciaPage />)
    expect(screen.getByText('Monto actual')).toBeInTheDocument()
  })

  it('shows depositar and retirar buttons when fondo exists', () => {
    setupMocks(mockFondo)
    render(<FondoEmergenciaPage />)
    expect(screen.getByText('Depositar')).toBeInTheDocument()
    expect(screen.getByText('Retirar')).toBeInTheDocument()
  })

  it('shows loading skeletons when isLoading', () => {
    setupMocks(null, true)
    render(<FondoEmergenciaPage />)
    expect(screen.queryByText('Sin fondo configurado')).not.toBeInTheDocument()
  })
})
