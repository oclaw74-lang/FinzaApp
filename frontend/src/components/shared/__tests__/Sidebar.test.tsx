import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/shared/Sidebar'

// Mock stores
const mockSetSidebarCollapsed = vi.fn()
const mockSetSidebarOpen = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/store/uiStore', () => ({
  useUiStore: vi.fn(),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/components/shared/ScoreWidget', () => ({
  ScoreWidget: () => <div data-testid="score-widget" />,
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid="avatar">{name}</div>,
}))

import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

function setupMocks({
  sidebarCollapsed = false,
  sidebarOpen = true,
}: {
  sidebarCollapsed?: boolean
  sidebarOpen?: boolean
} = {}) {
  vi.mocked(useUiStore).mockReturnValue({
    sidebarOpen,
    setSidebarOpen: mockSetSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed: mockSetSidebarCollapsed,
  } as ReturnType<typeof useUiStore>)

  vi.mocked(useAuthStore).mockReturnValue({
    user: { email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
    signOut: mockSignOut,
  } as unknown as ReturnType<typeof useAuthStore>)
}

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders correctly with default props', () => {
    renderSidebar()
    expect(screen.getByText('Finza')).toBeInTheDocument()
  })

  it('shows logo text when expanded', () => {
    setupMocks({ sidebarCollapsed: false })
    renderSidebar()
    expect(screen.getByText('Finza')).toBeInTheDocument()
  })

  it('hides logo text when collapsed', () => {
    setupMocks({ sidebarCollapsed: true })
    renderSidebar()
    expect(screen.queryByText('Finza')).not.toBeInTheDocument()
  })

  it('shows toggle button when expanded', () => {
    setupMocks({ sidebarCollapsed: false })
    renderSidebar()
    const toggleBtn = screen.getByTitle('Colapsar sidebar')
    expect(toggleBtn).toBeInTheDocument()
  })

  it('toggle button collapses sidebar when expanded', () => {
    setupMocks({ sidebarCollapsed: false })
    renderSidebar()
    const toggleBtn = screen.getByTitle('Colapsar sidebar')
    fireEvent.click(toggleBtn)
    expect(mockSetSidebarCollapsed).toHaveBeenCalledWith(true)
  })

  it('does not show toggle button when collapsed', () => {
    setupMocks({ sidebarCollapsed: true })
    renderSidebar()
    expect(screen.queryByTitle('Expandir sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Colapsar sidebar')).not.toBeInTheDocument()
  })

  it('logo button expands sidebar when collapsed', () => {
    setupMocks({ sidebarCollapsed: true })
    renderSidebar()
    // When collapsed only the logo button expands the sidebar
    const logoBtn = screen.getByLabelText('Expandir sidebar')
    fireEvent.click(logoBtn)
    expect(mockSetSidebarCollapsed).toHaveBeenCalledWith(false)
  })

  it('logo button does not call setSidebarCollapsed when expanded', () => {
    setupMocks({ sidebarCollapsed: false })
    renderSidebar()
    const fIcon = screen.getByText('F').closest('button')
    if (fIcon) fireEvent.click(fIcon)
    expect(mockSetSidebarCollapsed).not.toHaveBeenCalled()
  })

  it('shows mobile close button on mobile overlay', () => {
    renderSidebar()
    const closeBtn = screen.getByLabelText('Cerrar menu')
    expect(closeBtn).toBeInTheDocument()
  })

  it('calls setSidebarOpen(false) when mobile close button is clicked', () => {
    renderSidebar()
    const closeBtn = screen.getByLabelText('Cerrar menu')
    fireEvent.click(closeBtn)
    expect(mockSetSidebarOpen).toHaveBeenCalledWith(false)
  })

  it('renders nav items', () => {
    renderSidebar()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Ingresos')).toBeInTheDocument()
    expect(screen.getByText('Egresos')).toBeInTheDocument()
  })

  it('renders section label PRINCIPAL', () => {
    setupMocks({ sidebarCollapsed: false })
    renderSidebar()
    expect(screen.getByText('PRINCIPAL')).toBeInTheDocument()
  })

  it('renders section label COMPROMISOS', () => {
    setupMocks({ sidebarCollapsed: false })
    renderSidebar()
    expect(screen.getByText('COMPROMISOS')).toBeInTheDocument()
  })

  it('renders section label ANALISIS', () => {
    setupMocks({ sidebarCollapsed: false })
    renderSidebar()
    expect(screen.getByText('ANALISIS')).toBeInTheDocument()
  })

  it('hides section labels when sidebar is collapsed', () => {
    setupMocks({ sidebarCollapsed: true })
    renderSidebar()
    expect(screen.queryByText('PRINCIPAL')).not.toBeInTheDocument()
    expect(screen.queryByText('COMPROMISOS')).not.toBeInTheDocument()
    expect(screen.queryByText('ANALISIS')).not.toBeInTheDocument()
  })

  it('does not render Categorias in nav', () => {
    renderSidebar()
    expect(screen.queryByText('Categorias')).not.toBeInTheDocument()
  })

  it('does not render Suscripciones in nav', () => {
    renderSidebar()
    expect(screen.queryByText('Suscripciones')).not.toBeInTheDocument()
  })

  it('does not render Retos in nav', () => {
    renderSidebar()
    expect(screen.queryByText('Retos')).not.toBeInTheDocument()
  })

  it('does not render Educacion in nav', () => {
    renderSidebar()
    expect(screen.queryByText('Educacion')).not.toBeInTheDocument()
  })

  it('does not render Reportes in nav', () => {
    renderSidebar()
    expect(screen.queryByText('Reportes')).not.toBeInTheDocument()
  })

  it('renders user name in user section', () => {
    renderSidebar()
    expect(screen.getAllByText('Test User').length).toBeGreaterThan(0)
  })

  it('calls signOut and navigates on logout click', () => {
    renderSidebar()
    const logoutBtn = screen.getByLabelText('Cerrar sesion')
    fireEvent.click(logoutBtn)
    expect(mockSignOut).toHaveBeenCalled()
  })
})
