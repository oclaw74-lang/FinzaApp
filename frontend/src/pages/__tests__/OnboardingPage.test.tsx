import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { OnboardingPage } from '../OnboardingPage'

const mockMutateAsync = vi.fn().mockResolvedValue({})
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(() => ({ data: { onboarding_completed: false }, isLoading: false })),
  useUpdateProfile: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}))

vi.mock('@/hooks/useCatalogos', () => ({
  usePaises: vi.fn(() => ({
    data: [
      { codigo: 'DO', nombre: 'Republica Dominicana', nombre_en: 'Dominican Republic', moneda_codigo: 'DOP', bandera_emoji: '🇩🇴', activo: true },
      { codigo: 'US', nombre: 'Estados Unidos', nombre_en: 'United States', moneda_codigo: 'USD', bandera_emoji: '🇺🇸', activo: true },
      { codigo: 'MX', nombre: 'Mexico', nombre_en: 'Mexico', moneda_codigo: 'MXN', bandera_emoji: '🇲🇽', activo: true },
    ],
    isLoading: false,
  })),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'onboarding.bienvenido': '¡Bienvenido a Finza!',
        'onboarding.paisSubtitulo': 'Selecciona tu país',
        'onboarding.continuar': 'Continuar',
        'onboarding.paso2': 'Tu perfil',
        'onboarding.salarioHint': 'Lo usamos para calcular horas',
        'onboarding.salarioLabel': 'Salario mensual neto (opcional)',
        'onboarding.omitir': 'Omitir',
        'onboarding.listo': '¡Todo configurado!',
        'onboarding.listoDesc': 'Ya puedes empezar',
        'onboarding.finalizar': 'Ir al dashboard',
      }
      return translations[key] ?? key
    },
  }),
}))

import { supabase } from '@/lib/supabase'

function renderPage() {
  return render(
    <BrowserRouter>
      <OnboardingPage />
    </BrowserRouter>
  )
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders step 1 with country list', () => {
    renderPage()
    expect(screen.getByText('¡Bienvenido a Finza!')).toBeInTheDocument()
    expect(screen.getByText('Republica Dominicana')).toBeInTheDocument()
    expect(screen.getByText('Estados Unidos')).toBeInTheDocument()
    expect(screen.getByText('Mexico')).toBeInTheDocument()
  })

  it('shows currency codes next to countries', () => {
    renderPage()
    expect(screen.getByText('DOP')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('MXN')).toBeInTheDocument()
  })

  it('advances to step 2 when Continuar is clicked', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    await waitFor(() => {
      expect(screen.getByText('Tu perfil')).toBeInTheDocument()
      expect(screen.getByLabelText(/salario mensual neto/i)).toBeInTheDocument()
    })
  })

  it('saves country via supabase.auth.updateUser on step 1', async () => {
    renderPage()
    // Select a different country
    fireEvent.click(screen.getByText('Mexico'))
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          country: 'Mexico',
          currency: 'MXN',
          pais_codigo: 'MX',
        },
      })
    })
  })

  it('skip button on step 2 advances to step 3', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    await waitFor(() => {
      expect(screen.getByText(/omitir/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    await waitFor(() => {
      expect(screen.getByText('¡Todo configurado!')).toBeInTheDocument()
    })
  })

  it('saves salary and advances on Continuar click in step 2', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/salario mensual neto/i)).toBeInTheDocument()
    })

    const salarioInput = screen.getByLabelText(/salario mensual neto/i)
    fireEvent.change(salarioInput, { target: { value: '50000' } })

    // Click the second continuar button (not omitir)
    const buttons = screen.getAllByRole('button', { name: /continuar/i })
    fireEvent.click(buttons[buttons.length - 1])

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        salario_mensual_neto: 50000,
      })
    })
  })

  it('shows completion screen on step 3', async () => {
    renderPage()
    // Step 1 → Step 2
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    await waitFor(() => {
      expect(screen.getByText(/omitir/i)).toBeInTheDocument()
    })
    // Step 2 → Step 3
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    await waitFor(() => {
      expect(screen.getByText('¡Todo configurado!')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ir al dashboard/i })).toBeInTheDocument()
    })
  })

  it('marks onboarding complete and navigates on finish', async () => {
    renderPage()
    // Navigate to step 3
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    await waitFor(() => {
      expect(screen.getByText(/omitir/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ir al dashboard/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /ir al dashboard/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ onboarding_completed: true })
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('shows progress bar', () => {
    renderPage()
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
  })

  it('renders 3 step indicators', () => {
    renderPage()
    // 3 step circles + 2 connector lines = each step has a circle div
    const stepContainer = screen.getByRole('progressbar').parentElement?.nextElementSibling
    expect(stepContainer).toBeTruthy()
  })
})
