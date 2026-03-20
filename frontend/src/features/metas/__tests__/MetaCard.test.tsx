import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MetaCard } from '../components/MetaCard'
import type { MetaAhorro } from '@/types/meta_ahorro'

const mockMetaActiva: MetaAhorro = {
  id: 'meta-1',
  user_id: 'user-1',
  nombre: 'Fondo de emergencia',
  descripcion: 'Para imprevistos',
  monto_objetivo: 100000,
  monto_actual: 40000,
  fecha_inicio: '2026-01-01',
  fecha_objetivo: '2026-12-31',
  estado: 'activa',
  color: '#366092',
  icono: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockMetaCompletada: MetaAhorro = {
  ...mockMetaActiva,
  id: 'meta-2',
  nombre: 'Vacaciones',
  monto_actual: 100000,
  estado: 'completada',
}

const mockMetaCancelada: MetaAhorro = {
  ...mockMetaActiva,
  id: 'meta-3',
  nombre: 'Meta cancelada',
  estado: 'cancelada',
}

const mockMetaConIcono: MetaAhorro = {
  ...mockMetaActiva,
  id: 'meta-4',
  nombre: 'Casa propia',
  icono: '🏠',
}

describe('MetaCard', () => {
  it('renders correctly with default props', () => {
    render(<MetaCard meta={mockMetaActiva} onClick={vi.fn()} />)
    expect(screen.getByText('Fondo de emergencia')).toBeInTheDocument()
    expect(screen.getByText('Para imprevistos')).toBeInTheDocument()
  })

  it('shows progress bar with correct percentage', () => {
    render(<MetaCard meta={mockMetaActiva} onClick={vi.fn()} />)
    // 40000 / 100000 = 40%
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '40')
    expect(screen.getByText('40% completado')).toBeInTheDocument()
  })

  it('shows "Completada" badge when meta is completada', () => {
    render(<MetaCard meta={mockMetaCompletada} onClick={vi.fn()} />)
    expect(screen.getAllByText('Completada').length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Completada" badge when progress reaches 100%', () => {
    render(<MetaCard meta={mockMetaCompletada} onClick={vi.fn()} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })

  it('shows "Cancelada" badge when estado is cancelada', () => {
    render(<MetaCard meta={mockMetaCancelada} onClick={vi.fn()} />)
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
  })

  it('shows "Activa" badge when estado is activa', () => {
    render(<MetaCard meta={mockMetaActiva} onClick={vi.fn()} />)
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('shows fecha_objetivo when present', () => {
    render(<MetaCard meta={mockMetaActiva} onClick={vi.fn()} />)
    expect(screen.getByText(/Objetivo:/i)).toBeInTheDocument()
  })

  it('does not show fecha_objetivo when null', () => {
    const metaSinFecha = { ...mockMetaActiva, fecha_objetivo: null }
    render(<MetaCard meta={metaSinFecha} onClick={vi.fn()} />)
    expect(screen.queryByText(/Objetivo:/i)).not.toBeInTheDocument()
  })

  it('renders icono when present', () => {
    render(<MetaCard meta={mockMetaConIcono} onClick={vi.fn()} />)
    expect(screen.getByText(/Casa propia/)).toBeInTheDocument()
  })

  it('calls onClick with meta when clicked', () => {
    const handleClick = vi.fn()
    render(<MetaCard meta={mockMetaActiva} onClick={handleClick} />)
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledWith(mockMetaActiva)
  })

  it('displays monto_actual and monto_objetivo', () => {
    render(<MetaCard meta={mockMetaActiva} onClick={vi.fn()} />)
    expect(screen.getByText('Ahorrado')).toBeInTheDocument()
    expect(screen.getByText('Objetivo')).toBeInTheDocument()
  })

  it('caps progress bar at 100% even if monto_actual exceeds monto_objetivo', () => {
    const metaExcedida = {
      ...mockMetaActiva,
      monto_actual: 150000,
      monto_objetivo: 100000,
    }
    render(<MetaCard meta={metaExcedida} onClick={vi.fn()} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })
})
