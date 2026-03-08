import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TransaccionRow } from '../TransaccionRow'
import type { IngresoResponse } from '@/types/transacciones'

const mockIngreso: IngresoResponse = {
  id: 'ing-1',
  categoria_id: 'cat-1',
  subcategoria_id: null,
  monto: '3500.00',
  moneda: 'DOP',
  descripcion: 'Pago de cliente',
  fuente: 'Freelance',
  fecha: '2026-01-20',
  notas: null,
}

describe('TransaccionRow', () => {
  it('renders correctly with default props', () => {
    render(
      <TransaccionRow
        transaccion={mockIngreso}
        tipo="ingreso"
        categoriaNombre="Servicios"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText('Pago de cliente')).toBeInTheDocument()
  })

  it('displays category name when description is null', () => {
    const ingresoSinDesc = { ...mockIngreso, descripcion: null }
    render(
      <TransaccionRow
        transaccion={ingresoSinDesc}
        tipo="ingreso"
        categoriaNombre="Servicios"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    const serviciosElements = screen.getAllByText('Servicios')
    expect(serviciosElements.length).toBeGreaterThan(0)
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(
      <TransaccionRow
        transaccion={mockIngreso}
        tipo="ingreso"
        categoriaNombre="Servicios"
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    )
    screen.getByRole('button', { name: /editar/i }).click()
    expect(onEdit).toHaveBeenCalledWith(mockIngreso)
  })

  it('calls onDelete with correct id when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(
      <TransaccionRow
        transaccion={mockIngreso}
        tipo="ingreso"
        categoriaNombre="Servicios"
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    )
    screen.getByRole('button', { name: /eliminar/i }).click()
    expect(onDelete).toHaveBeenCalledWith('ing-1')
  })

  it('renders edit and delete action buttons', () => {
    render(
      <TransaccionRow
        transaccion={mockIngreso}
        tipo="ingreso"
        categoriaNombre="Servicios"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument()
  })
})
