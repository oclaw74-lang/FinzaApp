import { Menu, Bell, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'

export function Header(): JSX.Element {
  const { user, signOut } = useAuthStore()
  const { toggleSidebar } = useUiStore()

  return (
    <header className="bg-white border-b border-border h-16 flex items-center px-6 gap-4 sticky top-0 z-10">
      <button
        onClick={toggleSidebar}
        className="text-gray-600 hover:text-finza-blue transition-colors lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="text-gray-500 hover:text-finza-blue transition-colors relative" aria-label="Notificaciones">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={18} className="text-finza-blue" />
          <span className="hidden sm:block">{user?.email}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          aria-label="Cerrar sesion"
          title="Cerrar sesion"
        >
          <LogOut size={18} className="text-gray-500 hover:text-alert-red transition-colors" />
        </Button>
      </div>
    </header>
  )
}
