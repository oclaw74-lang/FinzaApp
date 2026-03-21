import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScorePage } from '@/pages/ScorePage'

vi.mock('@/hooks/useScore', () => ({
  useScore: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { useScore } from '@/hooks/useScore'

const mockScoreData = {
  score: 72,
  estado: 'bueno',
  breakdown: { ahorro: 18, presupuesto: 20, deuda: 17, emergencia: 17 },
}

function setup({ data = mockScoreData as typeof mockScoreData | null, isLoading = false } = {}) {
  vi.mocked(useScore).mockReturnValue({ data, isLoading } as ReturnType<typeof useScore>)
}

describe('ScorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setup()
  })

  it('renders loading skeleton when isLoading', () => {
    setup({ data: null, isLoading: true })
    render(<ScorePage />)
    const pulsingElements = document.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('renders score number when data loaded', () => {
    render(<ScorePage />)
    expect(screen.getByText('72')).toBeInTheDocument()
  })

  it('renders back button', () => {
    render(<ScorePage />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders breakdown section', () => {
    render(<ScorePage />)
    expect(screen.getByText('score.detail.breakdown')).toBeInTheDocument()
  })

  it('shows no-data state when data is null', () => {
    setup({ data: null, isLoading: false })
    render(<ScorePage />)
    expect(screen.getByText('score.detail.noData')).toBeInTheDocument()
  })
})
