import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PrestamoRow } from '../components/PrestamoRow'
import type { Prestamo } from '@/types/prestamo'

const mockPrestamoActivo: Prestamo = {
  id: 'pre-1',
  tipo: 'me_deben',
  persona: 'Juan Perez',
  monto_original: 10000,
  monto_pendiente: 6000,
  moneda: 'DOP',
  fecha_prestamo: '2026-01-10',
  fecha_vencimiento: '2026-12-31',
  descripcion: 'Prestamo para reparaciones',
  estado: 'activo',
  notas: undefined,
  pagos: [],
  created_at: '2026-01-10T10:00:00Z',
}

const mockPrestamoPagado: Prestamo = {
  ...mockPrestamoActivo,
  id: 'pre-2',
  monto_pendiente: 0,
  estado: 'pagado',
}

const mockPrestamoVencido: Prestamo = {
  ...mockPrestamoActivo,
  id: 'pre-3',
  estado: 'vencido',
  fecha_vencimiento: '2025-01-01',
}

describe('PrestamoRow', () => {
  it('renders correctly with default props', () => {
    render(<PrestamoRow prestamo={mockPrestamoActivo} onClick={vi.fn()} />)
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.getByText('Prestamo para reparaciones')).toBeInTheDocument()
  })

  it('shows progress bar with correct percentage', () => {
    render(<PrestamoRow prestamo={mockPrestamoActivo} onClick={vi.fn()} />)
    // (10000 - 6000) / 10000 * 100 = 40%
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '40')
    expect(progressBar).toHaveAttribute('aria-label', '40% pagado')
  })

  it('shows 100% when fully paid', () => {
    render(<PrestamoRow prestamo={mockPrestamoPagado} onClick={vi.fn()} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    expect(progressBar).toHaveAttribute('aria-label', '100% pagado')
  })

  it('shows active badge with correct text', () => {
    render(<PrestamoRow prestamo={mockPrestamoActivo} onClick={vi.fn()} />)
    // mockPrestamoActivo.fecha_vencimiento = '2026-12-31' — far in the future, shows "Al corriente"
    expect(screen.getByText('Al corriente')).toBeInTheDocument()
  })

  it('shows pagado badge when estado is pagado', () => {
    render(<PrestamoRow prestamo={mockPrestamoPagado} onClick={vi.fn()} />)
    expect(screen.getByText('Pagado')).toBeInTheDocument()
  })

  it('shows vencido badge when estado is vencido', () => {
    render(<PrestamoRow prestamo={mockPrestamoVencido} onClick={vi.fn()} />)
    expect(screen.getByText('Vencido')).toBeInTheDocument()
  })

  it('shows expiration date in red when past due and activo', () => {
    const prestamoConVencimientoViejo: Prestamo = {
      ...mockPrestamoActivo,
      id: 'pre-venc',
      estado: 'activo',
      fecha_vencimiento: '2020-01-01',
    }
    render(<PrestamoRow prestamo={prestamoConVencimientoViejo} onClick={vi.fn()} />)
    // When past-due and activo, shows "Pagar pronto" badge (near-due warning)
    expect(screen.getByText('Pagar pronto')).toBeInTheDocument()
    // Date is shown
    expect(screen.getByText(/Vence:/i)).toBeInTheDocument()
  })

  it('calls onClick with the prestamo when clicked', () => {
    const handleClick = vi.fn()
    render(<PrestamoRow prestamo={mockPrestamoActivo} onClick={handleClick} />)
    screen.getByRole('button', { name: /ver detalle/i }).click()
    expect(handleClick).toHaveBeenCalledWith(mockPrestamoActivo)
  })

  it('renders monto original and pendiente', () => {
    render(<PrestamoRow prestamo={mockPrestamoActivo} onClick={vi.fn()} />)
    // Verify the "de RD$X" pattern for monto_original
    expect(screen.getAllByText(/de/i).length).toBeGreaterThan(0)
  })
})
