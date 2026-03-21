import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DatePicker } from '../DatePicker'

describe('DatePicker', () => {
  it('renders a date input', () => {
    const { container } = render(<DatePicker />)
    const input = container.querySelector('input[type="date"]')
    expect(input).not.toBeNull()
  })

  it('renders with correct value', () => {
    const { container } = render(<DatePicker value="2026-03-15" onChange={vi.fn()} />)
    const input = container.querySelector('input[type="date"]') as HTMLInputElement
    expect(input.value).toBe('2026-03-15')
  })

  it('calls onChange when date selected', () => {
    const handleChange = vi.fn()
    render(<DatePicker value="" onChange={handleChange} label="Fecha" />)
    const input = screen.getByLabelText('Fecha') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-06-01' } })
    expect(handleChange).toHaveBeenCalledWith('2026-06-01')
  })

  it('is disabled when disabled prop is true', () => {
    render(<DatePicker label="Fecha" disabled={true} />)
    const input = screen.getByLabelText('Fecha')
    expect(input).toBeDisabled()
  })

  it('shows error message when error prop provided', () => {
    render(<DatePicker error="Fecha requerida" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Fecha requerida')
  })

  it('renders label when provided', () => {
    render(<DatePicker label="Fecha de inicio" />)
    expect(screen.getByText('Fecha de inicio')).toBeInTheDocument()
  })
})
