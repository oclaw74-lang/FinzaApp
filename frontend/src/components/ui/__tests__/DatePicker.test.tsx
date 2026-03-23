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
    const { container } = render(<DatePicker defaultValue="2026-03-15" />)
    const input = container.querySelector('input[type="date"]') as HTMLInputElement
    expect(input.value).toBe('2026-03-15')
  })

  it('calls onChange with native event when date selected', () => {
    const handleChange = vi.fn()
    render(<DatePicker defaultValue="" onChange={handleChange} label="Fecha" />)
    const input = screen.getByLabelText('Fecha') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-06-01' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
    // Native onChange receives a ChangeEvent, not a plain string
    const event = handleChange.mock.calls[0][0] as { target: { value: string } }
    expect(event.target.value).toBe('2026-06-01')
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
