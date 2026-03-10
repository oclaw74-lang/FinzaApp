import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PresupuestoCard } from '../components/PresupuestoCard'
import type { PresupuestoEstado } from '@/types/presupuesto'

const mockEstadoNormal: PresupuestoEstado = {
  id: 'pres-1',
  categoria_id: 'cat-1',
  categoria_nombre: 'Alimentacion',
  mes: 3,
  year: 2026,
  monto_limite: 500,
  gasto_actual: 350,
  porcentaje_usado: 70,
  alerta: false,
}

const mockEstadoAlerta: PresupuestoEstado = {
  ...mockEstadoNormal,
  id: 'pres-2',
  categoria_nombre: 'Transporte',
  gasto_actual: 480,
  porcentaje_usado: 96,
  alerta: true,
}

const mockEstadoExcedido: PresupuestoEstado = {
  ...mockEstadoNormal,
  id: 'pres-3',
  categoria_nombre: 'Entretenimiento',
  gasto_actual: 600,
  porcentaje_usado: 120,
  alerta: true,
}

describe('PresupuestoCard', () => {
  it('renders correctly with default props', () => {
    render(<PresupuestoCard estado={mockEstadoNormal} onClick={vi.fn()} />)
    expect(screen.getByText('Alimentacion')).toBeInTheDocument()
  })

  it('shows progress bar with correct percentage', () => {
    render(<PresupuestoCard estado={mockEstadoNormal} onClick={vi.fn()} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '70')
    expect(screen.getByText('70% usado')).toBeInTheDocument()
  })

  it('does not show alert badge when alerta is false', () => {
    render(<PresupuestoCard estado={mockEstadoNormal} onClick={vi.fn()} />)
    expect(screen.queryByText(/alerta/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/excedido/i)).not.toBeInTheDocument()
  })

  it('shows Alerta badge when alerta is true and not exceeded', () => {
    render(<PresupuestoCard estado={mockEstadoAlerta} onClick={vi.fn()} />)
    expect(screen.getByText(/alerta/i)).toBeInTheDocument()
    expect(screen.queryByText(/excedido/i)).not.toBeInTheDocument()
  })

  it('shows Excedido badge when porcentaje_usado >= 100', () => {
    render(<PresupuestoCard estado={mockEstadoExcedido} onClick={vi.fn()} />)
    expect(screen.getByText(/excedido/i)).toBeInTheDocument()
    expect(screen.queryByText(/alerta/i)).not.toBeInTheDocument()
  })

  it('calls onClick with estado when clicked', () => {
    const handleClick = vi.fn()
    render(<PresupuestoCard estado={mockEstadoNormal} onClick={handleClick} />)
    screen
      .getByRole('button', { name: /editar presupuesto de alimentacion/i })
      .click()
    expect(handleClick).toHaveBeenCalledWith(mockEstadoNormal)
  })

  it('caps visual width at 100% when porcentaje_usado exceeds 100', () => {
    render(<PresupuestoCard estado={mockEstadoExcedido} onClick={vi.fn()} />)
    const progressBar = screen.getByRole('progressbar')
    // aria-valuenow reflects real usage; the visual width is capped via style
    expect(progressBar).toHaveAttribute('aria-valuenow')
    expect(Number(progressBar.style.width.replace('%', ''))).toBeLessThanOrEqual(100)
  })

  it('shows gastado and limite labels', () => {
    render(<PresupuestoCard estado={mockEstadoNormal} onClick={vi.fn()} />)
    expect(screen.getByText('Gastado')).toBeInTheDocument()
    expect(screen.getByText('Limite')).toBeInTheDocument()
  })
})
