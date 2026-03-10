import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Avatar } from '../avatar'

describe('Avatar', () => {
  it('renders initials from single-word name', () => {
    render(<Avatar name="Juan" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders two initials from two-word name', () => {
    render(<Avatar name="Juan Perez" />)
    expect(screen.getByText('JP')).toBeInTheDocument()
  })

  it('renders initials uppercased', () => {
    render(<Avatar name="ana lopez" />)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('takes only the first two words for initials', () => {
    render(<Avatar name="Maria del Carmen Lopez" />)
    expect(screen.getByText('MD')).toBeInTheDocument()
  })

  it('renders "?" when name is undefined', () => {
    render(<Avatar />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders an img when src is provided', () => {
    render(<Avatar name="Test" src="https://example.com/avatar.jpg" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('uses name as alt text on img', () => {
    render(<Avatar name="Juan Perez" src="https://example.com/avatar.jpg" />)
    expect(screen.getByAltText('Juan Perez')).toBeInTheDocument()
  })

  it('applies sm size classes', () => {
    const { container } = render(<Avatar name="AB" size="sm" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('w-8')
    expect(el.className).toContain('h-8')
  })

  it('applies lg size classes', () => {
    const { container } = render(<Avatar name="AB" size="lg" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('w-12')
    expect(el.className).toContain('h-12')
  })

  it('applies custom className', () => {
    const { container } = render(<Avatar name="AB" className="border-2" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('border-2')
  })
})
