import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { ForgotPasswordPage } from '../ForgotPasswordPage'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  },
}))

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import { supabase } from '@/lib/supabase'

function renderPage() {
  return render(
    <BrowserRouter>
      <ForgotPasswordPage />
    </BrowserRouter>
  )
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form in initial state', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /auth\.sendResetLink/i })).toBeInTheDocument()
  })

  it('renders email input', () => {
    renderPage()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders back to login link', () => {
    renderPage()
    expect(screen.getByText('auth.backToLogin')).toBeInTheDocument()
  })

  it('shows validation error for empty email submit', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /auth\.sendResetLink/i }))
    await waitFor(() => {
      expect(screen.getByText(/email invalido/i)).toBeInTheDocument()
    })
  })

  it('calls resetPasswordForEmail with correct email', async () => {
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ data: {}, error: null } as never)
    renderPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /auth\.sendResetLink/i }))
    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') })
      )
    })
  })

  it('shows success state after successful submission', async () => {
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ data: {}, error: null } as never)
    renderPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /auth\.sendResetLink/i }))
    await waitFor(() => {
      expect(screen.getByText('auth.checkEmail')).toBeInTheDocument()
    })
  })

  it('shows server error when resetPasswordForEmail fails', async () => {
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: {},
      error: { message: 'Rate limit exceeded' },
    } as never)
    renderPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /auth\.sendResetLink/i }))
    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument()
    })
  })
})
