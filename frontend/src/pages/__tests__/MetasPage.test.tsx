import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MetasPage } from '@/pages/MetasPage'

vi.mock('@/hooks/useMetas', () => ({
  useMetas: vi.fn(),
  useCreateMeta: vi.fn(),
  useUpdateMeta: vi.fn(),
  useDeleteMeta: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

vi.mock('@/features/metas/components/MetasResumenCards', () => ({
  MetasResumenCards: () => <div data-testid="resumen-cards" />,
}))

vi.mock('@/features/metas/components/MetaCard', () => ({
  MetaCard: (props: any) => <div data-testid="meta-card">{props.meta.nombre}</div>,
}))

vi.mock('@/features/metas/components/MetaModal', () => ({
  MetaModal: (props: any) => props.isOpen ? <div data-testid="meta-modal" /> : null,
}))

vi.mock('@/features/metas/components/MetaDetail', () => ({
  MetaDetail: () => null,
}))

import { useMetas, useCreateMeta, useUpdateMeta, useDeleteMeta } from '@/hooks/useMetas'

const mockMetas = [
  { id: 'meta-1', nombre: 'Vacaciones', monto_objetivo: 100000, monto_actual: 30000, moneda: 'DOP', fecha_limite: null, color: '#5B8AF5', completada: false },
  { id: 'meta-2', nombre: 'Auto nuevo', monto_objetivo: 500000, monto_actual: 100000, moneda: 'DOP', fecha_limite: null, color: '#22c55e', completada: false },
]

function setup({ data = mockMetas, isLoading = false } = {}) {
  vi.mocked(useMetas).mockReturnValue({
    data,
    isLoading,
    isError: false,
    error: null,
  } as ReturnType<typeof useMetas>)

  vi.mocked(useCreateMeta).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateMeta>)

  vi.mocked(useUpdateMeta).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateMeta>)

  vi.mocked(useDeleteMeta).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteMeta>)
}

describe('MetasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setup()
  })

  it('renders loading skeleton when isLoading', () => {
    setup({ data: [], isLoading: true })
    render(<MetasPage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows empty state when no metas', () => {
    setup({ data: [], isLoading: false })
    render(<MetasPage />)
    expect(screen.getByText('metas.noMetas')).toBeInTheDocument()
  })

  it('shows meta cards when data loaded', () => {
    render(<MetasPage />)
    expect(screen.getByText('Vacaciones')).toBeInTheDocument()
    expect(screen.getByText('Auto nuevo')).toBeInTheDocument()
  })

  it('shows nueva meta button', () => {
    render(<MetasPage />)
    const buttons = screen.getAllByRole('button', { name: /metas\.newMeta/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('clicking nueva meta button opens modal', () => {
    render(<MetasPage />)
    expect(screen.queryByTestId('meta-modal')).not.toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    const newButton = buttons.find(b => b.textContent?.includes('metas.newMeta'))
    expect(newButton).toBeDefined()
    fireEvent.click(newButton!)
    expect(screen.getByTestId('meta-modal')).toBeInTheDocument()
  })
})
