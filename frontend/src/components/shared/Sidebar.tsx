import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Settings,
  Target,
  FileText,
  X,
  HandCoins,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Tag,
  ShieldCheck,
  CreditCard,
  Trophy,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/ui/avatar'
import { ScoreWidget } from '@/components/shared/ScoreWidget'

const navItems = [
  { to: '/', icon: BarChart3, labelKey: 'nav.dashboard' },
  { to: '/ingresos', icon: TrendingUp, labelKey: 'nav.ingresos' },
  { to: '/egresos', icon: TrendingDown, labelKey: 'nav.egresos' },
  { to: '/prestamos', icon: HandCoins, labelKey: 'nav.prestamos' },
  { to: '/metas', icon: PiggyBank, labelKey: 'nav.metas' },
  { to: '/presupuestos', icon: Target, labelKey: 'nav.presupuestos' },
  { to: '/categorias', icon: Tag, labelKey: 'nav.categorias' },
  { to: '/fondo-emergencia', icon: ShieldCheck, labelKey: 'nav.fondoEmergencia' },
  { to: '/suscripciones', icon: CreditCard, labelKey: 'nav.suscripciones' },
  { to: '/retos', icon: Trophy, labelKey: 'nav.retos' },
  { to: '/educacion', icon: BookOpen, labelKey: 'nav.educacion' },
  { to: '/reportes', icon: FileText, labelKey: 'nav.reportes' },
  { to: '/configuracion', icon: Settings, labelKey: 'nav.configuracion' },
]

export function Sidebar(): JSX.Element {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useUiStore()
  const { user, signOut } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const userName =
    user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Usuario'

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300 ease-in-out',
          'bg-sidebar text-sidebar-foreground',
          sidebarCollapsed ? 'w-[72px]' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo area */}
        <div
          className={cn(
            'flex items-center border-b border-white/10 h-16',
            sidebarCollapsed ? 'justify-center px-4' : 'px-5 justify-between'
          )}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                <span className="font-bold text-white text-sm">F</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Finza</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
              <span className="font-bold text-white text-sm">F</span>
            </div>
          )}

          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
            aria-label="Cerrar menu"
          >
            <X size={18} />
          </button>

          {/* Desktop collapse toggle */}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="hidden lg:flex text-white/40 hover:text-white transition-colors"
              aria-label="Colapsar sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex items-center justify-center h-8 mx-3 mt-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Expandir sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={sidebarCollapsed ? t(labelKey) : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150',
                  sidebarCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'px-3 py-2.5',
                  isActive
                    ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/70 text-white shadow-lg shadow-[var(--accent)]/20'
                    : 'text-[var(--sidebar-muted)] hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{t(labelKey)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Score widget */}
        <ScoreWidget collapsed={sidebarCollapsed} />

        {/* User section */}
        <div
          className={cn(
            'border-t border-white/10 p-3',
            sidebarCollapsed ? 'flex flex-col items-center gap-2' : ''
          )}
        >
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <Avatar name={userName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-white/50 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-white/40 hover:text-white transition-colors"
                title={t('auth.logout')}
                aria-label={t('auth.logout')}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Avatar name={userName} size="sm" />
              <button
                onClick={handleSignOut}
                className="text-white/40 hover:text-white transition-colors"
                title={t('auth.logout')}
                aria-label={t('auth.logout')}
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
