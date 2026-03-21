import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { LandingPage } from '@/pages/LandingPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn().mockReturnValue({ user: null, isLoading: false }),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
  BrowserRouter: ({ children }: any) => <>{children}</>,
}))

import { BrowserRouter } from 'react-router-dom'

beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })) as any
})

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<LandingPage />)
    expect(container).toBeTruthy()
  })

  it('renders with BrowserRouter wrapper', () => {
    const { container } = render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    )
    expect(container).toBeTruthy()
  })

  it('has CTA links pointing to /register', () => {
    render(<LandingPage />)
    const registerLinks = document.querySelectorAll('a[href="/register"]')
    expect(registerLinks.length).toBeGreaterThan(0)
  })
})
