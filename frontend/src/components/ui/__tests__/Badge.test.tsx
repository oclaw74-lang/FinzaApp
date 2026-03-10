import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '../badge'

describe('Badge', () => {
  it('renders correctly with default (neutral) variant', () => {
    render(<Badge>Neutral</Badge>)
    expect(screen.getByText('Neutral')).toBeInTheDocument()
  })

  it('renders success variant with correct classes', () => {
    const { container } = render(<Badge variant="success">Activo</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-emerald-100')
    expect(el.className).toContain('text-emerald-800')
  })

  it('renders warning variant with correct classes', () => {
    const { container } = render(<Badge variant="warning">Alerta</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-amber-100')
    expect(el.className).toContain('text-amber-800')
  })

  it('renders danger variant with correct classes', () => {
    const { container } = render(<Badge variant="danger">Excedido</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-red-100')
    expect(el.className).toContain('text-red-800')
  })

  it('renders info variant with correct classes', () => {
    const { container } = render(<Badge variant="info">Info</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-blue-100')
    expect(el.className).toContain('text-blue-800')
  })

  it('applies extra className passed as prop', () => {
    const { container } = render(<Badge className="ml-2">Extra</Badge>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('ml-2')
  })

  it('renders as a span element', () => {
    const { container } = render(<Badge>Test</Badge>)
    expect(container.firstChild?.nodeName).toBe('SPAN')
  })
})
