import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BudgetProgressBar } from '../components/BudgetProgressBar'

describe('BudgetProgressBar', () => {
  it('renders correctly with default props', () => {
    render(<BudgetProgressBar porcentaje={50} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows green color when porcentaje < 80', () => {
    render(<BudgetProgressBar porcentaje={50} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.className).toContain('bg-prosperity-green')
  })

  it('shows yellow color when porcentaje is between 80 and 99', () => {
    render(<BudgetProgressBar porcentaje={85} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.className).toContain('bg-golden-flow')
  })

  it('shows red color when porcentaje >= 100', () => {
    render(<BudgetProgressBar porcentaje={100} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.className).toContain('bg-alert-red')
  })

  it('shows red color when porcentaje > 100', () => {
    render(<BudgetProgressBar porcentaje={120} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.className).toContain('bg-alert-red')
  })

  it('sets aria-valuenow to rounded porcentaje', () => {
    render(<BudgetProgressBar porcentaje={70.6} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '71')
  })

  it('caps width at 100% when porcentaje exceeds 100', () => {
    render(<BudgetProgressBar porcentaje={150} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.style.width).toBe('100%')
  })

  it('sets aria-valuemin and aria-valuemax', () => {
    render(<BudgetProgressBar porcentaje={50} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('accepts custom aria-label', () => {
    render(
      <BudgetProgressBar
        porcentaje={50}
        aria-label="50% del presupuesto usado"
      />
    )
    expect(
      screen.getByRole('progressbar', { name: '50% del presupuesto usado' })
    ).toBeInTheDocument()
  })

  it('shows yellow color at exactly 80%', () => {
    render(<BudgetProgressBar porcentaje={80} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.className).toContain('bg-golden-flow')
  })

  it('shows green when porcentaje is 0', () => {
    render(<BudgetProgressBar porcentaje={0} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.className).toContain('bg-prosperity-green')
  })
})
