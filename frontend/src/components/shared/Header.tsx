import { Menu } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

export function Header(): JSX.Element {
  const { setSidebarOpen } = useUiStore()

  return (
    <header
      className={cn(
        'lg:hidden sticky top-0 z-50 h-14 flex items-center px-4',
        'bg-[#04080f]/90 backdrop-blur-md border-b border-white/[0.06]'
      )}
    >
      <button
        onClick={() => setSidebarOpen(true)}
        className="text-[#657a9e] hover:text-[#e8f0ff] transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>
    </header>
  )
}
