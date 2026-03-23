import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { NotFoundPage } from '@/pages/NotFoundPage'

describe('NotFoundPage', () => {
  const renderPage = () => render(<BrowserRouter><NotFoundPage /></BrowserRouter>)

  it('renders 404', () => {
    renderPage()
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders title', () => {
    renderPage()
    expect(screen.getByText('Pagina no encontrada')).toBeInTheDocument()
  })

  it('renders description text', () => {
    renderPage()
    expect(screen.getByText('La pagina que buscas no existe o fue movida.')).toBeInTheDocument()
  })

  it('renders link to home', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /volver al inicio/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })
})
