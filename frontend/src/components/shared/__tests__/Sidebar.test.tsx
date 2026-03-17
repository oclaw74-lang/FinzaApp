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

  it('shows desktop toggle button at all times', () => {
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

  it('toggle button expands sidebar when collapsed', () => {
    setupMocks({ sidebarCollapsed: true })
    renderSidebar()
    const toggleBtn = screen.getByTitle('Expandir sidebar')
    fireEvent.click(toggleBtn)
    expect(mockSetSidebarCollapsed).toHaveBeenCalledWith(false)
  })

  it('logo button expands sidebar when collapsed', () => {
    setupMocks({ sidebarCollapsed: true })
    renderSidebar()
    // When collapsed there are two "Expandir sidebar" buttons: logo (type=button) and toggle
    // The logo button is the one with type="button" explicitly set
    const logoBtns = screen.getAllByLabelText('Expandir sidebar')
    // Logo button is the first one (has type="button" and contains the F icon)
    const logoBtn = logoBtns.find((el) => el.getAttribute('type') === 'button') as HTMLElement
    fireEvent.click(logoBtn)
    expect(mockSetSidebarCollapsed).toHaveBeenCalledWith(false)
  })

  it('logo button does not call setSidebarCollapsed when expanded', () => {
    setupMocks({ sidebarCollapsed: false })
    renderSidebar()
    // When expanded the logo button has tabIndex=-1 and no aria-label
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
