import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SurveyPage } from '@/pages/SurveyPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/api', () => ({
  apiClient: { post: vi.fn().mockResolvedValue({ data: {} }) },
}))

// Bypass zod validation so handleSubmit always calls onSubmit
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: any) => ({ values, errors: {} }),
}))

describe('SurveyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form', () => {
    render(<SurveyPage />)
    const form = document.querySelector('form')
    expect(form).toBeInTheDocument()
  })

  it('renders 5 star buttons in star rating', () => {
    const { container } = render(<SurveyPage />)
    const starButtons = container.querySelectorAll('button[type="button"]')
    expect(starButtons.length).toBeGreaterThanOrEqual(5)
  })

  it('submit button is disabled initially', () => {
    render(<SurveyPage />)
    const submitBtn = screen.getByRole('button', { name: /survey\.submit/i })
    expect(submitBtn).toBeDisabled()
  })

  it('clicking a star enables the submit button', () => {
    const { container } = render(<SurveyPage />)
    const starButtons = container.querySelectorAll<HTMLButtonElement>('button[type="button"]')
    expect(starButtons.length).toBeGreaterThan(0)
    fireEvent.click(starButtons[0])
    const submitBtn = screen.getByRole('button', { name: /survey\.submit/i })
    expect(submitBtn).not.toBeDisabled()
  })

  it('after form submission shows success state', async () => {
    const { container } = render(<SurveyPage />)
    const starButtons = container.querySelectorAll<HTMLButtonElement>('button[type="button"]')
    fireEvent.click(starButtons[0])
    const submitBtn = screen.getByRole('button', { name: /survey\.submit/i })
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /survey\.submit/i })).not.toBeInTheDocument()
    })
  })
})
