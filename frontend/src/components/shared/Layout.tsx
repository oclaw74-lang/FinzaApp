import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { StatsBar } from './StatsBar'
import { CommandPalette } from './CommandPalette'
import { BottomNav } from './BottomNav'
import { useUiStore } from '@/store/uiStore'
import { useGenerarNotificaciones } from '@/hooks/useNotificaciones'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { cn } from '@/lib/utils'

export function Layout(): JSX.Element {
  const { sidebarCollapsed } = useUiStore()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const generarNotificaciones = useGenerarNotificaciones()

  // Sync all Supabase tables in real-time via Postgres changes
  useRealtimeSync()

  // Evaluate notification triggers once per session on app load
  useEffect(() => {
    generarNotificaciones.mutate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cursor glow mouse handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--cx', `${e.clientX}px`)
      document.documentElement.style.setProperty('--cy', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  // Ctrl/Cmd+K command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen bg-background relative">
      {/* Cursor glow — dark mode only via CSS .dark selector */}
      <div id="cursor-glow" aria-hidden="true" />

      {/* Ambient blobs — dark mode only */}
      <div
        className="dark:block hidden pointer-events-none fixed inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <Sidebar />

      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300 relative z-10',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        )}
      >
        <Header />
        <StatsBar />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  )
}
