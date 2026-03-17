import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from '@/components/shared/Layout'

// Mock child components to isolate Layout
vi.mock('@/components/shared/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}))
vi.mock('@/components/shared/Header', () => ({
  Header: () => <div data-testid="header" />,
}))
vi.mock('@/components/shared/StatsBar', () => ({
  StatsBar: ({ onCommandPaletteOpen }: { onCommandPaletteOpen: () => void }) => (
    <div data-testid="stats-bar" onClick={onCommandPaletteOpen} />
  ),
}))
vi.mock('@/components/shared/CommandPalette', () => ({
  CommandPalette: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="command-palette" data-open={isOpen} />
  ),
}))
vi.mock('@/components/shared/BottomNav', () => ({
  BottomNav: () => <div data-testid="bottom-nav" />,
}))
vi.mock('@/components/onboarding/OnboardingWizard', () => ({
  OnboardingWizard: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="onboarding-wizard" onClick={onComplete} />
  ),
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, Outlet: () => <div data-testid="outlet" /> }
})

vi.mock('@/store/uiStore', () => ({
  useUiStore: vi.fn(),
}))
vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
}))

import { useUiStore } from '@/store/uiStore'
import { useProfile } from '@/hooks/useProfile'

function setupMocks({
  sidebarCollapsed = false,
  profile = null,
}: {
  sidebarCollapsed?: boolean
  profile?: { onboarding_completed?: boolean } | null
} = {}) {
  vi.mocked(useUiStore).mockReturnValue({
    sidebarCollapsed,
    setSidebarCollapsed: vi.fn(),
    sidebarOpen: false,
    setSidebarOpen: vi.fn(),
  } as ReturnType<typeof useUiStore>)

  vi.mocked(useProfile).mockReturnValue({
    data: profile,
    isLoading: false,
    error: null,
  } as ReturnType<typeof useProfile>)
}

function renderLayout() {
  return render(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>
  )
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders cursor-glow div in DOM', () => {
    renderLayout()
    const cursorGlow = document.getElementById('cursor-glow')
    expect(cursorGlow).not.toBeNull()
  })

  it('renders three blob divs for ambient background', () => {
    const { container } = renderLayout()
    expect(container.querySelector('.blob-1')).not.toBeNull()
    expect(container.querySelector('.blob-2')).not.toBeNull()
    expect(container.querySelector('.blob-3')).not.toBeNull()
  })

  it('renders blob divs with blob class', () => {
    const { container } = renderLayout()
    const blobs = container.querySelectorAll('.blob')
    expect(blobs.length).toBe(3)
  })

  it('renders sidebar component', () => {
    renderLayout()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders header component', () => {
    renderLayout()
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('renders stats bar component', () => {
    renderLayout()
    expect(screen.getByTestId('stats-bar')).toBeInTheDocument()
  })

  it('renders outlet for page content', () => {
    renderLayout()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('does not show onboarding when profile is null', () => {
    setupMocks({ profile: null })
    renderLayout()
    expect(screen.queryByTestId('onboarding-wizard')).not.toBeInTheDocument()
  })

  it('shows onboarding when onboarding_completed is false', () => {
    setupMocks({ profile: { onboarding_completed: false } })
    renderLayout()
    expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument()
  })

  it('applies collapsed margin class when sidebarCollapsed is true', () => {
    setupMocks({ sidebarCollapsed: true })
    const { container } = renderLayout()
    const mainArea = container.querySelector('.lg\\:ml-\\[72px\\]')
    expect(mainArea).not.toBeNull()
  })

  it('applies expanded margin class when sidebarCollapsed is false', () => {
    setupMocks({ sidebarCollapsed: false })
    const { container } = renderLayout()
    const mainArea = container.querySelector('.lg\\:ml-64')
    expect(mainArea).not.toBeNull()
  })
})
