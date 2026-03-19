import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EgresoCategoriaBar } from '../components/v2/EgresoCategoriaBar'
import type { EgresoCategoria } from '@/types/dashboard'

const mockItem: EgresoCategoria = {
  categoria: 'Alimentacion',
  total: 5000,
  porcentaje: 35.5,
}

describe('EgresoCategoriaBar', () => {
  it('renders category name', () => {
    render(<EgresoCategoriaBar item={mockItem} />)
    expect(screen.getByText('Alimentacion')).toBeInTheDocument()
  })

  it('renders percentage label', () => {
    render(<EgresoCategoriaBar item={mockItem} />)
    expect(screen.getByText('35.5%')).toBeInTheDocument()
  })

  it('renders total amount formatted', () => {
    render(<EgresoCategoriaBar item={mockItem} />)
    expect(screen.getByText(/5,000/)).toBeInTheDocument()
  })

  it('renders progress bar with correct aria attributes', () => {
    render(<EgresoCategoriaBar item={mockItem} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '36')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('caps progress bar width at 100% for values over 100', () => {
    render(<EgresoCategoriaBar item={{ ...mockItem, porcentaje: 150 }} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.style.width).toBe('100%')
  })

  it('renders zero percentage correctly', () => {
    render(<EgresoCategoriaBar item={{ ...mockItem, porcentaje: 0 }} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.style.width).toBe('0%')
  })
})
