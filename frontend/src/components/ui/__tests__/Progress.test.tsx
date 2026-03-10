import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Progress } from '../progress'

describe('Progress', () => {
  it('renders a progressbar with correct aria attributes', () => {
    const { container } = render(<Progress value={50} />)
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute('aria-valuenow', '50')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('renders bar width at 50% for value=50', () => {
    const { container } = render(<Progress value={50} />)
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.style.width).toBe('50%')
  })

  it('clamps value above 100 to 100%', () => {
    const { container } = render(<Progress value={150} />)
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.style.width).toBe('100%')
  })

  it('clamps value below 0 to 0%', () => {
    const { container } = render(<Progress value={-10} />)
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.style.width).toBe('0%')
  })

  it('uses bg-alert-red at 100%', () => {
    const { container } = render(<Progress value={100} />)
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.className).toContain('bg-alert-red')
  })

  it('uses bg-golden-flow at 80-99%', () => {
    const { container } = render(<Progress value={85} />)
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.className).toContain('bg-golden-flow')
  })

  it('uses bg-prosperity-green below 80%', () => {
    const { container } = render(<Progress value={50} />)
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.className).toContain('bg-prosperity-green')
  })

  it('uses custom colorClass when provided', () => {
    const { container } = render(<Progress value={50} colorClass="bg-blue-500" />)
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.className).toContain('bg-blue-500')
  })

  it('applies custom className to wrapper', () => {
    const { container } = render(<Progress value={50} className="h-4" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('h-4')
  })
})
