import { Menu } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

export function Header(): JSX.Element {
  const { setSidebarOpen } = useUiStore()

  return (
    <header
      className={cn(
        'sticky top-0 z-10 h-16 flex items-center px-4',
        'backdrop-blur-md border-b',
        'bg-white/80 border-gray-200/60 dark:bg-[#0a0f1e]/85 dark:border-white/[0.06]'
      )}
      style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}
    >
      {/* Mobile hamburger only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>
    </header>
  )
}
