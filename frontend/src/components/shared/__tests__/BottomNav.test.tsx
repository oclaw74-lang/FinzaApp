import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BottomNav } from '@/components/shared/BottomNav'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  NavLink: ({ to, children, className, 'aria-label': ariaLabel }: {
    to: string
    children: (args: { isActive: boolean }) => React.ReactNode
    className: (args: { isActive: boolean }) => string
    'aria-label': string
  }) => (
    <a
      href={to}
      aria-label={ariaLabel}
      className={className({ isActive: false })}
      onClick={(e) => { e.preventDefault(); mockNavigate(to) }}
    >
      {typeof children === 'function' ? children({ isActive: false }) : children}
    </a>
  ),
}))

describe('BottomNav', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders the nav element', () => {
    render(<BottomNav />)
    expect(screen.getByRole('navigation', { name: /navegacion principal/i })).toBeInTheDocument()
  })

  it('renders Dashboard nav link', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('renders Ingresos nav link', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /ingresos/i })).toBeInTheDocument()
  })

  it('renders Egresos nav link', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /egresos/i })).toBeInTheDocument()
  })

  it('renders FAB button', () => {
    render(<BottomNav />)
    expect(screen.getByRole('button', { name: /abrir acciones rapidas/i })).toBeInTheDocument()
  })

  it('opens quick action sheet when FAB is clicked', () => {
    render(<BottomNav />)
    const fab = screen.getByRole('button', { name: /abrir acciones rapidas/i })
    fireEvent.click(fab)
    expect(screen.getByRole('dialog', { name: /acciones rapidas/i })).toBeInTheDocument()
  })

  it('shows quick action items in sheet', () => {
    render(<BottomNav />)
    fireEvent.click(screen.getByRole('button', { name: /abrir acciones rapidas/i }))
    expect(screen.getByText('Nuevo ingreso')).toBeInTheDocument()
    expect(screen.getByText('Nuevo egreso')).toBeInTheDocument()
  })

  it('closes quick action sheet when backdrop is clicked', () => {
    render(<BottomNav />)
    fireEvent.click(screen.getByRole('button', { name: /abrir acciones rapidas/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const backdrop = document.querySelector('[aria-hidden="true"]')!
    fireEvent.click(backdrop)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FAB aria-label changes when sheet is open', () => {
    render(<BottomNav />)
    const fab = screen.getByRole('button', { name: /abrir acciones rapidas/i })
    fireEvent.click(fab)
    expect(screen.getByRole('button', { name: /cerrar acciones rapidas/i })).toBeInTheDocument()
  })

  it('navigates to /ingresos when clicking quick action', () => {
    render(<BottomNav />)
    fireEvent.click(screen.getByRole('button', { name: /abrir acciones rapidas/i }))
    fireEvent.click(screen.getByText('Nuevo ingreso'))
    expect(mockNavigate).toHaveBeenCalledWith('/ingresos')
  })

  it('renders Presupuestos nav link', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /presupuestos/i })).toBeInTheDocument()
  })

  it('FAB menu appears above button', () => {
    render(<BottomNav />)
    fireEvent.click(screen.getByRole('button', { name: /abrir acciones rapidas/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('bottom-full')
  })

  it('FAB menu closes when clicking outside', () => {
    render(<BottomNav />)
    fireEvent.click(screen.getByRole('button', { name: /abrir acciones rapidas/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // The backdrop covers the full screen and represents "outside" — clicking it closes the menu
    const backdrop = document.querySelector('div[aria-hidden="true"]')!
    fireEvent.click(backdrop)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
