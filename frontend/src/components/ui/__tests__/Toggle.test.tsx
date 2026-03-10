import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Toggle } from '../toggle'

describe('Toggle', () => {
  it('renders without crashing', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders label text when provided', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} label="Modo oscuro" />)
    expect(screen.getByText('Modo oscuro')).toBeInTheDocument()
  })

  it('does not render label when not provided', () => {
    const onChange = vi.fn()
    const { queryByText } = render(<Toggle checked={false} onChange={onChange} />)
    expect(queryByText(/./)).toBeNull()
  })

  it('sets aria-checked to true when checked=true', () => {
    const onChange = vi.fn()
    render(<Toggle checked={true} onChange={onChange} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('sets aria-checked to false when checked=false', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange with true when clicked while unchecked', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange with false when clicked while checked', () => {
    const onChange = vi.fn()
    render(<Toggle checked={true} onChange={onChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('calls onChange when Enter key is pressed', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole('switch'), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange when Space key is pressed', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole('switch'), { key: ' ' })
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('applies bg-finza-blue class when checked', () => {
    const onChange = vi.fn()
    const { container } = render(<Toggle checked={true} onChange={onChange} />)
    const track = container.querySelector('[role="switch"]') as HTMLElement
    expect(track.className).toContain('bg-finza-blue')
  })

  it('applies custom className to wrapper label', () => {
    const onChange = vi.fn()
    const { container } = render(<Toggle checked={false} onChange={onChange} className="mt-4" />)
    const label = container.firstChild as HTMLElement
    expect(label.className).toContain('mt-4')
  })
})
