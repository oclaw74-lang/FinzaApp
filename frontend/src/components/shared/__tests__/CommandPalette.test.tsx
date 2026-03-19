import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandPalette } from '@/components/shared/CommandPalette'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

describe('CommandPalette', () => {
  const onClose = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<CommandPalette isOpen={false} onClose={onClose} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders command list when isOpen is true', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Ir a Dashboard')).toBeInTheDocument()
  })

  it('renders all default commands', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    expect(screen.getByText('Ir a Ingresos')).toBeInTheDocument()
    expect(screen.getByText('Ir a Egresos')).toBeInTheDocument()
    expect(screen.getByText('Ir a Presupuestos')).toBeInTheDocument()
    expect(screen.getByText('Ir a Tarjetas')).toBeInTheDocument()
  })

  it('filters commands based on search input', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    const input = screen.getByRole('textbox', { name: /buscar comando/i })
    fireEvent.change(input, { target: { value: 'ingresos' } })
    expect(screen.getByText('Ir a Ingresos')).toBeInTheDocument()
    expect(screen.queryByText('Ir a Egresos')).not.toBeInTheDocument()
  })

  it('shows no-results message when query has no matches', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    const input = screen.getByRole('textbox', { name: /buscar comando/i })
    fireEvent.change(input, { target: { value: 'xyznotfound' } })
    expect(screen.getByText(/Sin resultados/)).toBeInTheDocument()
  })

  it('calls onClose when ESC key is pressed in the search input', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    // keyDown handler is on the inner modal div — events bubble from the input
    const input = screen.getByRole('textbox', { name: /buscar comando/i })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    // The backdrop is the fixed overlay div (role=dialog wraps the visible modal)
    const backdrop = document.querySelector('[role="dialog"]')!
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('navigates and closes when a command is clicked', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('Ir a Metas'))
    expect(mockNavigate).toHaveBeenCalledWith('/metas')
    expect(onClose).toHaveBeenCalled()
  })

  it('keyboard ArrowDown moves active index down', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    const dialog = screen.getByRole('dialog').querySelector('div')!
    fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    // Second item (Ir a Ingresos) should now be aria-selected
    const options = screen.getAllByRole('option')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('keyboard ArrowUp does not go below index 0', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    const dialog = screen.getByRole('dialog').querySelector('div')!
    fireEvent.keyDown(dialog, { key: 'ArrowUp' })
    const options = screen.getAllByRole('option')
    // First item remains selected
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('Enter executes the currently highlighted command', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    const dialog = screen.getByRole('dialog').querySelector('div')!
    // Default first item is Dashboard
    fireEvent.keyDown(dialog, { key: 'Enter' })
    expect(mockNavigate).toHaveBeenCalledWith('/')
    expect(onClose).toHaveBeenCalled()
  })

  it('renders keyboard hint footer', () => {
    render(<CommandPalette isOpen={true} onClose={onClose} />)
    expect(screen.getByText('navegar')).toBeInTheDocument()
    expect(screen.getByText('seleccionar')).toBeInTheDocument()
    expect(screen.getByText('cerrar')).toBeInTheDocument()
  })
})
