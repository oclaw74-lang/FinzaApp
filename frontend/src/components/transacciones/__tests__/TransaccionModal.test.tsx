import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TransaccionModal } from '../TransaccionModal'

// Mock TransaccionForm to isolate modal behavior
vi.mock('../TransaccionForm', () => ({
  TransaccionForm: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="transaccion-form">
      <button type="button" onClick={onCancel}>Cancelar</button>
    </div>
  ),
}))

describe('TransaccionModal', () => {
  const onClose = vi.fn()
  const onSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with default props when open', () => {
    render(
      <TransaccionModal
        tipo="ingreso"
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
    expect(screen.getByText('Nuevo ingreso')).toBeInTheDocument()
  })

  it('renders nothing when isOpen is false', () => {
    render(
      <TransaccionModal
        tipo="ingreso"
        isOpen={false}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows egreso title when tipo is egreso', () => {
    render(
      <TransaccionModal
        tipo="egreso"
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
    expect(screen.getByText('Nuevo egreso')).toBeInTheDocument()
  })

  it('uses custom title when provided', () => {
    render(
      <TransaccionModal
        tipo="ingreso"
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        title="Editar ingreso"
      />
    )
    expect(screen.getByText('Editar ingreso')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    render(
      <TransaccionModal
        tipo="ingreso"
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
    const backdrop = screen.getByRole('dialog').querySelector('[aria-hidden="true"]') as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders dialog into document.body via portal', () => {
    render(
      <TransaccionModal
        tipo="ingreso"
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
    // createPortal renders the dialog as a direct child of document.body
    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(document.body.contains(dialog)).toBe(true)
  })

  it('renders TransaccionForm inside modal', () => {
    render(
      <TransaccionModal
        tipo="ingreso"
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
    expect(screen.getByTestId('transaccion-form')).toBeInTheDocument()
  })

  it('has correct dialog role and aria-modal', () => {
    render(
      <TransaccionModal
        tipo="ingreso"
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })
})
