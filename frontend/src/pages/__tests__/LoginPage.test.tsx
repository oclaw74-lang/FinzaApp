import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from '../LoginPage'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock auth store
const mockSetSession = vi.fn()
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}))
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

function setupAuthStore({
  session = null,
  isLoading = false,
}: { session?: unknown; isLoading?: boolean } = {}) {
  vi.mocked(useAuthStore).mockReturnValue({
    session,
    isLoading,
    setSession: mockSetSession,
  } as ReturnType<typeof useAuthStore>)
}

function renderPage() {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuthStore()
  })

  it('renders correctly in default (unauthenticated) state', () => {
    renderPage()
    // Title is hardcoded (not a t() key)
    expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    renderPage()
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders login submit button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /auth\.login/i })).toBeInTheDocument()
  })

  it('renders brand panel with Finza name on desktop', () => {
    renderPage()
    // Brand panel is hidden on mobile via CSS but present in DOM
    const finzaTexts = screen.getAllByText('Finza')
    expect(finzaTexts.length).toBeGreaterThan(0)
  })

  it('shows password when toggle button is clicked', () => {
    renderPage()
    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getByLabelText('Mostrar contrasena')
    fireEvent.click(toggleBtn)

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Ocultar contrasena')).toBeInTheDocument()
  })

  it('shows validation error for invalid email', async () => {
    renderPage()
    const submitBtn = screen.getByRole('button', { name: /auth\.login/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/email invalido/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /auth\.login/i }))

    await waitFor(() => {
      expect(screen.getByText(/contrasena/i)).toBeInTheDocument()
    })
  })

  it('calls signInWithPassword with correct credentials on submit', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as never)

    renderPage()
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /auth\.login/i }))

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      })
    })
  })

  it('shows server error when login fails', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid credentials' },
    } as never)

    renderPage()
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /auth\.login/i }))

    await waitFor(() => {
      expect(screen.getByText('auth.invalidCredentials')).toBeInTheDocument()
    })
  })

  it('renders register link', () => {
    renderPage()
    expect(screen.getByText('auth.register')).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    renderPage()
    expect(screen.getByText('auth.forgotPassword')).toBeInTheDocument()
  })
})
