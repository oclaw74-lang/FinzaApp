import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ScoreWidget } from '@/components/shared/ScoreWidget'
import type { ScoreData } from '@/hooks/useScore'

vi.mock('@/hooks/useScore', () => ({ useScore: vi.fn() }))
import { useScore } from '@/hooks/useScore'

const mockScoreBueno: ScoreData = {
  score: 75,
  estado: 'bueno',
  breakdown: { ahorro: 20, presupuesto: 20, deuda: 20, emergencia: 15 },
}

const mockScoreCritico: ScoreData = {
  score: 25,
  estado: 'critico',
  breakdown: { ahorro: 5, presupuesto: 5, deuda: 10, emergencia: 5 },
}

describe('ScoreWidget', () => {
  it('renders score number', () => {
    vi.mocked(useScore).mockReturnValue({ data: mockScoreBueno, isLoading: false } as ReturnType<typeof useScore>)
    render(<ScoreWidget />)
    expect(screen.getByText(/75/)).toBeInTheDocument()
  })

  it('renders estado label for bueno', () => {
    vi.mocked(useScore).mockReturnValue({ data: mockScoreBueno, isLoading: false } as ReturnType<typeof useScore>)
    render(<ScoreWidget />)
    expect(screen.getByText('Bueno')).toBeInTheDocument()
  })

  it('renders skeleton when loading', () => {
    vi.mocked(useScore).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<typeof useScore>)
    const { container } = render(<ScoreWidget />)
    // Skeleton present, no score number
    expect(screen.queryByText(/\/100/)).not.toBeInTheDocument()
    expect(container.querySelector('[class*="animate-pulse"]')).not.toBeNull()
  })

  it('renders critico score with correct display', () => {
    vi.mocked(useScore).mockReturnValue({ data: mockScoreCritico, isLoading: false } as ReturnType<typeof useScore>)
    render(<ScoreWidget />)
    expect(screen.getByText(/25/)).toBeInTheDocument()
    expect(screen.getByText('Critico')).toBeInTheDocument()
  })

  it('renders collapsed mode with just number', () => {
    vi.mocked(useScore).mockReturnValue({ data: mockScoreBueno, isLoading: false } as ReturnType<typeof useScore>)
    render(<ScoreWidget collapsed={true} />)
    expect(screen.getByText('75')).toBeInTheDocument()
    // In collapsed mode, no label
    expect(screen.queryByText('Bueno')).not.toBeInTheDocument()
  })

  it('renders score title in expanded mode', () => {
    vi.mocked(useScore).mockReturnValue({ data: mockScoreBueno, isLoading: false } as ReturnType<typeof useScore>)
    render(<ScoreWidget />)
    expect(screen.getByText('Score financiero')).toBeInTheDocument()
  })
})
