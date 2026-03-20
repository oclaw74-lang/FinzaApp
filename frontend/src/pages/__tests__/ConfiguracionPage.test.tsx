import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { ConfiguracionPage } from '../ConfiguracionPage'

// Mock useProfile to prevent QueryClient error
vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(() => ({ data: undefined, isLoading: false })),
  useUpdateProfile: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

// Mock useMetas and useFondoEmergencia (used in savings distribution section)
vi.mock('@/hooks/useMetas', () => ({
  useMetas: vi.fn(() => ({ data: [], isLoading: false })),
}))
vi.mock('@/hooks/useFondoEmergencia', () => ({
  useFondoEmergencia: vi.fn(() => ({ data: null, isLoading: false })),
}))

// Mock useCatalogos
vi.mock('@/hooks/useCatalogos', () => ({
  usePaises: vi.fn(() => ({
    data: [
      { codigo: 'DO', nombre: 'Republica Dominicana', nombre_en: 'Dominican Republic', moneda_codigo: 'DOP', bandera_emoji: '🇩🇴', activo: true },
      { codigo: 'US', nombre: 'Estados Unidos', nombre_en: 'United States', moneda_codigo: 'USD', bandera_emoji: '🇺🇸', activo: true },
    ],
    isLoading: false,
    isError: false,
  })),
  useMonedas: vi.fn(() => ({ data: [], isLoading: false })),
  useBancos: vi.fn(() => ({ data: [], isLoading: false })),
}))

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
    },
  },
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/i18n', () => ({
  default: {
    changeLanguage: vi.fn(),
  },
}))

// Mock auth store with a user
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: {
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Juan Perez',
        currency: 'DOP',
        country: 'RD',
        phone: '',
      },
    },
  }),
}))

// Mock theme store
const mockSetTheme = vi.fn()
const mockSetLanguage = vi.fn()
vi.mock('@/store/themeStore', () => ({
  useThemeStore: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
    language: 'es',
    setLanguage: mockSetLanguage,
  }),
}))

function renderPage() {
  return render(
    <BrowserRouter>
      <ConfiguracionPage />
    </BrowserRouter>
  )
}

describe('ConfiguracionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the settings title', () => {
    renderPage()
    expect(screen.getByText('settings.title')).toBeInTheDocument()
  })

  it('renders all four tab buttons', () => {
    renderPage()
    expect(screen.getByText('settings.profile')).toBeInTheDocument()
    expect(screen.getByText('settings.appearance')).toBeInTheDocument()
    expect(screen.getByText('settings.security')).toBeInTheDocument()
    expect(screen.getByText('settings.categorias')).toBeInTheDocument()
  })

  it('shows profile tab content by default', () => {
    renderPage()
    expect(screen.getByText('settings.fullName')).toBeInTheDocument()
  })

  it('shows full name pre-filled from user_metadata', () => {
    renderPage()
    const input = screen.getByDisplayValue('Juan Perez')
    expect(input).toBeInTheDocument()
  })

  it('shows email pre-filled and disabled', () => {
    renderPage()
    const emailInput = screen.getByDisplayValue('test@example.com')
    expect(emailInput).toBeDisabled()
  })

  it('switches to appearance tab on click', () => {
    renderPage()
    fireEvent.click(screen.getByText('settings.appearance'))
    expect(screen.getByText('settings.darkModeDesc')).toBeInTheDocument()
  })

  it('appearance tab shows light and dark mode cards', () => {
    renderPage()
    fireEvent.click(screen.getByText('settings.appearance'))
    expect(screen.getByText('settings.lightMode')).toBeInTheDocument()
    expect(screen.getByText('settings.darkMode')).toBeInTheDocument()
  })

  it('clicking dark mode toggle calls setTheme with dark', () => {
    renderPage()
    fireEvent.click(screen.getByText('settings.appearance'))
    fireEvent.click(screen.getByLabelText('Toggle modo oscuro'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('switches to language section in appearance tab', () => {
    renderPage()
    fireEvent.click(screen.getByText('settings.appearance'))
    expect(screen.getByText('settings.changeLanguage')).toBeInTheDocument()
  })

  it('appearance tab shows Espanol and English options', () => {
    renderPage()
    fireEvent.click(screen.getByText('settings.appearance'))
    expect(screen.getByText('Espanol')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it('switches to security tab on click', () => {
    renderPage()
    fireEvent.click(screen.getByText('settings.security'))
    // The tab content should show both the label paragraph and the button
    const matches = screen.getAllByText('settings.changePassword')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('security tab shows change password button', () => {
    renderPage()
    fireEvent.click(screen.getByText('settings.security'))
    // Button has variant secondary, find by its accessible role
    const buttons = screen.getAllByRole('button')
    const changeBtn = buttons.find((b) => b.textContent === 'settings.changePassword')
    expect(changeBtn).toBeDefined()
  })

  it('opens password modal when change password button is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByText('settings.security'))
    // Click the button (not the tab — find the button element)
    const changePasswordBtn = screen.getByRole('button', { name: 'settings.changePassword' })
    fireEvent.click(changePasswordBtn)
    // Modal should appear — there's now a heading and a form
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument()
  })

  it('closes password modal on cancel', () => {
    renderPage()
    fireEvent.click(screen.getByText('settings.security'))
    fireEvent.click(screen.getByRole('button', { name: 'settings.changePassword' }))
    // Cancel button inside modal
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    // Modal should close — cancel button no longer present
    expect(screen.queryByRole('button', { name: 'common.cancel' })).not.toBeInTheDocument()
  })

  // ─── Pais/Moneda section tests ───────────────────────────────────────────────

  it('profile tab shows pais y moneda section', () => {
    renderPage()
    expect(screen.getByText('settings.paisYMoneda')).toBeInTheDocument()
  })

  it('profile tab shows current country from metadata', () => {
    renderPage()
    expect(screen.getByText('RD')).toBeInTheDocument()
  })

  it('profile tab shows current currency from metadata', () => {
    renderPage()
    expect(screen.getByText(/settings\.moneda.*DOP/)).toBeInTheDocument()
  })

  it('profile tab shows "Cambiar" button for pais', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'settings.cambiar' })).toBeInTheDocument()
  })

  it('opens pais modal when "Cambiar" button is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'settings.cambiar' }))
    expect(screen.getByText('settings.cambiarPais')).toBeInTheDocument()
  })

  it('pais modal shows list of countries', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'settings.cambiar' }))
    expect(screen.getByText('Republica Dominicana')).toBeInTheDocument()
    expect(screen.getByText('Estados Unidos')).toBeInTheDocument()
  })

  it('pais modal closes on cancel', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'settings.cambiar' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(screen.queryByText('settings.cambiarPais')).not.toBeInTheDocument()
  })

  it('pais modal closes via X button', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'settings.cambiar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByText('settings.cambiarPais')).not.toBeInTheDocument()
  })
})
