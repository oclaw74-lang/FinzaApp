import { NavLink } from 'react-router-dom'
import { BarChart3, TrendingUp, TrendingDown, Settings, Target, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'

const navItems = [
  { to: '/', icon: BarChart3, label: 'Dashboard' },
  { to: '/ingresos', icon: TrendingUp, label: 'Ingresos' },
  { to: '/egresos', icon: TrendingDown, label: 'Egresos' },
  { to: '/presupuestos', icon: Target, label: 'Presupuestos' },
  { to: '/reportes', icon: FileText, label: 'Reportes' },
  { to: '/configuracion', icon: Settings, label: 'Configuracion' },
]

export function Sidebar(): JSX.Element {
  const { sidebarOpen, setSidebarOpen } = useUiStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-30 bg-finza-blue text-white transition-transform duration-300 ease-in-out',
          'w-64 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-finza-blue-light/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-golden-flow rounded-lg flex items-center justify-center">
              <span className="font-bold text-finza-blue text-sm">F</span>
            </div>
            <span className="font-bold text-xl">Finza</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
            aria-label="Cerrar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon size={20} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
