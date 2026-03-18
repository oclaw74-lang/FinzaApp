import { Menu } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

export function Header(): JSX.Element {
  const { setSidebarOpen } = useUiStore()

  return (
    <header
      className={cn(
        'lg:hidden sticky top-0 z-50 h-14 flex items-center justify-between px-4',
        'bg-[#04080f]/90 backdrop-blur-md border-b border-white/[0.06]'
      )}
    >
      <button
        onClick={() => setSidebarOpen(true)}
        className="text-[#657a9e] hover:text-[#e8f0ff] transition-colors p-1 -ml-1"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      {/* Logo centered in mobile header */}
      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <img src="/logo.svg" alt="Finza" className="w-7 h-7" />
        <span
          className="font-bold text-base tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #ffffff, #a0b4cc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Finza
        </span>
      </div>

      {/* Spacer to keep hamburger left-aligned and logo truly centered */}
      <div className="w-8" aria-hidden="true" />
    </header>
  )
}
