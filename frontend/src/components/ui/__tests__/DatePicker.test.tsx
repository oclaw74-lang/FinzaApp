import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DatePicker } from '../DatePicker'

describe('DatePicker', () => {
  it('renders with placeholder when no value', () => {
    render(<DatePicker />)
    expect(screen.getByText('dd/MM/yyyy')).toBeInTheDocument()
  })

  it('renders formatted date when value provided', () => {
    render(<DatePicker value="2026-03-15" onChange={vi.fn()} />)
    expect(screen.getByText('15/03/2026')).toBeInTheDocument()
  })

  it('calls onChange when date selected', () => {
    const handleChange = vi.fn()
    render(<DatePicker value="" onChange={handleChange} placeholder="dd/MM/yyyy" />)
    // The native hidden input has aria-label equal to the placeholder
    const input = screen.getByLabelText('dd/MM/yyyy')
    fireEvent.change(input, { target: { value: '2026-06-01' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<DatePicker disabled={true} placeholder="dd/MM/yyyy" />)
    const input = screen.getByLabelText('dd/MM/yyyy')
    expect(input).toBeDisabled()
  })
})
