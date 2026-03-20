import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ToggleGroup } from '../toggle-group'
import type { ToggleGroupOption } from '../toggle-group'

const OPTIONS: ToggleGroupOption[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Auto' },
]

describe('ToggleGroup', () => {
  it('renders all options', () => {
    render(
      <ToggleGroup value="light" onValueChange={vi.fn()} options={OPTIONS} />
    )
    expect(screen.getByText('Claro')).toBeInTheDocument()
    expect(screen.getByText('Oscuro')).toBeInTheDocument()
    expect(screen.getByText('Auto')).toBeInTheDocument()
  })

  it('calls onChange with selected value', () => {
    const handleChange = vi.fn()
    render(
      <ToggleGroup value="light" onValueChange={handleChange} options={OPTIONS} />
    )
    fireEvent.click(screen.getByText('Oscuro'))
    expect(handleChange).toHaveBeenCalledWith('dark')
  })

  it('marks active option with active class', () => {
    render(
      <ToggleGroup value="dark" onValueChange={vi.fn()} options={OPTIONS} />
    )
    const activeButton = screen.getByText('Oscuro').closest('button')!
    expect(activeButton).toHaveAttribute('aria-pressed', 'true')

    const inactiveButton = screen.getByText('Claro').closest('button')!
    expect(inactiveButton).toHaveAttribute('aria-pressed', 'false')
  })
})
