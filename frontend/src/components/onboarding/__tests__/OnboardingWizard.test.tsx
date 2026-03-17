import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/useProfile', () => ({
  useUpdateProfile: vi.fn(),
}))

vi.mock('@/hooks/useCategorias', () => ({
  useCategorias: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { useUpdateProfile } from '@/hooks/useProfile'
import { useCategorias } from '@/hooks/useCategorias'

const mockMutateAsync = vi.fn().mockResolvedValue({})

function setupMocks() {
  vi.mocked(useUpdateProfile).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateProfile>)

  vi.mocked(useCategorias).mockReturnValue({
    data: [
      { id: 'cat-1', nombre: 'Salario', tipo: 'ingreso', icono: null, color: null, es_sistema: true },
    ],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useCategorias>)
}

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders step 1 on mount', () => {
    render(<OnboardingWizard onComplete={vi.fn()} />)
    expect(screen.getByText(/bienvenido a finza/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /empezar/i })).toBeInTheDocument()
  })

  it('shows value props on step 1', () => {
    render(<OnboardingWizard onComplete={vi.fn()} />)
    expect(screen.getByText(/registra ingresos y egresos/i)).toBeInTheDocument()
    expect(screen.getByText(/establece metas de ahorro/i)).toBeInTheDocument()
    expect(screen.getByText(/visualiza tu salud financiera/i)).toBeInTheDocument()
  })

  it('advances to step 2 when Empezar is clicked', () => {
    render(<OnboardingWizard onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /empezar/i }))
    expect(screen.getByText(/tu perfil/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/salario mensual neto/i)).toBeInTheDocument()
  })

  it('shows step indicator with 4 steps', () => {
    render(<OnboardingWizard onComplete={vi.fn()} />)
    // Each step is represented by a circle with number or checkmark
    const stepCircles = screen.getAllByText(/^[1-4]$/)
    // Steps 2-4 should show numbers, step 1 is current (no number visible as text in this case)
    expect(stepCircles.length).toBeGreaterThanOrEqual(3)
  })

  it('skip button works on step 2 advancing to step 3', () => {
    render(<OnboardingWizard onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /empezar/i }))
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    expect(screen.getByText(/primera transaccion/i)).toBeInTheDocument()
  })

  it('saves salary and advances on Continuar click', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /empezar/i }))

    const salarioInput = screen.getByLabelText(/salario mensual neto/i)
    fireEvent.change(salarioInput, { target: { value: '50000' } })

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        salario_mensual_neto: 50000,
      })
    })
  })

  it('skip button on step 3 advances to step 4', () => {
    render(<OnboardingWizard onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /empezar/i }))
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    expect(screen.getByText(/todo configurado/i)).toBeInTheDocument()
  })

  it('shows step 4 completion screen with Ir al dashboard button', () => {
    render(<OnboardingWizard onComplete={vi.fn()} />)
    // Navigate to step 4
    fireEvent.click(screen.getByRole('button', { name: /empezar/i }))
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    expect(screen.getByRole('button', { name: /ir al dashboard/i })).toBeInTheDocument()
  })

  it('calls onComplete and marks onboarding done when Ir al dashboard is clicked', async () => {
    const onComplete = vi.fn()
    render(<OnboardingWizard onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: /empezar/i }))
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))

    fireEvent.click(screen.getByRole('button', { name: /ir al dashboard/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ onboarding_completed: true })
      expect(onComplete).toHaveBeenCalled()
    })
  })

  it('renders as dialog with aria-modal', () => {
    render(<OnboardingWizard onComplete={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('shows progress bar', () => {
    render(<OnboardingWizard onComplete={vi.fn()} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
  })
})
