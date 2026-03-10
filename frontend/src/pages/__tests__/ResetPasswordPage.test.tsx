import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'

// Mock supabase before importing the page
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      updateUser: vi.fn(),
    },
  },
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock react-router navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import { ResetPasswordPage } from '../ResetPasswordPage'
import { supabase } from '@/lib/supabase'

function renderPage() {
  return render(
    <BrowserRouter>
      <ResetPasswordPage />
    </BrowserRouter>
  )
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as never)
  })

  it('renders the page without crashing', () => {
    renderPage()
    expect(screen.getByText('auth.resetTitle')).toBeInTheDocument()
  })

  it('shows loading message before PASSWORD_RECOVERY event', () => {
    renderPage()
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('shows subtitle text', () => {
    renderPage()
    expect(screen.getByText('auth.resetSubtitle')).toBeInTheDocument()
  })

  it('renders the Finza logo', () => {
    renderPage()
    expect(screen.getByText('Finza')).toBeInTheDocument()
  })

  it('calls onAuthStateChange on mount', () => {
    renderPage()
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
  })
})
