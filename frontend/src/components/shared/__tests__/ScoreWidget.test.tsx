import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

const renderWidget = (props?: { collapsed?: boolean }) =>
  render(<MemoryRouter><ScoreWidget {...props} /></MemoryRouter>)

describe('ScoreWidget', () => {
  it('renders score number', () => {
    vi.mocked(useScore).mockReturnValue({ data: mockScoreBueno, isLoading: false } as ReturnType<typeof useScore>)
    renderWidget()
    expect(screen.getByText(/75/)).toBeInTheDocument()
  })

  it('renders estado label for bueno', () => {
    vi.mocked(useScore).mockReturnValue({ data: mockScoreBueno, isLoading: false } as ReturnType<typeof useScore>)
    renderWidget()
    expect(screen.getByText('Bueno')).toBeInTheDocument()
  })

  it('renders skeleton when loading', () => {
    vi.mocked(useScore).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<typeof useScore>)
    const { container } = render(<MemoryRouter><ScoreWidget /></MemoryRouter>)
    expect(screen.queryByText(/\/100/)).not.toBeInTheDocument()
    expect(container.querySelector('[class*="animate-pulse"]')).not.toBeNull()
  })

  it('renders critico score with correct display', () => {
    vi.mocked(useScore).mockReturnValue({ data: mockScoreCritico, isLoading: false } as ReturnType<typeof useScore>)
    renderWidget()
    expect(screen.getByText(/25/)).toBeInTheDocument()
    expect(screen.getByText('Critico')).toBeInTheDocument()
  })

  it('renders collapsed mode with just number', () => {
    vi.mocked(useScore).mockReturnValue({ data: mockScoreBueno, isLoading: false } as ReturnType<typeof useScore>)
    renderWidget({ collapsed: true })
    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.queryByText('Bueno')).not.toBeInTheDocument()
  })

  it('renders score title in expanded mode', () => {
    vi.mocked(useScore).mockReturnValue({ data: mockScoreBueno, isLoading: false } as ReturnType<typeof useScore>)
    renderWidget()
    expect(screen.getByText('Score financiero')).toBeInTheDocument()
  })
})
