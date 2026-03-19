import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Command {
  id: string
  label: string
  icon: string
  path: string
}

const COMMANDS: Command[] = [
  { id: 'dashboard', label: 'Ir a Dashboard', icon: '📊', path: '/' },
  { id: 'ingresos', label: 'Ir a Ingresos', icon: '💰', path: '/ingresos' },
  { id: 'egresos', label: 'Ir a Egresos', icon: '💸', path: '/egresos' },
  { id: 'presupuestos', label: 'Ir a Presupuestos', icon: '📋', path: '/presupuestos' },
  { id: 'prestamos', label: 'Ir a Préstamos', icon: '🏦', path: '/prestamos' },
  { id: 'metas', label: 'Ir a Metas', icon: '🎯', path: '/metas' },
  { id: 'tarjetas', label: 'Ir a Tarjetas', icon: '💳', path: '/tarjetas' },
  { id: 'recurrentes', label: 'Ir a Recurrentes', icon: '🔄', path: '/recurrentes' },
  { id: 'categorias', label: 'Ir a Categorias', icon: '🏷️', path: '/categorias' },
  { id: 'configuracion', label: 'Configuracion', icon: '⚙️', path: '/configuracion' },
]

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps): JSX.Element | null {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = query.trim()
    ? COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const execute = (command: Command) => {
    navigate(command.path)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) execute(filtered[activeIndex])
    }
  }

  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-2xl border border-[var(--border-strong)] overflow-hidden',
          'bg-[var(--surface)] shadow-2xl animate-slide-up'
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search size={16} className="text-[var(--text-muted)] shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pagina o accion..."
            className={cn(
              'flex-1 bg-transparent text-[var(--text-primary)] text-sm placeholder:text-[var(--text-subtle)]',
              'outline-none'
            )}
            aria-label="Buscar comando"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={filtered[activeIndex] ? `cmd-${filtered[activeIndex].id}` : undefined}
          />
          <kbd
            className={cn(
              'text-[10px] font-mono px-1.5 py-0.5 rounded',
              'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)]'
            )}
          >
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <ul
          id="command-list"
          ref={listRef}
          className="max-h-72 overflow-y-auto py-1"
          role="listbox"
          aria-label="Comandos disponibles"
        >
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-[var(--text-muted)] text-center">
              Sin resultados para &quot;{query}&quot;
            </li>
          )}
          {filtered.map((cmd, i) => (
            <li
              key={cmd.id}
              id={`cmd-${cmd.id}`}
              role="option"
              aria-selected={i === activeIndex}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-100',
                i === activeIndex
                  ? 'bg-[var(--accent-muted)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'
              )}
              onClick={() => execute(cmd)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="text-base leading-none" aria-hidden="true">{cmd.icon}</span>
              <span className="text-sm font-medium flex-1">{cmd.label}</span>
              {i === activeIndex && (
                <kbd
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.5 rounded',
                    'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]'
                  )}
                >
                  Enter
                </kbd>
              )}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div
          className={cn(
            'flex items-center gap-4 px-4 py-2 border-t border-[var(--border)]',
            'text-[10px] text-[var(--text-subtle)]'
          )}
        >
          <span><kbd className="font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono">Enter</kbd> seleccionar</span>
          <span><kbd className="font-mono">ESC</kbd> cerrar</span>
        </div>
      </div>
    </div>
  )
}
