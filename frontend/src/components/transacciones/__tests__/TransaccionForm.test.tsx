import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransaccionForm } from '../TransaccionForm'

vi.mock('@/hooks/useCategorias', () => ({
  useCategorias: () => ({ data: [], isLoading: false }),
}))
vi.mock('@/hooks/useTarjetas', () => ({
  useTarjetas: () => ({
    data: [
      {
        id: 't-1',
        banco: 'Visa Popular',
        ultimos_digitos: '4242',
        tipo: 'credito',
        activa: true,
      },
    ],
    isLoading: false,
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return wrapper
}

describe('TransaccionForm', () => {
  it('renders ingreso form with correct fields', () => {
    render(
      <TransaccionForm tipo="ingreso" onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/monto/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fuente/i)).toBeInTheDocument()
  })

  it('renders egreso form with metodo_pago field', () => {
    render(
      <TransaccionForm tipo="egreso" onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByLabelText(/metodo de pago/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/fuente/i)).not.toBeInTheDocument()
  })

  it('shows submit button with correct label for ingreso', () => {
    render(
      <TransaccionForm tipo="ingreso" onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByRole('button', { name: /registrar ingreso/i })).toBeInTheDocument()
  })

  it('shows submit button with correct label for egreso', () => {
    render(
      <TransaccionForm tipo="egreso" onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByRole('button', { name: /registrar egreso/i })).toBeInTheDocument()
  })

  it('shows cancel button', () => {
    render(
      <TransaccionForm tipo="ingreso" onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    const { getByRole } = render(
      <TransaccionForm tipo="ingreso" onSubmit={vi.fn()} onCancel={onCancel} />,
      { wrapper: createWrapper() }
    )
    getByRole('button', { name: /cancelar/i }).click()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('shows loading state on submit button when isLoading is true', () => {
    render(
      <TransaccionForm tipo="ingreso" onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={true} />,
      { wrapper: createWrapper() }
    )
    // Button is disabled and shows spinner SVG when loading
    const submitBtn = screen.getByRole('button', { name: /registrar ingreso/i })
    expect(submitBtn).toBeDisabled()
    expect(submitBtn.querySelector('svg')).toBeInTheDocument()
  })

  it('does NOT show tarjeta select when metodo_pago is efectivo', () => {
    render(
      <TransaccionForm tipo="egreso" onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: createWrapper() }
    )
    // Default is efectivo — tarjeta select should not appear
    expect(screen.queryByLabelText(/tarjeta/i)).not.toBeInTheDocument()
  })

  it('shows tarjeta select when metodo_pago is tarjeta', async () => {
    const { getByLabelText } = render(
      <TransaccionForm tipo="egreso" onSubmit={vi.fn()} onCancel={vi.fn()} defaultValues={{ metodo_pago: 'tarjeta' }} />,
      { wrapper: createWrapper() }
    )
    // When default is tarjeta, the select should appear
    expect(getByLabelText(/tarjeta/i)).toBeInTheDocument()
  })

  it('tarjeta select lists active tarjetas', async () => {
    render(
      <TransaccionForm tipo="egreso" onSubmit={vi.fn()} onCancel={vi.fn()} defaultValues={{ metodo_pago: 'tarjeta' }} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText('Visa Popular •••• 4242 (credito)')).toBeInTheDocument()
  })
})
