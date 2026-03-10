import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KpiCard } from '../components/v2/KpiCard'
import { TrendingUp } from 'lucide-react'

const defaultProps = {
  title: 'Ingresos del mes',
  value: 'RD$10,000.00',
  icon: <TrendingUp size={18} />,
  iconBg: '#00B05020',
}

describe('KpiCard', () => {
  it('renders correctly with default props', () => {
    render(<KpiCard {...defaultProps} />)
    expect(screen.getByText('Ingresos del mes')).toBeInTheDocument()
    expect(screen.getByText('RD$10,000.00')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<KpiCard {...defaultProps} subtitle="vs. mes anterior" />)
    expect(screen.getByText('vs. mes anterior')).toBeInTheDocument()
  })

  it('shows positive variation with green color and up arrow', () => {
    render(<KpiCard {...defaultProps} variationPct={15.5} />)
    const badge = screen.getByLabelText(/incremento de 15.5%/i)
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('text-prosperity-green')
  })

  it('shows negative variation with red color and down arrow', () => {
    render(<KpiCard {...defaultProps} variationPct={-8.3} />)
    const badge = screen.getByLabelText(/reduccion de 8.3%/i)
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('text-alert-red')
  })

  it('shows dash when variation is zero', () => {
    render(<KpiCard {...defaultProps} variationPct={0} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('does not render variation when variationPct is undefined', () => {
    render(<KpiCard {...defaultProps} />)
    expect(screen.queryByText('—')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/incremento/i)).not.toBeInTheDocument()
  })

  it('applies custom value color class', () => {
    const { container } = render(
      <KpiCard {...defaultProps} valueColorClass="text-alert-red" />
    )
    const valueEl = container.querySelector('.text-alert-red')
    expect(valueEl).toBeInTheDocument()
  })

  it('renders skeleton correctly', () => {
    render(<KpiCard.Skeleton />)
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })
})
