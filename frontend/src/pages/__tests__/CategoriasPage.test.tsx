import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CategoriasPage } from '@/pages/CategoriasPage'
import type { CategoriaResponse } from '@/types/transacciones'

vi.mock('@/hooks/useCategorias', () => ({
  useCategorias: vi.fn(),
  useCreateCategoria: vi.fn(),
  useUpdateCategoria: vi.fn(),
  useDeleteCategoria: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import {
  useCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
} from '@/hooks/useCategorias'

const mockCategoriasSistema: CategoriaResponse[] = [
  { id: 'sys-1', nombre: 'Salario', tipo: 'ingreso', icono: '💼', color: null, es_sistema: true },
  { id: 'sys-2', nombre: 'Alimentacion', tipo: 'egreso', icono: '🍔', color: null, es_sistema: true },
]

const mockCategoriasPersonalizadas: CategoriaResponse[] = [
  { id: 'usr-1', nombre: 'Mascota', tipo: 'egreso', icono: '🐾', color: null, es_sistema: false },
]

const mockAllCategorias = [...mockCategoriasSistema, ...mockCategoriasPersonalizadas]

function setupMocks({
  data = mockAllCategorias,
  isLoading = false,
  isError = false,
}: {
  data?: CategoriaResponse[]
  isLoading?: boolean
  isError?: boolean
} = {}) {
  vi.mocked(useCategorias).mockReturnValue({
    data,
    isLoading,
    isError,
    isPending: isLoading,
    isSuccess: !isLoading && !isError,
    error: null,
  } as ReturnType<typeof useCategorias>)

  vi.mocked(useCreateCategoria).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateCategoria>)

  vi.mocked(useUpdateCategoria).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateCategoria>)

  vi.mocked(useDeleteCategoria).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteCategoria>)
}

describe('CategoriasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders the page subtitle', () => {
    render(<CategoriasPage />)
    expect(
      screen.getByText('Administra tus categorias de ingresos y egresos')
    ).toBeInTheDocument()
  })

  it('renders the nueva categoria button', () => {
    render(<CategoriasPage />)
    const buttons = screen.getAllByRole('button', { name: /nueva categoria/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('shows skeleton rows when loading', () => {
    setupMocks({ isLoading: true, data: [] })
    render(<CategoriasPage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows sistema badge for system categories', () => {
    render(<CategoriasPage />)
    // Each system category has a Badge with 'Sistema' text (span elements)
    // The h2 heading also contains 'Sistema', so we look for span badges specifically
    const sistemaBadges = document.querySelectorAll('span.rounded-full')
    const sistemaBadgeTexts = Array.from(sistemaBadges).filter(
      (el) => el.textContent?.trim() === 'Sistema'
    )
    expect(sistemaBadgeTexts.length).toBe(mockCategoriasSistema.length)
  })

  it('shows edit button only for non-sistema categories', () => {
    render(<CategoriasPage />)
    const editButtons = screen.getAllByLabelText(/Editar/)
    // Only personalizada categories should have edit buttons
    expect(editButtons).toHaveLength(mockCategoriasPersonalizadas.length)
  })

  it('shows delete button only for non-sistema categories', () => {
    render(<CategoriasPage />)
    const deleteButtons = screen.getAllByLabelText(/Eliminar/)
    expect(deleteButtons).toHaveLength(mockCategoriasPersonalizadas.length)
  })

  it('shows empty state when no custom categories exist', () => {
    setupMocks({ data: mockCategoriasSistema })
    render(<CategoriasPage />)
    expect(screen.getByText('Sin categorias personalizadas')).toBeInTheDocument()
    expect(screen.getByText('Crea tu primera categoria personalizada')).toBeInTheDocument()
  })

  it('renders system category names', () => {
    render(<CategoriasPage />)
    expect(screen.getByText('Salario')).toBeInTheDocument()
    expect(screen.getByText('Alimentacion')).toBeInTheDocument()
  })

  it('renders custom category names', () => {
    render(<CategoriasPage />)
    expect(screen.getByText('Mascota')).toBeInTheDocument()
  })
})
