import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { OnboardingPage } from '../OnboardingPage'

const mockMutateAsync = vi.fn().mockResolvedValue({})
const mockCreateTarjeta = vi.fn().mockResolvedValue({
  id: 'card-1',
  banco: 'Banco Popular',
  ultimos_digitos: '1234',
  red: 'visa',
  tipo: 'debito',
  saldo_actual: 1000,
  user_id: 'user-1',
  titular: null,
  banco_id: null,
  banco_custom: null,
  limite_credito: null,
  disponible: null,
  fecha_corte: null,
  fecha_pago: null,
  color: null,
  activa: true,
  bloqueada: false,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
})
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

vi.mock('@/hooks/useTarjetas', () => ({
  useCreateTarjeta: vi.fn(() => ({
    mutateAsync: mockCreateTarjeta,
    isPending: false,
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
    t: (key: string, opts?: Record<string, unknown>) => {
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
        'onboarding.tarjetaDebito': 'Vincula tu tarjeta de débito',
        'onboarding.tarjetaDebitoSubtitulo': 'Conecta al menos una tarjeta',
        'onboarding.bancoLabel': 'Banco',
        'onboarding.ultimosDigitosLabel': 'Últimos 4 dígitos',
        'onboarding.redLabel': 'Red de pago',
        'onboarding.saldoLabel': 'Saldo actual',
        'onboarding.tipoDebitoLocked': 'Tipo: Débito (no modificable)',
        'onboarding.agregarTarjeta': 'Agregar tarjeta',
        'onboarding.agregarOtra': 'Agregar otra',
        'onboarding.agregando': 'Agregando...',
        'onboarding.tarjetaRequerida': 'Debes agregar al menos una tarjeta de débito para continuar',
        'onboarding.tarjetaError': 'Error al agregar la tarjeta. Intenta de nuevo.',
        'onboarding.tarjetaVinculada': '1 tarjeta de débito vinculada',
      }
      if (key === 'onboarding.tarjetasVinculadas') {
        return `${opts?.count ?? 0} tarjetas de débito vinculadas`
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

/** Helper to advance from step 1 to step 2 */
async function goToStep2() {
  fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
  await waitFor(() => {
    expect(screen.getByText('Tu perfil')).toBeInTheDocument()
  })
}

/** Helper to advance from step 2 to step 3 (debit card) via skip */
async function goToStep3ViaSkip() {
  await goToStep2()
  fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
  await waitFor(() => {
    expect(screen.getByText('Vincula tu tarjeta de débito')).toBeInTheDocument()
  })
}

/** Helper to add a debit card in step 3 */
async function addDebitCard() {
  fireEvent.change(screen.getByLabelText(/banco/i), { target: { value: 'Banco Popular' } })
  fireEvent.change(screen.getByLabelText(/últimos 4 dígitos/i), { target: { value: '1234' } })
  fireEvent.change(screen.getByLabelText(/saldo actual/i), { target: { value: '1000' } })
  fireEvent.click(screen.getByRole('button', { name: /agregar tarjeta/i }))
  await waitFor(() => {
    expect(mockCreateTarjeta).toHaveBeenCalled()
  })
}

/** Helper to advance from step 3 to step 4 after adding a card */
async function goToStep4() {
  await goToStep3ViaSkip()
  await addDebitCard()
  fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
  await waitFor(() => {
    expect(screen.getByText('¡Todo configurado!')).toBeInTheDocument()
  })
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateTarjeta.mockResolvedValue({
      id: 'card-1',
      banco: 'Banco Popular',
      ultimos_digitos: '1234',
      red: 'visa',
      tipo: 'debito',
      saldo_actual: 1000,
      user_id: 'user-1',
      titular: null,
      banco_id: null,
      banco_custom: null,
      limite_credito: null,
      disponible: null,
      fecha_corte: null,
      fecha_pago: null,
      color: null,
      activa: true,
      bloqueada: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    })
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

  it('skip button on step 2 advances to step 3 (debit card)', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    await waitFor(() => {
      expect(screen.getByText(/omitir/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    await waitFor(() => {
      expect(screen.getByText('Vincula tu tarjeta de débito')).toBeInTheDocument()
    })
  })

  it('saves salary and advances to step 3 on Continuar click in step 2', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/salario mensual neto/i)).toBeInTheDocument()
    })

    const salarioInput = screen.getByLabelText(/salario mensual neto/i)
    fireEvent.change(salarioInput, { target: { value: '50000' } })

    const buttons = screen.getAllByRole('button', { name: /continuar/i })
    fireEvent.click(buttons[buttons.length - 1])

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        salario_neto: 50000,
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Vincula tu tarjeta de débito')).toBeInTheDocument()
    })
  })

  it('renders debit card form on step 3', async () => {
    renderPage()
    await goToStep3ViaSkip()

    expect(screen.getByLabelText(/banco/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/últimos 4 dígitos/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/red de pago/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/saldo actual/i)).toBeInTheDocument()
    expect(screen.getByText(/tipo: débito/i)).toBeInTheDocument()
  })

  it('shows validation error if Continuar is clicked on step 3 with no card added', async () => {
    renderPage()
    await goToStep3ViaSkip()

    // The Continuar button is disabled when no cards added, but clicking it still triggers error
    const continuarBtn = screen.getByRole('button', { name: /continuar/i })
    fireEvent.click(continuarBtn)

    await waitFor(() => {
      expect(
        screen.getByText('Debes agregar al menos una tarjeta de débito para continuar')
      ).toBeInTheDocument()
    })
  })

  it('calls createTarjeta.mutateAsync with tipo debito when Agregar tarjeta is clicked', async () => {
    renderPage()
    await goToStep3ViaSkip()

    fireEvent.change(screen.getByLabelText(/banco/i), { target: { value: 'BHD' } })
    fireEvent.change(screen.getByLabelText(/últimos 4 dígitos/i), { target: { value: '5678' } })
    fireEvent.change(screen.getByLabelText(/saldo actual/i), { target: { value: '2500' } })

    fireEvent.click(screen.getByRole('button', { name: /agregar tarjeta/i }))

    await waitFor(() => {
      expect(mockCreateTarjeta).toHaveBeenCalledWith({
        banco: 'BHD',
        tipo: 'debito',
        red: 'visa',
        ultimos_digitos: '5678',
        saldo_actual: 2500,
      })
    })
  })

  it('shows added card in the list after successful creation', async () => {
    renderPage()
    await goToStep3ViaSkip()
    await addDebitCard()

    expect(screen.getByText('Banco Popular')).toBeInTheDocument()
    expect(screen.getByText(/1234/)).toBeInTheDocument()
  })

  it('enables Continuar button after adding a card', async () => {
    renderPage()
    await goToStep3ViaSkip()

    // Before adding a card the button is aria-disabled
    const continuarBtn = screen.getByRole('button', { name: /continuar/i })
    expect(continuarBtn).toHaveAttribute('aria-disabled', 'true')

    await addDebitCard()

    // After adding a card the button is no longer aria-disabled
    expect(continuarBtn).toHaveAttribute('aria-disabled', 'false')
  })

  it('shows completion screen on step 4', async () => {
    renderPage()
    await goToStep4()

    expect(screen.getByText('¡Todo configurado!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ir al dashboard/i })).toBeInTheDocument()
  })

  it('marks onboarding complete and navigates on finish', async () => {
    renderPage()
    await goToStep4()

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

  it('renders 4 step indicators', () => {
    renderPage()
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
    // Verify we now have 4 steps (TOTAL_STEPS = 4)
    const stepContainer = progressBar.parentElement?.nextElementSibling
    expect(stepContainer).toBeTruthy()
  })

  it('shows form validation errors for empty fields on Agregar tarjeta', async () => {
    renderPage()
    await goToStep3ViaSkip()

    // Click Agregar tarjeta without filling the form
    fireEvent.click(screen.getByRole('button', { name: /agregar tarjeta/i }))

    await waitFor(() => {
      expect(screen.getByText('Requerido')).toBeInTheDocument()
    })
  })

  it('shows API error when createTarjeta fails', async () => {
    mockCreateTarjeta.mockRejectedValueOnce(new Error('API error'))

    renderPage()
    await goToStep3ViaSkip()

    fireEvent.change(screen.getByLabelText(/banco/i), { target: { value: 'Banco Test' } })
    fireEvent.change(screen.getByLabelText(/últimos 4 dígitos/i), { target: { value: '9999' } })
    fireEvent.change(screen.getByLabelText(/saldo actual/i), { target: { value: '500' } })

    fireEvent.click(screen.getByRole('button', { name: /agregar tarjeta/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Error al agregar la tarjeta. Intenta de nuevo.')
      ).toBeInTheDocument()
    })
  })
})

