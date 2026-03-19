import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TransaccionesList } from '../TransaccionesList'
import type { IngresoResponse, CategoriaResponse } from '@/types/transacciones'

const mockCategorias: CategoriaResponse[] = [
  { id: 'cat-1', nombre: 'Salario', tipo: 'ingreso', icono: null, color: null, es_sistema: true },
]

const mockIngresos: IngresoResponse[] = [
  {
    id: 'ing-1',
    categoria_id: 'cat-1',
    subcategoria_id: null,
    monto: '5000.00',
    moneda: 'DOP',
    descripcion: 'Salario enero',
    fuente: 'Empresa',
    fecha: '2026-01-15',
    notas: null,
  },
]

describe('TransaccionesList', () => {
  it('renders skeleton loaders while loading', () => {
    render(
      <TransaccionesList
        transacciones={[]}
        tipo="ingreso"
        categorias={[]}
        isLoading={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/cargando transacciones/i)).toBeInTheDocument()
  })

  it('shows empty state when no transactions', () => {
    render(
      <TransaccionesList
        transacciones={[]}
        tipo="ingreso"
        categorias={[]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText(/no hay ingresos registrados/i)).toBeInTheDocument()
  })

  it('shows empty state for egresos type', () => {
    render(
      <TransaccionesList
        transacciones={[]}
        tipo="egreso"
        categorias={[]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText(/no hay egresos registrados/i)).toBeInTheDocument()
  })

  it('renders transaction rows when data is provided', () => {
    render(
      <TransaccionesList
        transacciones={mockIngresos}
        tipo="ingreso"
        categorias={mockCategorias}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText('Salario enero')).toBeInTheDocument()
  })

  it('shows categoria name when descripcion is null', () => {
    const ingresoSinDesc: IngresoResponse = {
      ...mockIngresos[0],
      id: 'ing-2',
      descripcion: null,
    }
    render(
      <TransaccionesList
        transacciones={[ingresoSinDesc]}
        tipo="ingreso"
        categorias={mockCategorias}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    const salarioElements = screen.getAllByText('Salario')
    expect(salarioElements.length).toBeGreaterThan(0)
  })
})
