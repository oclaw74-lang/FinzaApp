import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImportarPage } from '@/pages/ImportarPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/hooks/useImport', () => ({
  useImportTransactions: vi.fn(),
}))

import { useImportTransactions } from '@/hooks/useImport'

function setupMocks() {
  vi.mocked(useImportTransactions).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ importados: 0, errores: [], duplicados_omitidos: 0 }),
    isPending: false,
    reset: vi.fn(),
  } as any)
}

describe('ImportarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders without crashing', () => {
    render(<ImportarPage />)
    expect(screen.getByText('importar.titulo')).toBeInTheDocument()
  })

  it('renders file upload area', () => {
    const { container } = render(<ImportarPage />)
    const fileInput = container.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
  })

  it('shows upload instructions', () => {
    render(<ImportarPage />)
    expect(screen.getByText('importar.arrastrarArchivo')).toBeInTheDocument()
  })

  it('renders step indicator with step labels', () => {
    render(<ImportarPage />)
    expect(screen.getByText('importar.paso1')).toBeInTheDocument()
    expect(screen.getByText('importar.paso2')).toBeInTheDocument()
    expect(screen.getByText('importar.paso3')).toBeInTheDocument()
  })
})
