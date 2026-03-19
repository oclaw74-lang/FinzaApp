import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MetaProgressItem } from '../components/v2/MetaProgressItem'
import type { MetaActivaV2 } from '@/types/dashboard'

const mockMeta: MetaActivaV2 = {
  nombre: 'Fondo de emergencia',
  monto_objetivo: 100000,
  monto_actual: 45000,
  porcentaje_completado: 45,
  fecha_limite: '2026-12-31',
}

const mockMetaSinFecha: MetaActivaV2 = {
  ...mockMeta,
  nombre: 'Vacaciones',
  fecha_limite: null,
}

const mockMetaCompleta: MetaActivaV2 = {
  ...mockMeta,
  nombre: 'Meta completada',
  monto_actual: 100000,
  porcentaje_completado: 100,
}

describe('MetaProgressItem', () => {
  it('renders meta name', () => {
    render(<MetaProgressItem meta={mockMeta} />)
    expect(screen.getByText('Fondo de emergencia')).toBeInTheDocument()
  })

  it('renders percentage label', () => {
    render(<MetaProgressItem meta={mockMeta} />)
    expect(screen.getByText('45%')).toBeInTheDocument()
  })

  it('renders progress bar with correct aria attributes', () => {
    render(<MetaProgressItem meta={mockMeta} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '45')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('shows fecha limite when provided', () => {
    render(<MetaProgressItem meta={mockMeta} />)
    expect(screen.getByText(/limite/i)).toBeInTheDocument()
  })

  it('does not show fecha limite when null', () => {
    render(<MetaProgressItem meta={mockMetaSinFecha} />)
    expect(screen.queryByText(/limite/i)).not.toBeInTheDocument()
  })

  it('shows monto_actual and monto_objetivo', () => {
    render(<MetaProgressItem meta={mockMeta} />)
    expect(screen.getByText(/45,000/)).toBeInTheDocument()
    expect(screen.getByText(/100,000/)).toBeInTheDocument()
  })

  it('renders green bar when 100% completed', () => {
    const { container } = render(<MetaProgressItem meta={mockMetaCompleta} />)
    const bar = container.querySelector('.bg-prosperity-green')
    expect(bar).toBeInTheDocument()
  })

  it('caps progress at 100% even if value exceeds 100', () => {
    render(<MetaProgressItem meta={{ ...mockMeta, porcentaje_completado: 120 }} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.style.width).toBe('100%')
  })
})
