import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { RegisterPage } from '../RegisterPage'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}))

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock useCatalogos
vi.mock('@/hooks/useCatalogos', () => ({
  usePaises: vi.fn(),
  useMonedas: vi.fn(() => ({ data: [], isLoading: false })),
  useBancos: vi.fn(() => ({ data: [], isLoading: false })),
}))

import { supabase } from '@/lib/supabase'
import { usePaises } from '@/hooks/useCatalogos'

const mockPaises = [
  {
    codigo: 'DO',
    nombre: 'Republica Dominicana',
    nombre_en: 'Dominican Republic',
    moneda_codigo: 'DOP',
    bandera_emoji: '🇩🇴',
    activo: true,
  },
  {
    codigo: 'US',
    nombre: 'Estados Unidos',
    nombre_en: 'United States',
    moneda_codigo: 'USD',
    bandera_emoji: '🇺🇸',
    activo: true,
  },
]

function renderPage() {
  return render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders correctly with default props', () => {
    vi.mocked(usePaises).mockReturnValue({ data: mockPaises, isLoading: false, isError: false } as ReturnType<typeof usePaises>)
    renderPage()
    expect(screen.getByText('auth.registerTitle')).toBeInTheDocument()
  })

  it('shows pais selector when catalog is loaded', () => {
    vi.mocked(usePaises).mockReturnValue({ data: mockPaises, isLoading: false, isError: false } as ReturnType<typeof usePaises>)
    renderPage()
    expect(screen.getByText('auth.country')).toBeInTheDocument()
    // Should show the pais dropdown with catalog data
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows fallback currency select when catalog fails to load', () => {
    vi.mocked(usePaises).mockReturnValue({ data: [], isLoading: false, isError: true } as ReturnType<typeof usePaises>)
    renderPage()
    // Fallback shows hardcoded currency options
    const select = screen.getByLabelText ? screen.queryByLabelText('auth.currency') : null
    // Should render the fallback select (not the readonly input)
    expect(screen.getByText('Peso Dominicano (RD$)')).toBeInTheDocument()
  })

  it('shows loading state — renders without crash when catalog is loading', () => {
    vi.mocked(usePaises).mockReturnValue({ data: [], isLoading: true, isError: false } as ReturnType<typeof usePaises>)
    renderPage()
    // Should not crash — fallback renders since catalogsAvailable=false while loading
    expect(screen.getByText('auth.registerTitle')).toBeInTheDocument()
  })

  it('auto-fills currency when a pais is selected', () => {
    vi.mocked(usePaises).mockReturnValue({ data: mockPaises, isLoading: false, isError: false } as ReturnType<typeof usePaises>)
    renderPage()

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'US' } })

    // The readonly currency input should show USD
    const currencyInput = screen.getByDisplayValue('USD')
    expect(currencyInput).toBeInTheDocument()
    expect(currencyInput).toHaveAttribute('readonly')
  })

  it('defaults to DO (Republica Dominicana) with DOP', () => {
    vi.mocked(usePaises).mockReturnValue({ data: mockPaises, isLoading: false, isError: false } as ReturnType<typeof usePaises>)
    renderPage()

    // Default currency should be DOP
    expect(screen.getByDisplayValue('DOP')).toBeInTheDocument()
  })

  it('shows validation errors when form is submitted empty', async () => {
    vi.mocked(usePaises).mockReturnValue({ data: mockPaises, isLoading: false, isError: false } as ReturnType<typeof usePaises>)
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'auth.register' }))

    await waitFor(() => {
      expect(screen.getByText('Nombre requerido')).toBeInTheDocument()
    })
  })

  it('shows password mismatch error', async () => {
    vi.mocked(usePaises).mockReturnValue({ data: mockPaises, isLoading: false, isError: false } as ReturnType<typeof usePaises>)
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('Juan'), { target: { value: 'Juan' } })
    fireEvent.change(screen.getByPlaceholderText('Perez'), { target: { value: 'Perez' } })
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Minimo 8 caracteres'), { target: { value: 'password1' } })
    fireEvent.change(screen.getByPlaceholderText('Repite tu contrasena'), { target: { value: 'password2' } })

    fireEvent.click(screen.getByRole('button', { name: 'auth.register' }))

    await waitFor(() => {
      expect(screen.getByText('Las contrasenas no coinciden')).toBeInTheDocument()
    })
  })

  it('calls supabase.auth.signUp with correct payload', async () => {
    vi.mocked(usePaises).mockReturnValue({ data: mockPaises, isLoading: false, isError: false } as ReturnType<typeof usePaises>)
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({ data: {}, error: null } as ReturnType<typeof supabase.auth.signUp> extends Promise<infer T> ? Promise<T> : never)
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('Juan'), { target: { value: 'Juan' } })
    fireEvent.change(screen.getByPlaceholderText('Perez'), { target: { value: 'Perez' } })
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Minimo 8 caracteres'), { target: { value: 'password1' } })
    fireEvent.change(screen.getByPlaceholderText('Repite tu contrasena'), { target: { value: 'password1' } })

    fireEvent.click(screen.getByRole('button', { name: 'auth.register' }))

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@test.com',
          password: 'password1',
        })
      )
    })
  })

  it('shows success screen after successful registration', async () => {
    vi.mocked(usePaises).mockReturnValue({ data: mockPaises, isLoading: false, isError: false } as ReturnType<typeof usePaises>)
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({ data: {}, error: null } as ReturnType<typeof supabase.auth.signUp> extends Promise<infer T> ? Promise<T> : never)
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('Juan'), { target: { value: 'Juan' } })
    fireEvent.change(screen.getByPlaceholderText('Perez'), { target: { value: 'Perez' } })
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Minimo 8 caracteres'), { target: { value: 'password1' } })
    fireEvent.change(screen.getByPlaceholderText('Repite tu contrasena'), { target: { value: 'password1' } })

    fireEvent.click(screen.getByRole('button', { name: 'auth.register' }))

    await waitFor(() => {
      expect(screen.getByText('auth.checkEmail')).toBeInTheDocument()
    })
  })

  it('shows server error on registration failure', async () => {
    vi.mocked(usePaises).mockReturnValue({ data: mockPaises, isLoading: false, isError: false } as ReturnType<typeof usePaises>)
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: {},
      error: { message: 'User already registered' },
    } as ReturnType<typeof supabase.auth.signUp> extends Promise<infer T> ? Promise<T> : never)
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('Juan'), { target: { value: 'Juan' } })
    fireEvent.change(screen.getByPlaceholderText('Perez'), { target: { value: 'Perez' } })
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Minimo 8 caracteres'), { target: { value: 'password1' } })
    fireEvent.change(screen.getByPlaceholderText('Repite tu contrasena'), { target: { value: 'password1' } })

    fireEvent.click(screen.getByRole('button', { name: 'auth.register' }))

    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeInTheDocument()
    })
  })

  it('toggle password visibility works', () => {
    vi.mocked(usePaises).mockReturnValue({ data: mockPaises, isLoading: false, isError: false } as ReturnType<typeof usePaises>)
    renderPage()

    const passwordInput = screen.getByPlaceholderText('Minimo 8 caracteres')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // There are two "Mostrar contrasena" buttons (password + confirm) — click the first
    const toggleBtns = screen.getAllByLabelText('Mostrar contrasena')
    fireEvent.click(toggleBtns[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
