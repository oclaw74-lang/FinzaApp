import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TransaccionItem } from '../components/v2/TransaccionItem'
import type { UltimaTransaccionV2 } from '@/types/dashboard'

const ingresoMock: UltimaTransaccionV2 = {
  tipo: 'ingreso',
  descripcion: 'Salario mensual',
  monto: 50000,
  fecha: '2026-03-01',
  categoria: 'Salarios',
}

const egresoMock: UltimaTransaccionV2 = {
  tipo: 'egreso',
  descripcion: 'Supermercado',
  monto: 2500.5,
  fecha: '2026-03-05',
  categoria: 'Alimentacion',
}

const egresoSinCategoria: UltimaTransaccionV2 = {
  tipo: 'egreso',
  descripcion: 'Gasto sin categoria',
  monto: 500,
  fecha: '2026-03-10',
  categoria: null,
}

describe('TransaccionItem', () => {
  it('renders description correctly', () => {
    render(<TransaccionItem transaccion={ingresoMock} />)
    expect(screen.getByText('Salario mensual')).toBeInTheDocument()
  })

  it('shows INGRESO badge for income transactions', () => {
    render(<TransaccionItem transaccion={ingresoMock} />)
    expect(screen.getByText('INGRESO')).toBeInTheDocument()
  })

  it('shows EGRESO badge for expense transactions', () => {
    render(<TransaccionItem transaccion={egresoMock} />)
    expect(screen.getByText('EGRESO')).toBeInTheDocument()
  })

  it('shows categoria when provided', () => {
    render(<TransaccionItem transaccion={egresoMock} />)
    expect(screen.getByText(/alimentacion/i)).toBeInTheDocument()
  })

  it('does not show categoria section when null', () => {
    render(<TransaccionItem transaccion={egresoSinCategoria} />)
    expect(screen.queryByText(/alimentacion/i)).not.toBeInTheDocument()
  })

  it('formats monto as currency', () => {
    render(<TransaccionItem transaccion={ingresoMock} />)
    expect(screen.getByText(/50,000/)).toBeInTheDocument()
  })

  it('shows + prefix for ingresos', () => {
    render(<TransaccionItem transaccion={ingresoMock} />)
    const montoEl = screen.getByText(/\+RD\$/)
    expect(montoEl).toBeInTheDocument()
  })

  it('shows - prefix for egresos', () => {
    render(<TransaccionItem transaccion={egresoMock} />)
    const montoEl = screen.getByText(/-RD\$/)
    expect(montoEl).toBeInTheDocument()
  })
})
